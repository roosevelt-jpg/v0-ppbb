'use client'

import React from 'react'
import { LogOut } from 'lucide-react'
import { LanguageSelector } from '@/components/language-selector'
import { ThemeToggle } from '@/components/theme-toggle'
import { ProfileMenuButton } from '@/components/profile-quick-edit'

interface DashboardHeaderActionsProps {
  onLogout: () => void | Promise<void>
  /** Full label on sm+ screens */
  logoutLabel?: string
  className?: string
}

/**
 * Shared top-right actions for admin, member, and business dashboard headers.
 * Language · theme · profile · logout — consistent sizing across roles.
 */
export function DashboardHeaderActions({
  onLogout,
  logoutLabel = 'Logout',
  className = '',
}: DashboardHeaderActionsProps) {
  return (
    <div className={`flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ${className}`}>
      <LanguageSelector compact />
      <ThemeToggle compact />
      <ProfileMenuButton compact />
      <button
        type="button"
        data-dashboard-control
        onClick={() => void onLogout()}
        className="inline-flex items-center justify-center gap-1 min-h-[28px] min-w-[28px] sm:min-w-0 px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-medium bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white transition-colors"
        aria-label={logoutLabel}
      >
        <LogOut className="h-2.5 w-2.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">{logoutLabel}</span>
      </button>
    </div>
  )
}
