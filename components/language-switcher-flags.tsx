'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface Language {
  code: string
  name: string
  flag: string
  nativeName: string
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', nativeName: 'Português' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
]

export function LanguageSwitcherWithFlags() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [currentLocale, setCurrentLocale] = useState('en')

  useEffect(() => {
    setIsMounted(true)
    // Get locale from localStorage or pathname
    const stored = localStorage.getItem('preferredLanguage')
    if (stored) {
      setCurrentLocale(stored)
    } else {
      // Extract from pathname like /en/... or /es/...
      const segments = pathname.split('/')
      if (segments.length > 1 && LANGUAGES.some(l => l.code === segments[1])) {
        setCurrentLocale(segments[1])
      } else {
        setCurrentLocale('en')
      }
    }
  }, [pathname])

  const currentLanguage = LANGUAGES.find((lang) => lang.code === currentLocale) || LANGUAGES[0]

  const handleLanguageChange = (newLocale: string) => {
    // Store preference
    localStorage.setItem('preferredLanguage', newLocale)

    // Replace the locale in the pathname
    const segments = pathname.split('/')
    // Remove empty first segment and locale if present
    const pathSegments = segments.filter(s => s && !LANGUAGES.some(l => l.code === s))
    
    // Build new pathname
    const newPathname = `/${newLocale}${pathSegments.length > 0 ? '/' + pathSegments.join('/') : ''}`

    // Navigate to new locale
    router.push(newPathname)
    setIsOpen(false)
  }

  if (!isMounted) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-base"
        aria-label="Select language"
        title={`${currentLanguage.nativeName}`}
      >
        {currentLanguage.flag}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-sm ${
                  currentLocale === lang.code
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <span className="text-lg w-6 text-center">{lang.flag}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{lang.name}</div>
                </div>
                {currentLocale === lang.code && (
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
