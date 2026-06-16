'use client'

import React, { useState, useEffect } from 'react'
import { Globe } from 'lucide-react'

interface LanguageSelectorProps {
  mobile?: boolean
}

export function LanguageSelector({ mobile = false }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [mounted, setMounted] = useState(false)

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'pt', label: 'Português' },
    { code: 'ja', label: '日本語' },
    { code: 'zh', label: '中文' },
    { code: 'ko', label: '한국어' },
    { code: 'it', label: 'Italiano' },
    { code: 'nl', label: 'Nederlands' },
    { code: 'ru', label: 'Русский' },
  ]

  useEffect(() => {
    // Load stored language on mount
    const stored = localStorage.getItem('preferred-language')
    setCurrentLanguage(stored || 'en')
    setMounted(true)
  }, [])

  const handleLanguageChange = (code: string) => {
    setCurrentLanguage(code)
    localStorage.setItem('preferred-language', code)
    window.location.reload()
    setOpen(false)
  }

  if (!mounted) return null

  if (mobile) {
    return (
      <div className="w-full">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2 text-neutral-300 hover:text-white hover:bg-neutral-700 px-2 py-1 rounded transition-colors"
        >
          <Globe size={18} />
          Language ({currentLanguage.toUpperCase()})
        </button>
        {open && (
          <div className="mt-2 space-y-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-4 py-2 text-left text-sm rounded transition-colors ${
                  currentLanguage === lang.code
                    ? 'bg-neutral-600 text-white'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-600'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-neutral-300 hover:text-white transition-colors"
        aria-label="Select language"
        title="Select language"
      >
        <Globe size={20} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-neutral-800 dark:bg-neutral-900 rounded-lg shadow-lg z-50 border border-neutral-700 dark:border-neutral-600">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                currentLanguage === lang.code
                  ? 'bg-neutral-700 dark:bg-neutral-800 text-white'
                  : 'text-neutral-300 dark:text-neutral-400 hover:text-white dark:hover:text-neutral-200 hover:bg-neutral-700 dark:hover:bg-neutral-800'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
