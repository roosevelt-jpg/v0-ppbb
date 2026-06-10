'use client'

import React from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useLogos } from '@/hooks/use-logos'
import { DEFAULT_LOGOS } from '@/lib/logo-manager'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  href?: string
}

export function Logo({ className = '', size = 'md', href = '/' }: LogoProps) {
  const { theme, systemTheme } = useTheme()
  const { logos, loading } = useLogos()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const sizeMap = {
    sm: { width: 80, height: 32 },
    md: { width: 120, height: 48 },
    lg: { width: 160, height: 64 },
  }

  const { width, height } = sizeMap[size]

  // Determine if we should show dark or light logo
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark')

  // Use dynamic logo or fallback
  const logoUrl = isDark ? logos.darkLogoUrl : logos.lightLogoUrl

  if (!mounted || loading) {
    return <div style={{ width, height }} className={className} />
  }

  const imageElement = (
    <Image
      src={logoUrl}
      alt="Passive Blessings"
      width={width}
      height={height}
      className={className}
      priority
    />
  )

  return href ? <Link href={href}>{imageElement}</Link> : imageElement
}
