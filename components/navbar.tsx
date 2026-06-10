'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Sun, Moon, Globe } from 'lucide-react'
import { useTheme } from 'next-themes'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const [currentLanguage, setCurrentLanguage] = useState('en')

  React.useEffect(() => {
    setMounted(true)
  }, [])

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

  const navItems = [
    { label: 'About us', href: '#about' },
    { label: 'Join', href: '/signup' },
    { label: 'Events', href: '/dashboard/events' },
    { label: 'Marketplace', href: '/dashboard/marketplace' },
    { label: 'Contact', href: '#contact' },
  ]

  return (
    <nav className="w-full bg-neutral-900 dark:bg-neutral-950 border-b border-neutral-800 dark:border-neutral-700">
      {/* Desktop Navigation */}
      <div className="hidden md:block px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex-shrink-0 h-8">
            <Link href="/">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PB%20ORIGINAL%20LOGO%20%5Bwhite%5D-kynXCNIfTNVyEpS4pVpqQsl2Pxf9yq.png" 
                alt="Passive Blessings" 
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Center Menu Items */}
          <div className="flex-1 flex items-center justify-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLanguageOpen(!languageOpen)}
                className="p-2 text-neutral-300 hover:text-white transition-colors"
                aria-label="Select language"
              >
                <Globe size={20} />
              </button>
              {languageOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-lg shadow-lg z-50 border border-neutral-700">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setCurrentLanguage(lang.code)
                        setLanguageOpen(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        currentLanguage === lang.code
                          ? 'bg-neutral-700 text-white'
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-700'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-neutral-300 hover:text-white transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}

            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2.5 text-sm font-semibold bg-white text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors whitespace-nowrap"
            >
              Join now
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <img 
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PB%20ORIGINAL%20LOGO%20%5Bwhite%5D-kynXCNIfTNVyEpS4pVpqQsl2Pxf9yq.png" 
            alt="Passive Blessings" 
            className="h-8 w-auto"
          />
        </Link>
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-neutral-300 hover:text-white transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
          <button
            className="p-2 -mr-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-800 dark:bg-neutral-900 border-t border-neutral-700">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-3 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors border-b border-neutral-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          {/* Language Selector Mobile */}
          <div className="border-t border-neutral-700">
            <button
              onClick={() => setLanguageOpen(!languageOpen)}
              className="w-full px-4 py-3 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors flex items-center gap-2"
            >
              <Globe size={18} />
              Language
            </button>
            {languageOpen && (
              <div className="bg-neutral-700">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setCurrentLanguage(lang.code)
                      setLanguageOpen(false)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
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

          {/* Mobile Login Section */}
          <div className="border-t border-neutral-700">
            <Link
              href="/login"
              className="block w-full px-4 py-3 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors border-b border-neutral-700 text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="block w-full px-4 py-3 text-sm font-semibold bg-white text-neutral-900 hover:bg-neutral-100 transition-colors text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Join Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
