'use client'

import React from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { PolicyInitializer } from '@/components/policy-initializer'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/components/theme-provider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [locale, setLocale] = React.useState('en')

  React.useEffect(() => {
    const storedLocale = localStorage.getItem('preferred-language')
    if (storedLocale) {
      setLocale(storedLocale)
    } else {
      const browserLocale = navigator.language.split('-')[0]
      const locales = ['en', 'ar', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'ko', 'it', 'nl', 'ru']
      setLocale(locales.includes(browserLocale) ? browserLocale : 'en')
    }
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <NextIntlClientProvider locale={locale}>
          <PolicyInitializer />
          {children}
        </NextIntlClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
