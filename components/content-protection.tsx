'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { isDashboardRoute } from '@/lib/dashboard-routes'
import { resolvePublicMediaUrl, toMediaProxyUrl } from '@/lib/media-url'

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

function rewriteSrc(el: HTMLImageElement | HTMLVideoElement | HTMLSourceElement) {
  const current = el.getAttribute('src') || ''
  if (!current || current.startsWith('data:') || current.startsWith('blob:')) return
  if (current.startsWith('/api/media')) return
  if (!el.dataset.pbOrig) el.dataset.pbOrig = current
  const next = resolvePublicMediaUrl(el.dataset.pbOrig)
  if (!next || next === current || el.dataset.pbRewritten === next) return
  el.dataset.pbRewritten = next
  el.setAttribute('src', next)
}

function attachProxyFallback(el: HTMLImageElement | HTMLVideoElement) {
  if (el.dataset.pbErr) return
  el.dataset.pbErr = '1'
  el.addEventListener('error', () => {
    const orig = el.dataset.pbOrig || el.getAttribute('src') || ''
    const proxy = toMediaProxyUrl(orig)
    if (proxy && el.getAttribute('src') !== proxy) el.setAttribute('src', proxy)
  })
}

function applyMediaFix(el: Element) {
  if (
    el instanceof HTMLImageElement ||
    el instanceof HTMLVideoElement ||
    el instanceof HTMLSourceElement
  ) {
    rewriteSrc(el)
  }
  if (el instanceof HTMLImageElement || el instanceof HTMLVideoElement) {
    attachProxyFallback(el)
  }
}

function scanMedia(root: ParentNode = document) {
  if (root instanceof Element) applyMediaFix(root)
  root.querySelectorAll('img, video, source').forEach((el) => applyMediaFix(el))
}

/**
 * Rewrites broken GCS image URLs site-wide, and on public pages adds soft
 * deterrence against copy / save. Auth + Storage rules remain the real ACL.
 */
export function PublicContentGuard() {
  const pathname = usePathname()
  const protect = !isDashboardRoute(pathname)

  React.useEffect(() => {
    scanMedia()
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.target instanceof Element) {
          applyMediaFix(m.target)
          continue
        }
        m.addedNodes.forEach((node) => {
          if (node instanceof Element) scanMedia(node)
        })
      }
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset', 'poster'],
    })
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    if (!protect) {
      document.documentElement.removeAttribute('data-public-content-guard')
      return
    }

    document.documentElement.setAttribute('data-public-content-guard', '1')

    const hardenPublic = (root: ParentNode = document) => {
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

    hardenPublic()
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node instanceof Element) hardenPublic(node)
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
  }, [protect])

  return null
}

/**
 * @deprecated Prefer PublicContentGuard for public pages.
 * Portal (member/business) layouts should leave media unrestricted.
 */
export function ContentProtection({ children }: ContentProtectionProps) {
  return <>{children}</>
}
