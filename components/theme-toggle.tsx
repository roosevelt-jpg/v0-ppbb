'use client'

import React from 'react'
import { useTheme } from '@/components/theme-provider'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div data-dashboard-control className={compact ? 'h-8 w-8' : 'h-10 w-10'} />
  }

  const isDark = resolvedTheme === 'dark'
  const iconClass = compact ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const buttonClass = compact
    ? 'relative inline-flex items-center justify-center min-h-[32px] min-w-[32px] rounded-md p-1.5 bg-transparent text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors'
    : 'relative inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg p-2 bg-transparent text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors'

  return (
    <button
      type="button"
      data-dashboard-control
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={buttonClass}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <Sun
        className={`${iconClass} transition-all ${isDark ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-hidden
      />
      <Moon
        className={`absolute ${iconClass} transition-all ${isDark ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
        aria-hidden
      />
    </button>
  )
}
