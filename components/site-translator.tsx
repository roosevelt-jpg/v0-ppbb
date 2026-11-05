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
 * Mounts a hidden Google Translate widget and keeps the preferred language
 * after client-side navigations. Does not watch the whole DOM — re-running
 * Google Translate on every mutation made Arabic (and other languages) lag.
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

  // After SPA route changes, re-trigger translation once the new page settles
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
      void applySiteTranslation(locale, { refresh: true })
    }, 900)
    return () => window.clearTimeout(t)
  }, [pathname])

  return (
    <div
      id="pb-google-translate-element"
      className="pb-google-translate-host notranslate"
      aria-hidden="true"
    />
  )
}
