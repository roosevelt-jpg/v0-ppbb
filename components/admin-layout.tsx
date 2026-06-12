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
  HandHeart,
  Target,
  Plug,
  Image,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { logoutUser } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'

const adminMenuItems = [
  { label: 'Overview', href: '/admin', icon: BarChart3 },
  { label: 'Members', href: '/admin/members', icon: Users },
  { label: 'Team (About)', href: '/admin/team', icon: Users },
  { label: 'Volunteers', href: '/admin/volunteers', icon: Heart },
  { label: 'Events', href: '/admin/events', icon: Calendar },
  { label: 'Charity Cases', href: '/admin/charity', icon: ShieldAlert },
  { label: 'Donations', href: '/admin/donations', icon: DollarSign },
  { label: 'Donation Causes', href: '/admin/causes', icon: Target },
  { label: 'Charity Partners', href: '/admin/partners', icon: HandHeart },
  { label: 'Donation Verification', href: '/admin/donation-verification', icon: CheckCircle },
  { label: 'Sponsors', href: '/admin/sponsors', icon: Store },
  { label: 'Businesses', href: '/admin/businesses', icon: Store },
  { label: 'Approvals', href: '/admin/approvals', icon: CheckCircle },
  { label: 'Contact Requests', href: '/admin/contact-requests', icon: Mail },
  { label: 'Membership', href: '/admin/membership', icon: CreditCard },
  { label: 'Pricing Plans', href: '/admin/pricing', icon: DollarSign },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Reporting', href: '/admin/reporting', icon: FileText },
  { label: 'Moderation', href: '/admin/moderation', icon: Flag },
  { label: 'Pages (CMS)', href: '/admin/pages', icon: FileText },
  { label: 'Hero Slider', href: '/admin/assets', icon: Image },
  { label: 'YouTube Videos', href: '/admin/youtube-config', icon: Play },
  { label: 'Policies', href: '/admin/policies', icon: FileText },
  { label: 'Integrations', href: '/admin/integrations', icon: Plug },
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
      <div className="p-4 border-b flex flex-col items-center justify-center" style={{ borderColor: '#e4e1da', minHeight: '100px' }}>
        <Link href="/admin">
          <img 
            src="/pb-logo-black.png" 
            alt="Passive Blessings"
            style={{ maxWidth: '140px', height: 'auto' }}
          />
        </Link>
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
  const router = useRouter()
  const [dateTime, setDateTime] = React.useState<string>('')
  const [unreadMessages, setUnreadMessages] = React.useState<number>(0)

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

  React.useEffect(() => {
    // Subscribe to unread messages
    const q = query(collection(db, 'contactRequests'), where('read', '==', false))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUnreadMessages(snapshot.size)
      },
      (error) => {
        console.error('[v0] Error fetching unread messages:', error)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    await logoutUser()
    router.push('/login')
  }

  return (
    <div className="border-b px-8 py-4 flex items-center justify-between" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
      <div className="flex-1">
        <h1 className="text-2xl font-bold" style={{ color: '#111111', fontFamily: 'Playfair Display', fontWeight: 700 }}>
          {title}
        </h1>
        <div className="flex items-center gap-4 mt-2">
          {subtitle && <p className="text-xs" style={{ color: '#888888' }}>{subtitle}</p>}
          <div className="flex items-center gap-1 text-xs" style={{ color: '#888888' }}>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{dateTime}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        {/* Message Notification Badge */}
        {unreadMessages > 0 && (
          <Link href="/admin/contact-requests">
            <button className="relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors" style={{ backgroundColor: '#fff3e0', border: '2px solid #ff6b6b' }}>
              <Mail className="h-5 w-5" style={{ color: '#ff6b6b' }} />
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" style={{ backgroundColor: '#ff6b6b' }}>
                {unreadMessages}
              </span>
            </button>
          </Link>
        )}
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
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
    </div>
  )
}
