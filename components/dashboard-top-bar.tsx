'use client'

import React from 'react'
import { DashboardHeaderActions } from '@/components/dashboard-header-actions'

interface DashboardTopBarProps {
  title: string
  welcome?: string
  onLogout: () => void | Promise<void>
  logoutLabel?: string
  /** Optional mobile menu toggle (business/member sidebars) */
  trailing?: React.ReactNode
  className?: string
}

function useLiveDateTime() {
  const [dateTime, setDateTime] = React.useState('')

  React.useEffect(() => {
    const update = () => {
      const now = new Date()
      setDateTime(
        new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(now)
      )
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])

  return dateTime
}

/**
 * Unified dashboard header: title (left) · date/time (center) · welcome + actions (right).
 */
export function DashboardTopBar({
  title,
  welcome,
  onLogout,
  logoutLabel = 'Sign out',
  trailing,
  className = '',
}: DashboardTopBarProps) {
  const dateTime = useLiveDateTime()

  return (
    <header
      className={`shrink-0 border-b border-neutral-200 bg-white px-4 sm:px-6 py-3 ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-4 gap-y-1 min-h-[40px]">
        {/* Page title — far left */}
        <h1 className="font-headline text-base sm:text-lg font-bold text-neutral-900 truncate sm:justify-self-start">
          {title}
        </h1>

        {/* Date/time — centered */}
        <p className="hidden sm:block text-xs sm:text-sm text-neutral-500 text-center whitespace-nowrap px-2">
          {dateTime || '…'}
        </p>

        {/* Welcome + toolbar — right */}
        <div className="flex items-center gap-2 sm:gap-3 justify-end sm:justify-self-end col-span-1 sm:col-span-1">
          {welcome ? (
            <p className="hidden md:block text-sm text-neutral-600 whitespace-nowrap truncate max-w-[200px]">
              {welcome}
            </p>
          ) : null}
          <DashboardHeaderActions onLogout={onLogout} logoutLabel={logoutLabel} />
          {trailing}
        </div>
      </div>

      {/* Mobile: date + welcome below main row */}
      <div className="sm:hidden mt-1 flex flex-col items-center gap-0.5">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center truncate w-full">
          {dateTime || '…'}
        </p>
        {welcome ? (
          <p className="md:hidden text-xs text-neutral-600 dark:text-neutral-300 text-center truncate w-full">
            {welcome}
          </p>
        ) : null}
      </div>
    </header>
  )
}
