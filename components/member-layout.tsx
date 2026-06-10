'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogOut, LayoutDashboard, Calendar, Heart, Users, Settings, Menu, X } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { logoutUser } from '@/lib/auth'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

const memberMenuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Events', href: '/dashboard/events', icon: Calendar },
  { label: 'My Donations', href: '/dashboard/donations', icon: Heart },
  { label: 'Community', href: '/dashboard/community', icon: Users },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function MemberSidebar({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
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
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <Logo size="md" href="/dashboard" />
          <button onClick={() => setOpen(false)} className="md:hidden">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {memberMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
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
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-3">
          <ThemeToggle />
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>
    </>
  )
}

export function MemberHeader({ title, subtitle, open, setOpen }: { title: string; subtitle?: string; open: boolean; setOpen: (open: boolean) => void }) {
  return (
    <div className="bg-background border-b border-border px-6 py-6 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <button onClick={() => setOpen(!open)} className="md:hidden">
        <Menu className="h-6 w-6" />
      </button>
    </div>
  )
}
