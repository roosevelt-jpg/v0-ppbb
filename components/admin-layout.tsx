import React from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, Settings, BarChart3, Users, Calendar, Store, FileText, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import { logoutUser } from '@/lib/auth'

const adminMenuItems = [
  { label: 'Overview', href: '/admin', icon: BarChart3 },
  { label: 'Members', href: '/admin/members', icon: Users },
  { label: 'Events', href: '/admin/events', icon: Calendar },
  { label: 'Businesses', href: '/admin/businesses', icon: Store },
  { label: 'Pages (CMS)', href: '/admin/pages', icon: FileText },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'System Health', href: '/admin/health', icon: Zap },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await logoutUser()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Logo size="md" href="/admin" />
        <p className="text-xs text-muted-foreground mt-2">ESTD 2025</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {adminMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
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
  )
}

export function AdminHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-background border-b border-border px-8 py-6">
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  )
}
