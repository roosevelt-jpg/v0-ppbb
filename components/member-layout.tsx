'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Calendar, Heart, Users, Settings, Menu, X, Briefcase, ShoppingBag, BookOpen, Award, MessageSquare, HelpCircle, Crown, Inbox, Package } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { logoutUser } from '@/lib/auth'
import { BusinessPortalSwitcher } from '@/components/business-portal-switcher'
import { SiteLogo } from '@/components/site-logo'
import { DashboardHeaderActions } from '@/components/dashboard-header-actions'

/** Part 10A — ONLY these items for basic members. No admin/security/recordings. */
const memberMenuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Events', href: '/dashboard/events', icon: Calendar },
  { label: 'My Donations', href: '/dashboard/donations', icon: Heart },
  { label: 'Volunteering', href: '/dashboard/volunteering', icon: Briefcase },
  { label: 'Active Causes', href: '/dashboard/charity', icon: Heart },
  { label: 'Charity Requests', href: '/dashboard/charity-requests', icon: HelpCircle },
  { label: 'Opportunities', href: '/dashboard/opportunities', icon: Users },
  { label: 'Marketplace', href: '/dashboard/marketplace', icon: ShoppingBag },
  { label: 'Orders', href: '/dashboard/orders', icon: Package },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { label: 'Learning', href: '/dashboard/learning', icon: BookOpen },
  { label: 'Certificates', href: '/dashboard/certificates', icon: Award },
  { label: 'Membership', href: '/dashboard/membership', icon: Crown },
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
  const router = useRouter()

  const handleLogout = async () => {
    await logoutUser()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative w-64 bg-card border-r border-border min-h-screen flex flex-col transform transition-transform z-40 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and Close Button */}
        <div className="px-4 py-4 border-b border-border flex flex-col items-center justify-center relative">
          <SiteLogo background="light" variant="sidebar" href="/dashboard" />
          <button onClick={() => setOpen(false)} className="md:hidden absolute top-4 right-4">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {memberMenuItems.map((item: any) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <div key={item.href}>
                {item.divider && <div className="h-px bg-border my-2" />}
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </div>
            )
          })}


        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          {/* Footer is now empty - controls moved to header */}
        </div>
      </aside>
    </>
  )
}

export function MemberHeader({ title, subtitle, open, setOpen }: { title: string; subtitle?: string; open: boolean; setOpen: (open: boolean) => void }) {
  const router = useRouter()
  const [dateTime, setDateTime] = React.useState<string>('')

  React.useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }
      setDateTime(now.toLocaleDateString('en-US', options))
    }

    updateDateTime()
    const interval = setInterval(updateDateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    await logoutUser()
    router.push('/login')
  }

  return (
    <div className="bg-background border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{title}</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 sm:mt-2">
          {subtitle && <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate max-w-[12rem] sm:max-w-none">{dateTime}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <BusinessPortalSwitcher />
        <DashboardHeaderActions onLogout={handleLogout} logoutLabel="Sign out" />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="md:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-secondary"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
