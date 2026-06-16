'use client'

import React from 'react'
import { ThemeProvider } from 'next-themes'
import { NextIntlClientProvider } from 'next-intl'
import { PolicyInitializer } from '@/components/policy-initializer'
import { AuthProvider } from '@/lib/auth-context'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [locale, setLocale] = React.useState('en')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    // Try to get stored language preference first
    const storedLocale = localStorage.getItem('preferred-language')
    
    if (storedLocale) {
      setLocale(storedLocale)
    } else {
      // Fall back to browser language detection
      const browserLocale = navigator.language.split('-')[0]
      const locales = ['en', 'ar', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'ko', 'it', 'nl', 'ru']
      const detectedLocale = locales.includes(browserLocale) ? browserLocale : 'en'
      setLocale(detectedLocale)
    }
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <AuthProvider>
      <NextIntlClientProvider locale={locale}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <PolicyInitializer />
          {children}
        </ThemeProvider>
      </NextIntlClientProvider>
    </AuthProvider>
  )
}
