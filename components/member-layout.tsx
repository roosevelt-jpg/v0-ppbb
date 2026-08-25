'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Calendar,
  Heart,
  Users,
  Settings,
  Menu,
  X,
  Briefcase,
  ShoppingBag,
  BookOpen,
  Award,
  MessageSquare,
  HelpCircle,
  Crown,
  Package,
  FolderOpen,
  Store,
  Wallet,
  Sparkles,
  Repeat,
  Star,
} from 'lucide-react'
import { logoutUser } from '@/lib/auth'
import { BusinessPortalSwitcher } from '@/components/business-portal-switcher'
import { SiteLogo } from '@/components/site-logo'
import { DashboardTopBar } from '@/components/dashboard-top-bar'
import { getMemberPageTitle, getWelcomeFirstName } from '@/lib/dashboard-page-titles'
import { getUserDisplayName } from '@/lib/user-profile'
import { useAuth } from '@/lib/auth-context'

/** Part 10A — ONLY these items for basic members. No admin/security/recordings. */
const memberMenuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Events', href: '/dashboard/events', icon: Calendar },
  { label: 'Event Assets', href: '/dashboard/assets', icon: FolderOpen },
  { label: 'My Donations', href: '/dashboard/donations', icon: Heart },
  { label: 'Volunteering', href: '/dashboard/volunteering', icon: Briefcase },
  { label: 'Active Causes', href: '/dashboard/charity', icon: Heart },
  { label: 'Charity Requests', href: '/dashboard/charity-requests', icon: HelpCircle },
  { label: 'Opportunities', href: '/dashboard/opportunities', icon: Users },
  { label: 'Marketplace', href: '/dashboard/marketplace', icon: ShoppingBag },
  { label: 'Business Directory', href: '/directory', icon: Store },
  { label: 'Orders', href: '/dashboard/orders', icon: Package },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { label: 'Learning', href: '/dashboard/learning', icon: BookOpen },
  { label: 'Certificates', href: '/dashboard/certificates', icon: Award },
  { label: 'Membership', href: '/dashboard/membership', icon: Crown },
  { label: 'My Communities', href: '/dashboard/communities', icon: Users },
  { label: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
  { label: 'AI Matches', href: '/dashboard/ai-matches', icon: Sparkles },
  { label: 'Recurring Donations', href: '/dashboard/recurring-donations', icon: Repeat },
  { label: 'Community Reputation', href: '/dashboard/community-reputation', icon: Star },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function MemberSidebar({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const pathname = usePathname()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed md:relative w-64 bg-card border-r border-border min-h-screen flex flex-col transform transition-transform z-40 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-4 border-b border-border flex flex-col items-center justify-center relative">
          <SiteLogo background="light" variant="sidebar" href="/dashboard" />
          <button
            type="button"
            data-dashboard-control
            onClick={() => setOpen(false)}
            className="md:hidden absolute top-4 right-4 bg-transparent text-foreground"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {memberMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 min-h-[44px] rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}

          <BusinessPortalSwitcher variant="sidebar" onNavigate={() => setOpen(false)} />
        </nav>

        <div className="p-4 border-t border-border" />
      </aside>
    </>
  )
}

export function MemberHeader({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  const handleLogout = async () => {
    await logoutUser()
    router.push('/login')
  }

  const pageTitle = getMemberPageTitle(pathname || '/dashboard')
  const welcome = user
    ? `Welcome, ${getWelcomeFirstName(getUserDisplayName(user))}!`
    : undefined

  return (
    <DashboardTopBar
      title={pageTitle}
      welcome={welcome}
      onLogout={handleLogout}
      logoutLabel="Sign out"
      trailing={
        <button
          type="button"
          data-dashboard-control
          onClick={() => setOpen(!open)}
          className="md:hidden inline-flex items-center justify-center min-h-[32px] min-w-[32px] rounded-lg bg-transparent hover:bg-secondary"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <Menu className="h-5 w-5" />
        </button>
      }
    />
  )
}
