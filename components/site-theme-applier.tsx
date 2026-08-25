'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/components/theme-provider'
import {
  subscribeToGlobalSettings,
  DEFAULT_GLOBAL_SETTINGS,
} from '@/lib/platform-config'
import {
  buildGoogleFontsHref,
  themeToCssVariables,
  type SiteTheme,
} from '@/lib/site-theme'

const FONT_LINK_ID = 'pb-site-theme-fonts'

/**
 * themeToCssVariables() duplicates the admin's CMS brand colors onto these
 * shadcn-style semantic tokens so the light-mode design picks them up. But
 * those same tokens are also what every dark-aware component is built on
 * (see the `.dark { ... }` block in app/globals.css) — setting them as an
 * inline style on <html> beats that class rule regardless of source order,
 * which silently forced the whole app back to the light CMS palette even
 * with dark mode toggled on. Skip them in dark mode so the built-in dark
 * palette can own them; keep applying the --pb-color-* / font tokens either
 * way since those are the admin's actual brand identity, not theme-reactive.
 */
const DARK_REACTIVE_KEYS = new Set([
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--border',
  '--input',
  '--ring',
  '--color-ink-black',
  '--color-charcoal',
  '--color-warm-grey',
  '--color-sand-border',
  '--color-warm-white',
  '--color-gold',
])

function applyThemeToDocument(theme: SiteTheme, isDark: boolean) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const vars = themeToCssVariables(theme)
  for (const [key, value] of Object.entries(vars)) {
    if (isDark && DARK_REACTIVE_KEYS.has(key)) {
      root.style.removeProperty(key)
      continue
    }
    root.style.setProperty(key, value)
  }

  const href = buildGoogleFontsHref(theme)
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null
  if (!href) {
    link?.remove()
    return
  }
  if (!link) {
    link = document.createElement('link')
    link.id = FONT_LINK_ID
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  if (link.href !== href) {
    link.href = href
  }
}

/** Live-applies admin typography & colors from Global Settings. */
export function SiteThemeApplier() {
  const { resolvedTheme } = useTheme()
  const themeRef = useRef<SiteTheme>(DEFAULT_GLOBAL_SETTINGS.theme)

  useEffect(() => {
    applyThemeToDocument(themeRef.current, resolvedTheme === 'dark')
    return subscribeToGlobalSettings((settings) => {
      themeRef.current = settings.theme || DEFAULT_GLOBAL_SETTINGS.theme
      applyThemeToDocument(themeRef.current, resolvedTheme === 'dark')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    applyThemeToDocument(themeRef.current, resolvedTheme === 'dark')
  }, [resolvedTheme])

  return null
}
