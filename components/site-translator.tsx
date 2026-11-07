'use client'

import React, { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { usesGooglePageTranslate } from '@/lib/supported-languages'
import {
  applySiteTranslation,
  clearGoogTransCookie,
  ensureGoogleTranslateScript,
  getPreferredLocale,
  setGoogTransCookie,
} from '@/lib/site-translate'

/**
 * For French/Spanish/etc. mounts a hidden Google Translate widget.
 * Arabic and Urdu intentionally skip it — GT rewrites the React DOM and lags.
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

      if (!usesGooglePageTranslate(locale)) {
        clearGoogTransCookie()
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

  // Re-apply only for machine-translated locales after SPA navigations
  useEffect(() => {
    if (lastPathRef.current === null) {
      lastPathRef.current = pathname
      return
    }
    if (lastPathRef.current === pathname) return
    lastPathRef.current = pathname

    const locale = getPreferredLocale()
    if (!usesGooglePageTranslate(locale) || !readyRef.current) return

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
