'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { LanguageSwitcherWithFlags } from './language-switcher-flags'
import { SiteLogo } from './site-logo'
import { ProfileMenuButton } from './profile-quick-edit'
import { useAuth } from '@/lib/auth-context'
import { logoutUser } from '@/lib/auth'
import { hasAdminAccess, hasBusinessAccess } from '@/lib/roles'
import { User, BusinessProfile } from '@/lib/types'
import {
  subscribeToNavigation,
  DEFAULT_NAVIGATION,
  NavigationConfig,
} from '@/lib/platform-config'

function getDashboardHref(user: User | BusinessProfile): string {
  if (hasAdminAccess(user)) return '/admin'
  if (hasBusinessAccess(user) && user.role === 'business') return '/business/dashboard'
  if (user.role === 'sponsor') return '/sponsor'
  return '/dashboard'
}

export function Navbar() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navConfig, setNavConfig] = useState<NavigationConfig>(DEFAULT_NAVIGATION)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    return subscribeToNavigation(setNavConfig)
  }, [])

  const visibleLinks = navConfig.links
    .filter((link) => link.isVisible !== false)
    .sort((a, b) => a.order - b.order)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await logoutUser()
      router.push('/')
    } finally {
      setSigningOut(false)
      setMobileMenuOpen(false)
    }
  }

  const authActions = authLoading ? null : user ? (
    <>
      <Link
        href={getDashboardHref(user as User | BusinessProfile)}
        className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap"
      >
        Dashboard
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap bg-transparent shadow-none min-h-0"
      >
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </>
  ) : (
    <>
      <Link
        href="/login"
        className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap"
      >
        {navConfig.signInLabel}
      </Link>
      <Link
        href={navConfig.ctaButton.href}
        className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold bg-white text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors whitespace-nowrap"
      >
        {navConfig.ctaButton.label}
      </Link>
    </>
  )

  return (
    <nav className="w-full bg-neutral-900 dark:bg-neutral-950 border-b border-neutral-800 dark:border-neutral-700">
      {/* Desktop Navigation — min height fits 84px logo + vertical padding */}
      <div className="hidden md:block px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 lg:gap-8 min-h-[84px]">
          <div className="flex-shrink-0">
            <SiteLogo background="dark" variant="navbar" href="/" />
          </div>

          <div className="flex-1 flex items-center justify-center gap-6 lg:gap-8">
            {visibleLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap font-body"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <LanguageSwitcherWithFlags />
            <ThemeToggle />
            <ProfileMenuButton />
            {authActions}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden px-3 sm:px-4 py-3 flex items-center justify-between gap-2 min-h-[58px]">
        <SiteLogo background="dark" variant="navbar" href="/" />
        <div className="flex items-center gap-2">
          <LanguageSwitcherWithFlags />
          <ThemeToggle />
          <ProfileMenuButton />
          <button
            className="p-2 -mr-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-800 dark:bg-neutral-900 border-t border-neutral-700 max-h-96 overflow-y-auto">
          {visibleLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-3 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors border-b border-neutral-700 font-body"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          <div className="border-t border-neutral-700 px-4 py-3">
            <LanguageSwitcherWithFlags />
          </div>

          <div className="border-t border-neutral-700">
            {!authLoading && user ? (
              <>
                <Link
                  href={getDashboardHref(user as User | BusinessProfile)}
                  className="block w-full px-4 py-3 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors border-b border-neutral-700 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="block w-full px-4 py-3 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors text-center bg-transparent shadow-none min-h-0"
                >
                  {signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block w-full px-4 py-3 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors border-b border-neutral-700 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {navConfig.signInLabel}
                </Link>
                <Link
                  href={navConfig.ctaButton.href}
                  className="block w-full px-4 py-3 text-sm font-semibold bg-white text-neutral-900 hover:bg-neutral-100 transition-colors text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {navConfig.ctaButton.label}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
