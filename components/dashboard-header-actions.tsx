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
    <div className={`flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${className}`}>
      <LanguageSelector />
      <ThemeToggle />
      <ProfileMenuButton />
      <button
        type="button"
        onClick={() => void onLogout()}
        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] sm:min-w-0 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium bg-black text-white hover:bg-neutral-800 transition-colors"
        aria-label={logoutLabel}
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">{logoutLabel}</span>
      </button>
    </div>
  )
}
