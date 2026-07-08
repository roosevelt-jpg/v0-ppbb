'use client'

import React from 'react'
import Link from 'next/link'
import { useLogos } from '@/hooks/use-logos'
import { getLogoForBackground } from '@/lib/logo-manager'
import { DEFAULT_GLOBAL_SETTINGS } from '@/lib/global-settings'

export type SiteLogoBackground = 'light' | 'dark'

interface SiteLogoProps {
  /** Background the logo sits on — dark navbar/footer use `dark`, white sidebars use `light` */
  background: SiteLogoBackground
  href?: string
  alt?: string
  className?: string
  /** Tailwind height class, e.g. h-8 */
  heightClass?: string
  /** Inline max width for footer-style logos */
  maxWidth?: number | string
  /** When false, render image only (wrap in your own Link) */
  linked?: boolean
  onClick?: () => void
}

export function SiteLogo({
  background,
  href = '/',
  alt,
  className = '',
  heightClass = 'h-8',
  maxWidth,
  linked = true,
  onClick,
}: SiteLogoProps) {
  const { logos } = useLogos()
  const src = getLogoForBackground(background, logos)
  const label = alt || DEFAULT_GLOBAL_SETTINGS.platformName

  const img = (
    <img
      src={src}
      alt={label}
      className={`w-auto object-contain ${heightClass} ${className}`}
      style={maxWidth ? { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth } : undefined}
    />
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="inline-flex shrink-0">
        {img}
      </button>
    )
  }

  if (linked && href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {img}
      </Link>
    )
  }

  return <span className="inline-flex shrink-0">{img}</span>
}
