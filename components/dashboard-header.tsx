'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Clock } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcherWithFlags } from '@/components/language-switcher-flags'
import { BusinessPortalSwitcher } from '@/components/business-portal-switcher'
import { logoutUser } from '@/lib/auth'

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  showDateTime?: boolean
}

export function DashboardHeader({ title, subtitle, showDateTime = true }: DashboardHeaderProps) {
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
    <div className="border-b px-8 py-4 flex items-center justify-between" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
      <div className="flex-1">
        <h1 className="text-2xl font-bold font-headline" style={{ color: '#111111', fontWeight: 700 }}>
          {title}
        </h1>
        <div className="flex items-center gap-4 mt-2">
          {subtitle && <p className="text-xs" style={{ color: '#888888' }}>{subtitle}</p>}
          {showDateTime && (
            <div className="flex items-center gap-1 text-xs" style={{ color: '#888888' }}>
              <Clock className="h-3 w-3" />
              <span>{dateTime}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <BusinessPortalSwitcher />
        <LanguageSwitcherWithFlags />
        <ThemeToggle />
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
