'use client'

import React from 'react'
import Link from 'next/link'
import {
  DEFAULT_LOGO_ON_DARK_BG,
  DEFAULT_LOGO_ON_LIGHT_BG,
  getLogoForBackground,
} from '@/lib/logo-manager'
import { DEFAULT_GLOBAL_SETTINGS } from '@/lib/global-settings'

export type SiteLogoBackground = 'light' | 'dark'

/** Context-specific sizing tuned for the built-in original brand marks */
export type SiteLogoVariant = 'primary' | 'navbar' | 'sidebar' | 'footer' | 'custom'

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

const VARIANT_CLASSES: Record<
  Exclude<SiteLogoVariant, 'custom'>,
  { wrapper: string; img: string }
> = {
  primary: {
    wrapper: 'inline-flex items-center shrink-0 leading-none',
    img: 'block h-16 w-auto max-h-16 md:h-20 md:max-h-20 object-contain',
  },
  navbar: {
    wrapper:
      'inline-flex items-center self-stretch shrink-0 leading-none h-full max-w-[min(72vw,260px)] sm:max-w-[min(50vw,280px)]',
    img: 'block h-full max-h-full w-auto object-contain object-left',
  },
  sidebar: {
    wrapper: 'inline-flex items-center justify-center shrink-0 leading-none w-full max-w-[260px]',
    img: 'block w-full max-w-[260px] max-h-24 h-auto object-contain',
  },
  footer: {
    wrapper: 'inline-flex items-center shrink-0 leading-none',
    img: 'block w-auto max-w-[260px] max-h-20 h-auto object-contain',
  },
}

export function SiteLogo({
  background,
  href = '/',
  alt,
  className = '',
  heightClass = 'h-8',
  maxWidth,
  variant = 'primary',
  linked = true,
  onClick,
}: SiteLogoProps) {
  // Always use built-in originals (ignore admin-uploaded overrides).
  const src =
    background === 'dark' ? DEFAULT_LOGO_ON_DARK_BG : DEFAULT_LOGO_ON_LIGHT_BG
  const label = alt || DEFAULT_GLOBAL_SETTINGS.platformName

  const preset = variant !== 'custom' ? VARIANT_CLASSES[variant] : null
  const imgClass = preset
    ? `${preset.img} ${className}`.trim()
    : `block w-auto object-contain bg-transparent ${heightClass} ${className}`.trim()

  const imgStyle =
    variant === 'custom' && maxWidth
      ? {
          maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
          backgroundColor: 'transparent',
        }
      : { backgroundColor: 'transparent' as const }

  const img = (
    <img
      src={src || getLogoForBackground(background)}
      alt={label}
      className={imgClass}
      style={imgStyle}
      decoding="async"
    />
  )

  const wrapperClass = preset?.wrapper ?? 'inline-flex shrink-0 leading-none items-center'

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={wrapperClass}>
        {img}
      </button>
    )
  }

  if (linked && href) {
    return (
      <Link href={href} className={wrapperClass}>
        {img}
      </Link>
    )
  }

  return <span className={wrapperClass}>{img}</span>
}
