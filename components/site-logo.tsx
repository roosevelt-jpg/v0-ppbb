'use client'

import React from 'react'
import Link from 'next/link'
import { useLogos } from '@/hooks/use-logos'
import { getLogoForBackground } from '@/lib/logo-manager'
import { DEFAULT_GLOBAL_SETTINGS } from '@/lib/global-settings'

export type SiteLogoBackground = 'light' | 'dark'

/** Context-specific sizing — navbar is taller; sidebar/footer stay compact */
export type SiteLogoVariant = 'navbar' | 'sidebar' | 'footer' | 'custom'

interface SiteLogoProps {
  /** Background the logo sits on — dark navbar/footer use `dark`, white sidebars use `light` */
  background: SiteLogoBackground
  href?: string
  alt?: string
  className?: string
  /** Used when variant is `custom` */
  heightClass?: string
  /** Used when variant is `custom` */
  maxWidth?: number | string
  variant?: SiteLogoVariant
  /** When false, render image only (wrap in your own Link) */
  linked?: boolean
  onClick?: () => void
}

const VARIANT_CLASSES: Record<Exclude<SiteLogoVariant, 'custom'>, { wrapper: string; img: string }> = {
  navbar: {
    wrapper: 'inline-flex items-center shrink-0 leading-none max-w-[min(48vw,220px)] sm:max-w-[min(40vw,260px)] md:max-w-none',
    img: 'block h-9 w-auto max-h-9 sm:h-10 sm:max-h-10 md:h-12 md:max-h-12 lg:h-14 lg:max-h-14 object-contain object-left',
  },
  sidebar: {
    wrapper: 'inline-flex items-center justify-center shrink-0 leading-none w-full max-w-[140px]',
    img: 'block w-full max-w-[140px] max-h-14 h-auto object-contain',
  },
  footer: {
    wrapper: 'inline-flex items-center shrink-0 leading-none',
    img: 'block w-auto max-w-[140px] max-h-12 h-auto object-contain',
  },
}

export function SiteLogo({
  background,
  href = '/',
  alt,
  className = '',
  heightClass = 'h-8',
  maxWidth,
  variant = 'custom',
  linked = true,
  onClick,
}: SiteLogoProps) {
  const { logos } = useLogos()
  const src = getLogoForBackground(background, logos)
  const label = alt || DEFAULT_GLOBAL_SETTINGS.platformName

  const preset = variant !== 'custom' ? VARIANT_CLASSES[variant] : null
  const imgClass = preset
    ? `${preset.img} ${className}`.trim()
    : `block w-auto object-contain ${heightClass} ${className}`.trim()

  const imgStyle =
    variant === 'custom' && maxWidth
      ? { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }
      : undefined

  const img = (
    <img
      src={src}
      alt={label}
      className={imgClass}
      style={imgStyle}
      decoding="async"
    />
  )

  const wrapperClass = preset?.wrapper ?? 'inline-flex shrink-0 leading-none items-center'

  const content = onClick ? (
    <button type="button" onClick={onClick} className={wrapperClass}>
      {img}
    </button>
  ) : linked && href ? (
    <Link href={href} className={wrapperClass}>
      {img}
    </Link>
  ) : (
    <span className={wrapperClass}>{img}</span>
  )

  return content
}
