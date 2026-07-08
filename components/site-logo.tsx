'use client'

import React from 'react'
import Link from 'next/link'
import { useLogos } from '@/hooks/use-logos'
import { getLogoForBackground } from '@/lib/logo-manager'
import { DEFAULT_GLOBAL_SETTINGS } from '@/lib/global-settings'

export type SiteLogoBackground = 'light' | 'dark'

/** Canonical brand logo box — 190×84 at md+; scaled on mobile (375px) */
export const LOGO_BOX_WIDTH_PX = 190
export const LOGO_BOX_HEIGHT_PX = 84
/** Mobile: ~68% scale so logo fits beside hamburger + controls at 375px */
export const LOGO_BOX_MOBILE_WIDTH_PX = 130
export const LOGO_BOX_MOBILE_HEIGHT_PX = Math.round(
  (LOGO_BOX_MOBILE_WIDTH_PX * LOGO_BOX_HEIGHT_PX) / LOGO_BOX_WIDTH_PX
) // 58px — preserves 190:84 aspect ratio

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
  /** `primary` (and legacy navbar/sidebar/footer aliases) use the 190×84 box */
  variant?: SiteLogoVariant
  /** When false, render image only (wrap in your own Link) */
  linked?: boolean
  onClick?: () => void
}

function usesPrimaryBox(variant: SiteLogoVariant): boolean {
  return variant === 'primary' || variant === 'navbar' || variant === 'sidebar' || variant === 'footer'
}

function objectPositionForVariant(variant: SiteLogoVariant): React.CSSProperties['objectPosition'] {
  if (variant === 'navbar') return 'left center'
  return 'center'
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
  const { logos } = useLogos()
  const src = getLogoForBackground(background, logos)
  const label = alt || DEFAULT_GLOBAL_SETTINGS.platformName

  const isPrimary = usesPrimaryBox(variant)

  const box = isPrimary ? (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden w-[130px] h-[58px] md:w-[190px] md:h-[84px] ${className}`.trim()}
      aria-hidden
    >
      <img
        src={src}
        alt={label}
        width={LOGO_BOX_WIDTH_PX}
        height={LOGO_BOX_HEIGHT_PX}
        className="block w-full h-full object-contain"
        style={{ objectPosition: objectPositionForVariant(variant) }}
        decoding="async"
      />
    </span>
  ) : (
    <img
      src={src}
      alt={label}
      className={`block w-auto object-contain ${heightClass} ${className}`.trim()}
      style={
        maxWidth
          ? { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }
          : undefined
      }
      decoding="async"
    />
  )

  const wrapperClass = 'inline-flex shrink-0 leading-none items-center'

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={wrapperClass}>
        {box}
      </button>
    )
  }

  if (linked && href) {
    return (
      <Link href={href} className={wrapperClass}>
        {box}
      </Link>
    )
  }

  return <span className={wrapperClass}>{box}</span>
}
