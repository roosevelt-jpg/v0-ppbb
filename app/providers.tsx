'use client'

import React from 'react'
import { ThemeProvider } from 'next-themes'
import { NextIntlClientProvider } from 'next-intl'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [locale, setLocale] = React.useState('en')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    // Get locale from browser language or URL
    const browserLocale = navigator.language.split('-')[0]
    const locales = ['en', 'ar', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'ko', 'it', 'nl', 'ru']
    const detectedLocale = locales.includes(browserLocale) ? browserLocale : 'en'
    setLocale(detectedLocale)
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <NextIntlClientProvider locale={locale}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
