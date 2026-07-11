'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { isDashboardRoute } from '@/lib/dashboard-routes'

type ContentProtectionProps = {
  children: React.ReactNode
  /** @deprecated Kept for call-site compatibility; portal layouts should not wrap content. */
  showNotice?: boolean
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

function isMediaTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest('img, picture, video, canvas, svg, [data-protected-media]')
  )
}

/**
 * Soft public-site deterrence: block copy/cut/context-menu/drag/save shortcuts
 * and harden images/videos against casual download.
 * Not foolproof — auth + Firestore rules remain the real access control.
 */
export function PublicContentGuard() {
  const pathname = usePathname()
  const active = !isDashboardRoute(pathname)

  React.useEffect(() => {
    if (!active) {
      document.documentElement.removeAttribute('data-public-content-guard')
      return
    }

    document.documentElement.setAttribute('data-public-content-guard', '1')

    const hardenMedia = (root: ParentNode = document) => {
      root.querySelectorAll('img, video').forEach((el) => {
        if (el instanceof HTMLImageElement) {
          el.setAttribute('draggable', 'false')
          el.setAttribute('loading', el.getAttribute('loading') || 'lazy')
        }
        if (el instanceof HTMLVideoElement) {
          el.setAttribute('controlsList', 'nodownload noplaybackrate')
          el.disablePictureInPicture = true
        }
      })
    }

    hardenMedia()
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) hardenMedia(node)
          else if (node instanceof HTMLImageElement || node instanceof HTMLVideoElement) {
            hardenMedia(node.parentNode || document)
          }
        })
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    const blockClipboard = (e: ClipboardEvent) => {
      if (isEditableTarget(e.target)) return
      e.preventDefault()
    }

    const onContextMenu = (e: MouseEvent) => {
      if (isEditableTarget(e.target)) return
      e.preventDefault()
    }

    const onDragStart = (e: DragEvent) => {
      if (isEditableTarget(e.target)) return
      if (isMediaTarget(e.target) || !isEditableTarget(e.target)) {
        e.preventDefault()
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return
      const key = e.key.toLowerCase()
      const mod = e.ctrlKey || e.metaKey
      // Block common save / view-source / print / copy / select-all shortcuts
      if (
        mod &&
        (key === 's' || key === 'u' || key === 'p' || key === 'c' || key === 'x' || key === 'a')
      ) {
        e.preventDefault()
      }
      if (key === 'f12' || (e.shiftKey && mod && (key === 'i' || key === 'j' || key === 'c'))) {
        e.preventDefault()
      }
    }

    const onSelectStart = (e: Event) => {
      if (isEditableTarget(e.target)) return
      e.preventDefault()
    }

    document.addEventListener('copy', blockClipboard, true)
    document.addEventListener('cut', blockClipboard, true)
    document.addEventListener('contextmenu', onContextMenu, true)
    document.addEventListener('dragstart', onDragStart, true)
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('selectstart', onSelectStart, true)

    return () => {
      document.documentElement.removeAttribute('data-public-content-guard')
      observer.disconnect()
      document.removeEventListener('copy', blockClipboard, true)
      document.removeEventListener('cut', blockClipboard, true)
      document.removeEventListener('contextmenu', onContextMenu, true)
      document.removeEventListener('dragstart', onDragStart, true)
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('selectstart', onSelectStart, true)
    }
  }, [active])

  return null
}

/**
 * @deprecated Prefer PublicContentGuard for public pages.
 * Portal (member/business) layouts should leave media unrestricted.
 */
export function ContentProtection({ children }: ContentProtectionProps) {
  return <>{children}</>
}
