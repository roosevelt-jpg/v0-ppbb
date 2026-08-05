'use client'

import React from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { PolicyInitializer } from '@/components/policy-initializer'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/components/theme-provider'
import { ReferralAttributionCapture } from '@/components/referral-attribution-capture'
import { SiteThemeApplier } from '@/components/site-theme-applier'
import { SessionIdleTimeout } from '@/components/session-idle-timeout'
import {
  PREFERRED_LANGUAGE_KEY,
  SUPPORTED_LOCALE_CODES,
  isRtlLocale,
} from '@/lib/supported-languages'
import enMessages from '@/messages/en.json'

interface ProvidersProps {
  children: React.ReactNode
}

async function loadMessages(locale: string): Promise<Record<string, unknown>> {
  if (locale === 'en') return enMessages as Record<string, unknown>
  try {
    const mod = await import(`@/messages/${locale}.json`)
    return mod.default as Record<string, unknown>
  } catch {
    return enMessages as Record<string, unknown>
  }
}

export function Providers({ children }: ProvidersProps) {
  const [locale, setLocale] = React.useState('en')
  // Start with English so the app never paints a blank shell while locale JSON loads.
  const [messages, setMessages] = React.useState<Record<string, unknown>>(
    enMessages as Record<string, unknown>
  )

  React.useEffect(() => {
    const storedLocale = localStorage.getItem(PREFERRED_LANGUAGE_KEY)
    const browserLocale = navigator.language.split('-')[0]
    const resolved =
      storedLocale && SUPPORTED_LOCALE_CODES.includes(storedLocale)
        ? storedLocale
        : SUPPORTED_LOCALE_CODES.includes(browserLocale)
          ? browserLocale
          : 'en'
    setLocale(resolved)

    const dir = isRtlLocale(resolved) ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', resolved)

    if (resolved !== 'en') {
      void loadMessages(resolved).then(setMessages)
    }
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PolicyInitializer />
          <ReferralAttributionCapture />
          <SiteThemeApplier />
          <SessionIdleTimeout />
          {children}
        </NextIntlClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
