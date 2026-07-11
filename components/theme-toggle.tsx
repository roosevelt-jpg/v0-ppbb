'use client'

import React from 'react'
import { useTheme } from '@/components/theme-provider'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle({
  compact = false,
  /** White icons for dark navbar backgrounds */
  onDark = false,
}: {
  compact?: boolean
  onDark?: boolean
}) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div data-dashboard-control className={compact ? 'h-7 w-7' : 'h-10 w-10'} />
  }

  const isDark = resolvedTheme === 'dark'
  const iconClass = compact ? 'h-2.5 w-2.5' : 'h-4 w-4'
  const buttonClass = onDark
    ? compact
      ? 'relative inline-flex items-center justify-center min-h-[28px] min-w-[28px] rounded-md p-1 bg-transparent text-white hover:text-white hover:bg-white/10 transition-colors'
      : 'relative inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg p-2 bg-transparent text-white hover:text-white hover:bg-white/10 transition-colors'
    : compact
      ? 'relative inline-flex items-center justify-center min-h-[28px] min-w-[28px] rounded-md p-1 bg-transparent text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors'
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
