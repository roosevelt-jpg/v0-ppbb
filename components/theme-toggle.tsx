'use client'

import React from 'react'
import { useTheme } from '@/components/theme-provider'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={compact ? 'h-7 w-7' : 'h-9 w-9'} />
  }

  const iconClass = compact ? 'h-3 w-3' : 'h-4 w-4'
  const buttonClass = compact
    ? 'relative inline-flex items-center justify-center min-h-[32px] min-w-[32px] rounded-md p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'
    : 'relative inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={buttonClass}
      aria-label="Toggle theme"
    >
      <Sun className={`${iconClass} rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0`} />
      <Moon className={`absolute ${iconClass} rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100`} />
    </button>
  )
}
