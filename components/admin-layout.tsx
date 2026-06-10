import React from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LogOut,
  Settings,
  BarChart3,
  Users,
  Calendar,
  Store,
  FileText,
  Zap,
  Heart,
  DollarSign,
  CheckCircle,
  ShieldAlert,
  CreditCard,
  AlertCircle,
  Flag,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import { logoutUser } from '@/lib/auth'

const adminMenuItems = [
  { label: 'Overview', href: '/admin', icon: BarChart3 },
  { label: 'Members', href: '/admin/members', icon: Users },
  { label: 'Volunteers', href: '/admin/volunteers', icon: Heart },
  { label: 'Events', href: '/admin/events', icon: Calendar },
  { label: 'Charity Cases', href: '/admin/charity', icon: ShieldAlert },
  { label: 'Donations', href: '/admin/donations', icon: DollarSign },
  { label: 'Sponsors', href: '/admin/sponsors', icon: Store },
  { label: 'Businesses', href: '/admin/businesses', icon: Store },
  { label: 'Approvals', href: '/admin/approvals', icon: CheckCircle },
  { label: 'Contact Requests', href: '/admin/contact-requests', icon: Mail },
  { label: 'Membership', href: '/admin/membership', icon: CreditCard },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Reporting', href: '/admin/reporting', icon: FileText },
  { label: 'Moderation', href: '/admin/moderation', icon: Flag },
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
    <aside className="w-44 min-h-screen flex flex-col border-r" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
      {/* Logo */}
      <div className="p-4 border-b" style={{ borderColor: '#e4e1da' }}>
        <Logo size="sm" href="/admin" />
        <p className="text-xs mt-2" style={{ color: '#888888' }}>ESTD 2025</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {adminMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs"
              style={{
                backgroundColor: isActive ? '#111111' : 'transparent',
                color: isActive ? '#f7f6f2' : '#333333',
              }}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t space-y-2" style={{ borderColor: '#e4e1da' }}>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition"
          style={{
            backgroundColor: '#f7f6f2',
            color: '#111111',
            border: '1px solid #e4e1da',
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

export function AdminHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b px-8 py-6" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
      <h1 className="text-2xl font-bold" style={{ color: '#111111', fontFamily: 'Playfair Display', fontWeight: 700 }}>
        {title}
      </h1>
      {subtitle && <p className="text-xs mt-1" style={{ color: '#888888' }}>{subtitle}</p>}
    </div>
  )
}
