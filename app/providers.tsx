'use client'

import React from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { PolicyInitializer } from '@/components/policy-initializer'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/components/theme-provider'
import { ReferralAttributionCapture } from '@/components/referral-attribution-capture'
import {
  PREFERRED_LANGUAGE_KEY,
  SUPPORTED_LOCALE_CODES,
  isRtlLocale,
} from '@/lib/supported-languages'

interface ProvidersProps {
  children: React.ReactNode
}

async function loadMessages(locale: string): Promise<Record<string, unknown>> {
  try {
    const mod = await import(`@/messages/${locale}.json`)
    return mod.default as Record<string, unknown>
  } catch {
    const fallback = await import('@/messages/en.json')
    return fallback.default as Record<string, unknown>
  }
}

export function Providers({ children }: ProvidersProps) {
  const [locale, setLocale] = React.useState('en')
  const [messages, setMessages] = React.useState<Record<string, unknown> | null>(null)

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

    void loadMessages(resolved).then(setMessages)
  }, [])

  if (!messages) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <div className="min-h-screen bg-background" />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PolicyInitializer />
          <ReferralAttributionCapture />
          {children}
        </NextIntlClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
