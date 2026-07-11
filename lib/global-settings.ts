/**
 * Shared global settings types + merge — safe for Client SDK and Admin SDK routes.
 * Canonical Firestore path: platformConfig/globalSettings
 */

import { DEFAULT_SITE_THEME, mergeSiteTheme, type SiteTheme } from '@/lib/site-theme'

export type { SiteTheme }

export interface GlobalSocialLinks {
  facebook?: string
  twitter?: string
  instagram?: string
  linkedin?: string
  youtube?: string
  discord?: string
  tiktok?: string
  snapchat?: string
}

export interface GlobalSettings {
  whatsappLink: string
  platformName: string
  siteDescription: string
  contactEmail: string
  address: string
  phone: string
  logoUrlLight: string
  logoUrlDark: string
  faviconUrl: string
  socialLinks: GlobalSocialLinks
  footerText: string
  /** Site-wide fonts & colors (admin typography panel) */
  theme: SiteTheme
}

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  whatsappLink: '',
  platformName: 'Passive Blessings',
  siteDescription: 'Community platform for events, volunteering, and community support',
  contactEmail: 'contact@passiveblessings.org',
  address: 'Dubai, UAE',
  phone: '+971 50 000 0000',
  logoUrlLight: '',
  logoUrlDark: '',
  faviconUrl: '/favicon.ico',
  socialLinks: {},
  footerText: 'Passive Blessings © 2025. All rights reserved.',
  theme: DEFAULT_SITE_THEME,
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function mergeSocialLinks(raw: unknown): GlobalSocialLinks {
  if (!raw || typeof raw !== 'object') return {}
  const d = raw as Record<string, unknown>
  const out: GlobalSocialLinks = {}
  const keys: (keyof GlobalSocialLinks)[] = [
    'facebook',
    'twitter',
    'instagram',
    'linkedin',
    'youtube',
    'discord',
    'tiktok',
    'snapchat',
  ]
  for (const key of keys) {
    const v = asString(d[key]).trim()
    if (v) out[key] = v
  }
  return out
}

export function mergeGlobalSettings(data: Record<string, unknown> | undefined): GlobalSettings {
  if (!data) return DEFAULT_GLOBAL_SETTINGS
  const defaults = DEFAULT_GLOBAL_SETTINGS
  return {
    whatsappLink: asString(data.whatsappLink, defaults.whatsappLink),
    platformName: asString(data.platformName, defaults.platformName),
    siteDescription: asString(data.siteDescription, defaults.siteDescription),
    contactEmail: asString(data.contactEmail, defaults.contactEmail),
    address: asString(data.address, defaults.address),
    phone: asString(data.phone, defaults.phone),
    logoUrlLight: asString(data.logoUrlLight || data.logoUrl, defaults.logoUrlLight),
    logoUrlDark: asString(data.logoUrlDark, defaults.logoUrlDark),
    faviconUrl: asString(data.faviconUrl, defaults.faviconUrl),
    socialLinks: mergeSocialLinks(data.socialLinks || data.social),
    footerText: asString(data.footerText, defaults.footerText),
    theme: mergeSiteTheme(data.theme),
  }
}
