'use client'

import React from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import Link from 'next/link'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  href?: string
}

export function Logo({ className = '', size = 'md', href = '/' }: LogoProps) {
  const { theme, systemTheme } = useTheme()
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

  // White logo for dark backgrounds, black logo for light backgrounds
  const logoUrl = isDark
    ? 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PB%20ORIGINAL%20LOGO%20%5Bwhite%5D-yu7P76Kj7QQ6XvNGPww4648xqCmM4s.png'
    : 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PB%20ORIGINAL%20LOGO%20%5Bblack%5D-9KcTa1PocHznEBM4QR6dN4R2eseFlT.png'

  if (!mounted) {
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
