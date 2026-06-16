'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'

interface LanguageOption {
  code: string
  name: string
  flag: string
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'العربية', flag: '🇦🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
]

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  const currentLanguage = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0]

  const handleLanguageChange = (code: string) => {
    // Store language preference and stay on current page
    localStorage.setItem('preferred-language', code)
    // Refresh to apply language changes
    window.location.reload()
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-secondary transition"
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">{currentLanguage.flag} {currentLanguage.code.toUpperCase()}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 w-48">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-secondary transition ${
                locale === lang.code ? 'bg-primary/10 font-semibold' : ''
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <div>
                <p className="font-medium">{lang.name}</p>
                <p className="text-xs text-muted-foreground">{lang.code.toUpperCase()}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
