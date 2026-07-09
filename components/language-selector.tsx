'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Globe, Search } from 'lucide-react'
import {
  SUPPORTED_LANGUAGES,
  PREFERRED_LANGUAGE_KEY,
  filterLanguages,
} from '@/lib/supported-languages'

interface LanguageSelectorProps {
  mobile?: boolean
  /** Smaller trigger for dashboard header toolbars */
  compact?: boolean
}

export function LanguageSelector({ mobile = false, compact = false }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => filterLanguages(search), [search])

  useEffect(() => {
    const stored = localStorage.getItem(PREFERRED_LANGUAGE_KEY)
    setCurrentLanguage(stored || 'en')
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) {
      setSearch('')
      return
    }
    const t = setTimeout(() => searchRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const handleLanguageChange = (code: string) => {
    setCurrentLanguage(code)
    localStorage.setItem(PREFERRED_LANGUAGE_KEY, code)
    // Legacy key used by language-switcher-flags
    localStorage.setItem('preferredLanguage', code)
    setOpen(false)
    window.location.reload()
  }

  if (!mounted) {
    return <div className="min-h-[44px] min-w-[44px] rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
  }

  const triggerClass = mobile
    ? 'w-full flex items-center gap-2 min-h-[44px] px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors'
    : compact
      ? 'inline-flex items-center justify-center min-h-[32px] min-w-[32px] rounded-md p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 transition-colors'
      : 'inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 transition-colors'

  const panelClass = mobile
    ? 'mt-2 w-full rounded-lg border border-neutral-200 bg-white shadow-lg overflow-hidden'
    : 'absolute right-0 mt-1.5 w-[min(100vw-2rem,16rem)] sm:w-56 rounded-lg border border-neutral-200 bg-white dark:bg-neutral-900 shadow-lg z-50 overflow-hidden'

  return (
    <div ref={containerRef} className={mobile ? 'w-full' : 'relative'}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
        aria-label="Select language"
        aria-expanded={open}
        title="Select language"
      >
        <Globe className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} shrink-0`} aria-hidden />
        {mobile && <span>Language ({currentLanguage.toUpperCase()})</span>}
      </button>

      {open && (
        <div className={panelClass}>
          <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white dark:bg-neutral-900 p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search languages…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-200 rounded-md bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 focus:outline-none focus:border-neutral-900 min-h-[36px]"
                aria-label="Search languages"
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-neutral-500">No languages found</li>
            ) : (
              filtered.map((lang) => (
                <li key={lang.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={currentLanguage === lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors min-h-[44px] flex flex-col justify-center ${
                      currentLanguage === lang.code
                        ? 'bg-neutral-100 dark:bg-neutral-800 font-medium text-neutral-900 dark:text-white'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span>{lang.name}</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{lang.nativeName}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
