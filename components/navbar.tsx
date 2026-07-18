'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { LanguageSwitcherWithFlags } from './language-switcher-flags'
import { SiteLogo } from './site-logo'
import { ProfileMenuButton } from './profile-quick-edit'
import { useAuth } from '@/lib/auth-context'
import { logoutUser } from '@/lib/auth'
import { hasAdminAccess, hasBusinessAccess } from '@/lib/roles'
import { User, BusinessProfile, Page } from '@/lib/types'
import {
  subscribeToNavigation,
  DEFAULT_NAVIGATION,
  NavigationConfig,
} from '@/lib/platform-config'
import { ensureMenuPagesSeeded, subscribeToMenuPages } from '@/lib/cms-menu-live'
import { getCmsPageHref, getCmsPageLabel } from '@/lib/cms-page-routes'

function getDashboardHref(user: User | BusinessProfile): string {
  if (hasAdminAccess(user)) return '/admin'
  if (hasBusinessAccess(user) && user.role === 'business') return '/business/dashboard'
  if (user.role === 'sponsor') return '/sponsor'
  return '/dashboard'
}

function headerChildrenForLink(pages: Page[], href: string): Page[] {
  return pages
    .filter((p) => p.headerSection === href || p.headerSection === href.replace(/\/$/, ''))
    .sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0))
}

export function Navbar() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navConfig, setNavConfig] = useState<NavigationConfig>(DEFAULT_NAVIGATION)
  const [headerPages, setHeaderPages] = useState<Page[]>([])
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    return subscribeToNavigation(setNavConfig)
  }, [])

  useEffect(() => {
    void ensureMenuPagesSeeded()
    return subscribeToMenuPages('navbar', setHeaderPages)
  }, [])

  const visibleLinks = navConfig.links
    .filter((link) => link.isVisible !== false)
    .sort((a, b) => a.order - b.order)

  const topLevelHeaderPages = headerPages.filter((p) => !p.headerSection)

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
    <div className="relative group">
      <button
        type="button"
        className="pb-compact-btn px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap inline-flex items-center gap-1 !bg-transparent shadow-none min-h-0"
      >
        Dashboard <ChevronDown className="w-3.5 h-3.5" />
      </button>
      <div className="absolute right-0 top-full mt-1 hidden group-hover:block group-focus-within:block min-w-[160px] bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg z-50 py-1">
        <Link
          href={getDashboardHref(user as User | BusinessProfile)}
          className="block px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
        >
          Open dashboard
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="pb-compact-btn w-full text-left px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 !bg-transparent shadow-none min-h-0"
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  ) : (
    <Link
      href="/login"
      className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold bg-white text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors whitespace-nowrap"
    >
      {navConfig.signInLabel}
    </Link>
  )

  const renderNavItem = (item: { label: string; href: string }, mobile = false) => {
    const children = headerChildrenForLink(headerPages, item.href)
    const hasChildren = children.length > 0

    if (!hasChildren) {
      return (
        <Link
          key={item.href}
          href={item.href}
          className={
            mobile
              ? 'block px-4 py-3 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors border-b border-neutral-700 font-body'
              : 'text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap font-body'
          }
          onClick={() => mobile && setMobileMenuOpen(false)}
        >
          {item.label}
        </Link>
      )
    }

    if (mobile) {
      return (
        <div key={item.href} className="border-b border-neutral-700">
          <Link
            href={item.href}
            className="block px-4 py-3 text-sm font-semibold text-white font-body"
            onClick={() => setMobileMenuOpen(false)}
          >
            {item.label}
          </Link>
          {children.map((child) => (
            <Link
              key={child.id}
              href={getCmsPageHref(child)}
              className="block px-6 py-2.5 text-sm text-neutral-300 hover:text-white hover:bg-neutral-700 font-body"
              onClick={() => setMobileMenuOpen(false)}
            >
              {getCmsPageLabel(child)}
            </Link>
          ))}
        </div>
      )
    }

    // CSS hover/focus-within — avoids overflow clipping + fragile mouseleave state
    return (
      <div key={item.href} className="relative group">
        <Link
          href={item.href}
          className="pb-compact-btn inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap font-body !bg-transparent !text-neutral-300 hover:!text-white shadow-none min-h-0 p-0 h-auto"
          aria-haspopup="menu"
        >
          {item.label}
          <ChevronDown className="w-3.5 h-3.5" aria-hidden />
        </Link>
        <div
          role="menu"
          className="absolute left-0 top-full pt-2 z-[100] min-w-[12rem] opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto transition-opacity"
        >
          <div className="rounded-lg border border-neutral-700 bg-neutral-900 shadow-lg py-1">
            <Link
              href={item.href}
              role="menuitem"
              className="block px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 hover:text-white"
            >
              {item.label}
            </Link>
            {children.map((child) => (
              <Link
                key={child.id}
                href={getCmsPageHref(child)}
                role="menuitem"
                className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
              >
                {getCmsPageLabel(child)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <nav className="w-full bg-neutral-900 dark:bg-neutral-950 border-b border-neutral-800 dark:border-neutral-700">
      <div className="hidden lg:block px-4 sm:px-6 lg:px-8 py-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:gap-6 h-11">
          <div className="flex-shrink-0 h-full flex items-center">
            <SiteLogo background="dark" variant="navbar" href="/" />
          </div>

          <div className="flex-1 flex items-center justify-center gap-4 xl:gap-6 min-w-0 overflow-visible">
            {visibleLinks.map((item) => renderNavItem(item))}
            {topLevelHeaderPages.map((page) => (
              <Link
                key={page.id}
                href={getCmsPageHref(page)}
                className="text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap font-body"
              >
                {getCmsPageLabel(page)}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <LanguageSwitcherWithFlags onDark />
            <ThemeToggle onDark />
            <ProfileMenuButton compact />
            {authActions}
          </div>
        </div>
      </div>

      <div className="lg:hidden px-3 sm:px-4 py-0 flex items-center justify-between gap-2 h-11">
        <div className="h-full flex items-center min-w-0 flex-1">
          <SiteLogo background="dark" variant="navbar" href="/" />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <LanguageSwitcherWithFlags onDark />
          <ThemeToggle onDark />
          <ProfileMenuButton compact />
          <button
            type="button"
            className="pb-ghost-btn p-2 -mr-1 text-white min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
            style={{ color: '#ffffff' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X size={22} color="#ffffff" strokeWidth={2.25} aria-hidden />
            ) : (
              <Menu size={22} color="#ffffff" strokeWidth={2.25} aria-hidden />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-neutral-800 dark:bg-neutral-900 border-t border-neutral-700 max-h-[min(24rem,70dvh)] overflow-y-auto">
          {visibleLinks.map((item) => renderNavItem(item, true))}
          {topLevelHeaderPages.map((page) => (
            <Link
              key={page.id}
              href={getCmsPageHref(page)}
              className="block px-4 py-3 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors border-b border-neutral-700 font-body"
              onClick={() => setMobileMenuOpen(false)}
            >
              {getCmsPageLabel(page)}
            </Link>
          ))}

          <div className="border-t border-neutral-700 px-4 py-3">
            <LanguageSwitcherWithFlags mobile onDark />
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
