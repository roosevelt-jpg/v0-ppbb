'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { BusinessPortalSwitcher } from '@/components/business-portal-switcher'
import { DashboardHeaderActions } from '@/components/dashboard-header-actions'
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
    <div className="border-b px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
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
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <BusinessPortalSwitcher />
        <DashboardHeaderActions onLogout={handleLogout} logoutLabel="Sign out" />
      </div>
    </div>
  )
}
