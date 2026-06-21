'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogOut, LayoutDashboard, Calendar, Heart, Users, Settings, Menu, X, Briefcase, ShoppingBag, BookOpen, Award, MessageSquare, HelpCircle, Crown, Inbox, Package } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { logoutUser } from '@/lib/auth'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'

const memberMenuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Events', href: '/dashboard/events', icon: Calendar },
  { label: 'My Donations', href: '/dashboard/donations', icon: Heart },
  { label: 'Volunteering', href: '/dashboard/volunteering', icon: Briefcase },
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
  showBusinessPortal = false,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  showBusinessPortal?: boolean
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
        <div className="p-6 border-b border-border flex flex-col items-center justify-center" style={{ minHeight: '100px', position: 'relative' }}>
          <Link href="/dashboard">
            <img 
              src="/pb-logo-black.png" 
              alt="Passive Blessings"
              style={{ maxWidth: '140px', height: 'auto' }}
            />
          </Link>
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

          {/* Business portal: link to dashboard if the member has a business
              account, otherwise invite them to create one. */}
          <div className="h-px bg-border my-2" />
          {showBusinessPortal ? (
            <Link
              href="/business/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-foreground hover:bg-secondary"
            >
              <Briefcase className="h-4 w-4" />
              <span className="text-sm font-medium">Business Portal</span>
            </Link>
          ) : (
            <Link
              href="/business/signup"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-primary hover:bg-secondary"
            >
              <Briefcase className="h-4 w-4" />
              <span className="text-sm font-medium">Create Business Account</span>
            </Link>
          )}
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
    <div className="bg-background border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <div className="flex items-center gap-4 mt-2">
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{dateTime}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
        <button onClick={() => setOpen(!open)} className="md:hidden">
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
