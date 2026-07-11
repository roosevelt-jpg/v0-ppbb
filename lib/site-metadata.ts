import { DEFAULT_LOGO_ON_LIGHT_BG } from '@/lib/brand-assets'

export const SITE_NAME = 'Passive Blessings'
export const SITE_DESCRIPTION =
  'Community platform for events, volunteering, and community support'

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://www.passive-blessings.com'
  ).replace(/\/$/, '')
}

/** Absolute logo URL used for social previews and Organization schema. */
export function getShareLogoUrl(): string {
  return DEFAULT_LOGO_ON_LIGHT_BG
}
