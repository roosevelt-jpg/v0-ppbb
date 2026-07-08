'use client'

import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

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

export interface GlobalSettings {
  whatsappLink: string
  platformName: string
  contactEmail: string
  address: string
  phone: string
}

export const DEFAULT_NAVIGATION: NavigationConfig = {
  links: [
    { label: 'About us', href: '/about', order: 0, isVisible: true },
    { label: 'Impact', href: '/transparency', order: 1, isVisible: true },
    { label: 'Events', href: '/events', order: 2, isVisible: true },
    { label: 'Marketplace', href: '/marketplace', order: 3, isVisible: true },
    { label: 'Opportunities', href: '/opportunities', order: 4, isVisible: true },
    { label: 'Partners', href: '/partners', order: 5, isVisible: true },
  ],
  ctaButton: { label: 'Join now', href: '/join' },
  signInLabel: 'Sign in',
  whatsappLink: '',
}

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  whatsappLink: '',
  platformName: 'Passive Blessings',
  contactEmail: 'contact@passiveblessings.org',
  address: 'Dubai, UAE',
  phone: '+971 50 000 0000',
}

function normalizeNavLink(link: NavLink, index: number): NavLink {
  let href = link.href
  let label = link.label
  // Part 6A: Contact → Partners (legacy Firestore nav entries)
  if (href === '/contact' || label.trim().toLowerCase() === 'contact') {
    href = '/partners'
    label = 'Partners'
  }
  return {
    label,
    href,
    order: typeof link.order === 'number' ? link.order : index,
    isVisible: link.isVisible !== false,
  }
}

function mergeNavigation(data: Record<string, unknown> | undefined): NavigationConfig {
  if (!data) return DEFAULT_NAVIGATION
  const rawLinks = Array.isArray(data.links)
    ? (data.links as NavLink[])
        .filter((l) => l && typeof l.label === 'string' && typeof l.href === 'string')
        .map((l, i) => normalizeNavLink(l, i))
        .sort((a, b) => a.order - b.order)
    : DEFAULT_NAVIGATION.links

  // Dedupe Partners if both Contact+Partners existed in legacy config
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

function mergeGlobalSettings(data: Record<string, unknown> | undefined): GlobalSettings {
  if (!data) return DEFAULT_GLOBAL_SETTINGS
  return {
    whatsappLink: typeof data.whatsappLink === 'string' ? data.whatsappLink : DEFAULT_GLOBAL_SETTINGS.whatsappLink,
    platformName: typeof data.platformName === 'string' ? data.platformName : DEFAULT_GLOBAL_SETTINGS.platformName,
    contactEmail: typeof data.contactEmail === 'string' ? data.contactEmail : DEFAULT_GLOBAL_SETTINGS.contactEmail,
    address: typeof data.address === 'string' ? data.address : DEFAULT_GLOBAL_SETTINGS.address,
    phone: typeof data.phone === 'string' ? data.phone : DEFAULT_GLOBAL_SETTINGS.phone,
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
