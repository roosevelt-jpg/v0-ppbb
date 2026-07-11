'use client'

import { useEffect } from 'react'
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

function applyThemeToDocument(theme: SiteTheme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const vars = themeToCssVariables(theme)
  for (const [key, value] of Object.entries(vars)) {
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
  useEffect(() => {
    applyThemeToDocument(DEFAULT_GLOBAL_SETTINGS.theme)
    return subscribeToGlobalSettings((settings) => {
      applyThemeToDocument(settings.theme || DEFAULT_GLOBAL_SETTINGS.theme)
    })
  }, [])

  return null
}
