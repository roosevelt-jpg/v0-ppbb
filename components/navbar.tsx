'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { LanguageSwitcherWithFlags } from './language-switcher-flags'
import { getPagesByMenuLocation } from '@/lib/admin'
import { Page } from '@/lib/types'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navItems, setNavItems] = useState<any[]>([
    { label: 'About us', href: '/about' },
    { label: 'Impact', href: '/transparency' },
    { label: 'Events', href: '/events' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Opportunities', href: '/opportunities' },
    { label: 'Contact', href: '/contact' },
  ])

  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        const menuPages = await getPagesByMenuLocation('navbar')
        if (menuPages.length > 0) {
          setNavItems(menuPages.map(page => ({
            label: page.menuLabel || page.title,
            href: `/${page.slug}`,
          })))
        }
      } catch (error) {
        // Silently fail - use default items
        // Permission errors are expected for unauthenticated users
      }
    }

    loadMenuItems()
  }, [])

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
          <div className="flex-1 flex items-center justify-center gap-6 lg:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <LanguageSwitcherWithFlags />
            <ThemeToggle />

            <Link
              href="/login"
              className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold bg-white text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors whitespace-nowrap"
            >
              Join now
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden px-3 sm:px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <img 
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PB%20ORIGINAL%20LOGO%20%5Bwhite%5D-kynXCNIfTNVyEpS4pVpqQsl2Pxf9yq.png" 
            alt="Passive Blessings" 
            className="h-6 sm:h-8 w-auto"
          />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcherWithFlags />
          <ThemeToggle />
          <button
            className="p-2 -mr-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-800 dark:bg-neutral-900 border-t border-neutral-700 max-h-96 overflow-y-auto">
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

          {/* Language Switcher Mobile */}
          <div className="border-t border-neutral-700 px-4 py-3">
            <LanguageSwitcherWithFlags />
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
