'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import Link from 'next/link'
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
} from 'lucide-react'

const businessMenuItems = [
  { label: 'Dashboard', href: '/business/dashboard', icon: BarChart3 },
  { label: 'Profile', href: '/business/profile', icon: Users },
  { label: 'Opportunities', href: '/business/opportunities', icon: Briefcase },
  { label: 'Offers', href: '/business/offers', icon: ShoppingBag },
  { label: 'Leads', href: '/business/leads', icon: Zap },
  { label: 'Referrals', href: '/business/referrals', icon: Share2 },
  { label: 'Partnerships', href: '/business/partnerships', icon: Heart },
  { label: 'Marketplace', href: '/business/marketplace', icon: LayoutGrid },
  { label: 'Payments', href: '/business/payments', icon: DollarSign },
  { label: 'Analytics', href: '/business/analytics', icon: TrendingUp },
]

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
      {/* Header */}
      <div className="border-b border-neutral-200 p-6">
        <Link href="/business/dashboard" className="block">
          <h2 className="text-lg font-bold text-neutral-900">Business Portal</h2>
          <p className="mt-1 text-xs text-neutral-500">Passive Blessings</p>
        </Link>
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
          className="mb-2 flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
        >
          <Users className="h-4 w-4 shrink-0" />
          Member Dashboard
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:border-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
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
  const { user, loading } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

  const canAccess = hasBusinessAccess(user)
  // The signup page must render without the portal chrome or access gating,
  // otherwise members without a business account can never reach it.
  const isSignupRoute = pathname === '/business/signup'

  React.useEffect(() => {
    if (loading || isSignupRoute) return
    if (!user) {
      router.push('/login')
    } else if (!canAccess) {
      // Logged in but no business account yet - send to business signup
      router.push('/business/signup')
    }
  }, [user, loading, canAccess, router, isSignupRoute])

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

  if (!user || !canAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
        <p className="text-neutral-500">Redirecting...</p>
      </div>
    )
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
        {/* Mobile Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 bg-white p-4 md:hidden">
          <h1 className="text-xl font-bold text-neutral-900">Business Portal</h1>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-md p-2 text-neutral-700 hover:bg-neutral-100"
            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  )
}
