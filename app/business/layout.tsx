'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { BusinessPortalAccessDenied } from '@/components/business-feature-gate'
import Link from 'next/link'
import { SiteLogo } from '@/components/site-logo'
import { ProfileMenuButton } from '@/components/profile-quick-edit'
import {
  LogOut,
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
  Moon,
  Sun,
  Globe,
  Calendar,
  Users2,
} from 'lucide-react'

const businessMenuItems = [
  { label: 'Dashboard', href: '/business/dashboard', icon: BarChart3 },
  { label: 'Profile', href: '/business/profile', icon: Users },
  { label: 'Events', href: '/business/events', icon: Calendar },
  { label: 'Communities', href: '/business/communities', icon: Users2 },
  { label: 'Opportunities', href: '/business/opportunities', icon: Briefcase },
  { label: 'Offers', href: '/business/offers', icon: ShoppingBag },
  { label: 'Leads', href: '/business/leads', icon: Zap },
  { label: 'Referrals', href: '/business/referrals', icon: Share2 },
  { label: 'Partnerships', href: '/business/partnerships', icon: Heart },
  { label: 'Marketplace', href: '/business/marketplace', icon: LayoutGrid },
  { label: 'Payments', href: '/business/payments', icon: DollarSign },
  { label: 'Analytics', href: '/business/analytics', icon: TrendingUp },
]

function BusinessHeaderDate({ mobile = false }: { mobile?: boolean }) {
  const [dateTime, setDateTime] = React.useState('')

  React.useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      const formatted = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(now)
      setDateTime(formatted)
    }

    updateDateTime()
    const interval = setInterval(updateDateTime, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`text-sm text-neutral-600 ${mobile ? 'text-xs' : ''}`}>
      {dateTime || 'Loading...'}
    </div>
  )
}

function BusinessSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="flex h-full min-h-screen flex-col bg-white">
      {/* Header with Logo */}
      <div className="border-b border-neutral-200 px-4 py-4 flex items-center justify-center">
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
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
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
      <div className="border-t border-neutral-200 p-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="mb-2 flex items-center gap-3 rounded-lg bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
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

  return (
    <div className="flex min-h-screen bg-[#faf9f7]">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-neutral-200 md:block">
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
        className={`fixed left-0 top-0 z-40 h-full w-64 transform border-r border-neutral-200 transition-transform duration-300 md:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <BusinessSidebarContent onNavigate={() => setIsSidebarOpen(false)} />
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 md:flex">
          <BusinessHeaderDate />
          <div className="flex items-center gap-3">
            <ProfileMenuButton />
            <button
              className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
              aria-label="Language"
              title="Language"
            >
              <Globe className="h-5 w-5" />
            </button>
            <button
              className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
              aria-label="Theme"
              title="Dark mode"
            >
              <Moon className="h-5 w-5" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 bg-white p-4 md:hidden">
          <BusinessHeaderDate mobile />
          <div className="flex items-center gap-2">
            <ProfileMenuButton />
            <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-md p-2 text-neutral-700 hover:bg-neutral-100"
            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  )
}
