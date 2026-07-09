'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { BusinessPortalAccessDenied } from '@/components/business-feature-gate'
import Link from 'next/link'
import { SiteLogo } from '@/components/site-logo'
import { DashboardErrorBoundary } from '@/components/dashboard-error-boundary'
import { DashboardTopBar } from '@/components/dashboard-top-bar'
import {
  getBusinessPageTitle,
  getWelcomeFirstName,
} from '@/lib/dashboard-page-titles'
import { getUserDisplayName } from '@/lib/user-profile'
import {
  BarChart3,
  Briefcase,
  TrendingUp,
  Users,
  ShoppingBag,
  Zap,
  DollarSign,
  Heart,
  Share2,
  LayoutGrid,
  Menu,
  X,
  Calendar,
  Users2,
  Tag,
} from 'lucide-react'

const businessMenuItems = [
  { label: 'Dashboard', href: '/business/dashboard', icon: BarChart3 },
  { label: 'Business Profile', href: '/business/profile', icon: Users },
  { label: 'Jobs & Gigs', href: '/business/opportunities', icon: Briefcase },
  { label: 'Products & Offers', href: '/business/offers', icon: ShoppingBag },
  { label: 'Member Discounts', href: '/business/discounts', icon: Tag },
  { label: 'Marketplace', href: '/business/marketplace', icon: LayoutGrid },
  { label: 'Leads & Conversions', href: '/business/leads', icon: Zap },
  { label: 'Referrals', href: '/business/referrals', icon: Share2 },
  { label: 'Analytics', href: '/business/analytics', icon: TrendingUp },
  { label: 'Networking Events', href: '/business/events', icon: Calendar },
  { label: 'Partnerships & Requests', href: '/business/partnerships', icon: Heart },
  { label: 'Communities', href: '/business/communities', icon: Users2 },
  { label: 'Payments & Subscription', href: '/business/payments', icon: DollarSign },
  { label: 'Network / Connections', href: '/business/marketplace', icon: Users },
]

function BusinessSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full min-h-screen flex-col bg-white dark:bg-neutral-900">
      {/* Header with Logo */}
      <div className="border-b border-neutral-200 dark:border-neutral-700 px-4 py-4 flex items-center justify-center">
        <SiteLogo background="light" variant="sidebar" href="/business/dashboard" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="flex flex-col gap-1">
          {businessMenuItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                      : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="mb-2 flex items-center gap-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-200 transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
        >
          <Users className="h-4 w-4 shrink-0" />
          Member Dashboard
        </Link>
      </div>
    </div>
  )
}

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const canAccess = hasBusinessAccess(user)
  // The signup page must render without the portal chrome or access gating,
  // otherwise members without a business account can never reach it.
  const isSignupRoute = pathname === '/business/signup'

  React.useEffect(() => {
    if (loading || isSignupRoute) return
    if (!user) {
      router.push('/login')
    }
    // Basic members stay on this layout briefly so BusinessPortalAccessDenied can show the upgrade modal.
    // Do NOT auto-redirect to /join — Part 10C requires the modal first.
  }, [user, loading, router, isSignupRoute])

  if (isSignupRoute) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
        <p className="text-neutral-500">Loading business portal...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
        <p className="text-neutral-500">Redirecting to login…</p>
      </div>
    )
  }

  if (!canAccess) {
    return <BusinessPortalAccessDenied />
  }

  const pageTitle = getBusinessPageTitle(pathname || '/business/dashboard')
  const welcome = `Welcome, ${getWelcomeFirstName(getUserDisplayName(user))}!`

  const mobileMenu = (
    <button
      type="button"
      data-dashboard-control
      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      className="md:hidden inline-flex items-center justify-center min-h-[32px] min-w-[32px] rounded-md bg-transparent text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
    >
      {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  )

  return (
    <div className="flex min-h-screen bg-[#faf9f7] dark:bg-neutral-950">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-neutral-200 dark:border-neutral-800 md:block">
        <BusinessSidebarContent />
      </aside>

      {/* Mobile Sidebar + Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 transform border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-transform duration-300 md:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <BusinessSidebarContent onNavigate={() => setIsSidebarOpen(false)} />
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <DashboardTopBar
          title={pageTitle}
          welcome={welcome}
          onLogout={handleLogout}
          logoutLabel="Sign out"
          trailing={mobileMenu}
        />

        {/* Content — always light surface so cards stay white with black text */}
        <div className="flex-1 overflow-auto" data-dashboard-surface="light">
          <DashboardErrorBoundary homeHref="/business/dashboard" homeLabel="Go to Business Dashboard">
            {children}
          </DashboardErrorBoundary>
        </div>
      </main>
    </div>
  )
}
