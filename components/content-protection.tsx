'use client'

import React from 'react'
import { resolvePublicMediaUrl, toMediaProxyUrl } from '@/lib/media-url'

type ContentProtectionProps = {
  children: React.ReactNode
  /** @deprecated Kept for call-site compatibility; portal layouts should not wrap content. */
  showNotice?: boolean
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
 * Site-wide media URL rewrite / proxy fallback.
 * Copy and text selection are allowed on public pages.
 */
export function PublicContentGuard() {
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

  return null
}

/**
 * @deprecated Prefer PublicContentGuard for public pages.
 * Portal (member/business) layouts should leave media unrestricted.
 */
export function ContentProtection({ children }: ContentProtectionProps) {
  return <>{children}</>
}
