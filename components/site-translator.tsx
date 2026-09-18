'use client'

import React, { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {
  applySiteTranslation,
  ensureGoogleTranslateScript,
  getPreferredLocale,
  setGoogTransCookie,
} from '@/lib/site-translate'

/**
 * Mounts a hidden Google Translate widget and keeps the whole site
 * (UI + CMS + dynamic content) translated to the user's preferred language.
 * Re-applies after client-side navigations so new pages stay translated.
 */
export function SiteTranslator() {
  const pathname = usePathname()
  const readyRef = useRef(false)
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      const locale = getPreferredLocale()
      setGoogTransCookie(locale)

      if (locale === 'en') {
        readyRef.current = true
        return
      }

      try {
        await ensureGoogleTranslateScript()
        if (cancelled) return
        await applySiteTranslation(locale)
        readyRef.current = true
      } catch (err) {
        console.warn('[SiteTranslator]', err)
      }
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  // After SPA route changes, re-trigger translation so new content is covered
  useEffect(() => {
    if (lastPathRef.current === null) {
      lastPathRef.current = pathname
      return
    }
    if (lastPathRef.current === pathname) return
    lastPathRef.current = pathname

    const locale = getPreferredLocale()
    if (locale === 'en' || !readyRef.current) return

    const t = window.setTimeout(() => {
      void applySiteTranslation(locale)
    }, 500)
    return () => window.clearTimeout(t)
  }, [pathname])

  // Light re-apply when major UI roots mount (modals / dashboards), without looping on GT font wrappers
  useEffect(() => {
    const locale = getPreferredLocale()
    if (locale === 'en') return

    let timer: number | undefined
    let applying = false

    const observer = new MutationObserver((mutations) => {
      if (!readyRef.current || applying) return
      const meaningful = mutations.some((m) => {
        for (const node of Array.from(m.addedNodes)) {
          if (!(node instanceof HTMLElement)) continue
          // Ignore Google Translate's own wrappers
          if (node.classList?.contains('goog-te-spinner-pos')) continue
          if (node.tagName === 'FONT' && node.classList?.contains('notranslate')) continue
          if (node.querySelector?.('font[style*="vertical"]')) continue
          // Only care about substantial UI chunks
          if (
            node.matches?.(
              '[role="dialog"], [data-dashboard-surface], main, [data-signup-page], .fixed.inset-0'
            ) ||
            (node.childElementCount > 3 && node.textContent && node.textContent.length > 80)
          ) {
            return true
          }
        }
        return false
      })
      if (!meaningful) return
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        applying = true
        void applySiteTranslation(locale).finally(() => {
          window.setTimeout(() => {
            applying = false
          }, 1500)
        })
      }, 1000)
    })

    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <div
      id="pb-google-translate-element"
      className="pb-google-translate-host notranslate"
      aria-hidden="true"
    />
  )
}
