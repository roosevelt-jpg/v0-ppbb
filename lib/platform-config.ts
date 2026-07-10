'use client'

import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import {
  DEFAULT_GLOBAL_SETTINGS,
  mergeGlobalSettings,
  type GlobalSettings,
  type GlobalSocialLinks,
} from '@/lib/global-settings'

export type { GlobalSettings, GlobalSocialLinks }
export { DEFAULT_GLOBAL_SETTINGS, mergeGlobalSettings }

export interface NavLink {
  label: string
  href: string
  order: number
  isVisible: boolean
}

export interface NavigationConfig {
  links: NavLink[]
  ctaButton: { label: string; href: string }
  signInLabel: string
  whatsappLink?: string
}

export const DEFAULT_NAVIGATION: NavigationConfig = {
  links: [
    { label: 'About us', href: '/about', order: 0, isVisible: true },
    { label: 'Impact', href: '/transparency', order: 1, isVisible: true },
    { label: 'Events', href: '/events', order: 2, isVisible: true },
    { label: 'Marketplace', href: '/marketplace', order: 3, isVisible: true },
    { label: 'Opportunities', href: '/opportunities', order: 4, isVisible: true },
    { label: 'Partners', href: '/partners', order: 5, isVisible: true },
    { label: 'Contact', href: '/contact', order: 6, isVisible: true },
  ],
  ctaButton: { label: 'Join now', href: '/join' },
  signInLabel: 'Sign in',
  whatsappLink: '',
}

function mergeNavigation(data: Record<string, unknown> | undefined): NavigationConfig {
  if (!data) return DEFAULT_NAVIGATION
  const rawLinks = Array.isArray(data.links)
    ? (data.links as NavLink[])
        .filter((l) => l && typeof l.label === 'string' && typeof l.href === 'string')
        .map((l, i) => ({
          label: l.label,
          href: l.href,
          order: typeof l.order === 'number' ? l.order : i,
          isVisible: l.isVisible !== false,
        }))
        .sort((a, b) => a.order - b.order)
    : DEFAULT_NAVIGATION.links

  const seen = new Set<string>()
  const links = rawLinks.filter((l) => {
    const key = l.href.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return {
    links: links.length > 0 ? links : DEFAULT_NAVIGATION.links,
    ctaButton: {
      label: (data.ctaButton as { label?: string })?.label || DEFAULT_NAVIGATION.ctaButton.label,
      href: (data.ctaButton as { href?: string })?.href || DEFAULT_NAVIGATION.ctaButton.href,
    },
    signInLabel: typeof data.signInLabel === 'string' ? data.signInLabel : DEFAULT_NAVIGATION.signInLabel,
    whatsappLink: typeof data.whatsappLink === 'string' ? data.whatsappLink : DEFAULT_NAVIGATION.whatsappLink,
  }
}

export function subscribeToNavigation(callback: (config: NavigationConfig) => void): () => void {
  try {
    const docRef = doc(db, 'platformConfig', 'navigation')
    return onSnapshot(
      docRef,
      (snapshot) => {
        callback(mergeNavigation(snapshot.exists() ? snapshot.data() : undefined))
      },
      () => callback(DEFAULT_NAVIGATION)
    )
  } catch {
    callback(DEFAULT_NAVIGATION)
    return () => {}
  }
}

export function subscribeToGlobalSettings(callback: (settings: GlobalSettings) => void): () => void {
  try {
    const docRef = doc(db, 'platformConfig', 'globalSettings')
    return onSnapshot(
      docRef,
      (snapshot) => {
        callback(mergeGlobalSettings(snapshot.exists() ? snapshot.data() : undefined))
      },
      () => callback(DEFAULT_GLOBAL_SETTINGS)
    )
  } catch {
    callback(DEFAULT_GLOBAL_SETTINGS)
    return () => {}
  }
}
