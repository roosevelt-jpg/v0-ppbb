import { db } from '@/lib/firebase'
import { SiteSettings, Page, AuditLog } from '@/lib/types'
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore'
import { mergeGlobalSettings, DEFAULT_GLOBAL_SETTINGS } from '@/lib/global-settings'

const SITE_SETTINGS_ID = 'default'

/**
 * Reads canonical platformConfig/globalSettings and maps to legacy SiteSettings shape
 * for callers that still expect that type (e.g. metadata).
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const docSnap = await getDoc(doc(db, 'platformConfig', 'globalSettings'))
    const g = mergeGlobalSettings(docSnap.exists() ? docSnap.data() : undefined)
    return {
      id: 'globalSettings',
      siteName: g.platformName,
      siteDescription: g.siteDescription,
      logoUrl: g.logoUrlLight,
      logoUrlDark: g.logoUrlDark,
      faviconUrl: g.faviconUrl,
      primaryColor: '#111111',
      secondaryColor: '#f7f6f2',
      accentColor: '#888888',
      email: g.contactEmail,
      phone: g.phone,
      address: g.address,
      socialLinks: g.socialLinks || {},
      footerText: g.footerText,
      maintenanceMode: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error('[v0] Error fetching site settings:', error)
    return null
  }
}

/** @deprecated Prefer platformConfig/globalSettings via CMS — legacy write path kept for scripts */
export async function updateSiteSettings(updates: Partial<SiteSettings>): Promise<boolean> {
  try {
    const settingsRef = doc(db, 'siteSettings', SITE_SETTINGS_ID)
    const currentSettings = await getDoc(settingsRef)

    if (!currentSettings.exists()) {
      const defaultSettings: SiteSettings = {
        id: SITE_SETTINGS_ID,
        siteName: DEFAULT_GLOBAL_SETTINGS.platformName,
        siteDescription: DEFAULT_GLOBAL_SETTINGS.siteDescription,
        logoUrl: '',
        logoUrlDark: '',
        faviconUrl: '/favicon.ico',
        primaryColor: '#000000',
        secondaryColor: '#FFFFFF',
        accentColor: '#666666',
        email: DEFAULT_GLOBAL_SETTINGS.contactEmail,
        phone: DEFAULT_GLOBAL_SETTINGS.phone,
        address: DEFAULT_GLOBAL_SETTINGS.address,
        socialLinks: {},
        footerText: DEFAULT_GLOBAL_SETTINGS.footerText,
        maintenanceMode: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await setDoc(settingsRef, defaultSettings)
      return true
    }

    await setDoc(settingsRef, { ...updates, updatedAt: new Date() }, { merge: true })
    return true
  } catch (error) {
    console.error('[v0] Error updating site settings:', error)
    return false
  }
}

// CMS Pages
// All page reads/writes go through the Admin SDK API route (/api/pages).
// Client-side Firestore access to the `pages` collection is denied by the
// deployed security rules (admins are authorized server-side, not via client
// Firebase Auth), so direct client reads/writes fail silently.
export async function getPages(): Promise<Page[]> {
  try {
    const res = await fetch('/api/pages', { cache: 'no-store' })
    const json = await res.json()
    return json.success ? (json.data as Page[]) : []
  } catch (error) {
    console.error('[v0] Error fetching pages:', error)
    return []
  }
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const res = await fetch(`/api/pages?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
    const json = await res.json()
    return json.success ? (json.data as Page | null) : null
  } catch (error) {
    console.error('[v0] Error fetching page:', error)
    return null
  }
}

export async function getAllPages(includePublished: boolean = false): Promise<Page[]> {
  try {
    const res = await fetch(`/api/pages${includePublished ? '?all=true' : ''}`, { cache: 'no-store' })
    const json = await res.json()
    return json.success ? (json.data as Page[]) : []
  } catch (error) {
    console.error('[v0] Error fetching all pages:', error)
    return []
  }
}

export async function createPage(pageData: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
  try {
    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', payload: pageData }),
    })
    const json = await res.json()
    return json.success ? (json.id as string) : null
  } catch (error) {
    console.error('[v0] Error creating page:', error)
    return null
  }
}

export async function updatePage(pageId: string, updates: Partial<Page>): Promise<boolean> {
  try {
    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', payload: { id: pageId, ...updates } }),
    })
    const json = await res.json()
    return !!json.success
  } catch (error) {
    console.error('[v0] Error updating page:', error)
    return false
  }
}

export async function deletePage(pageId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', payload: { id: pageId } }),
    })
    const json = await res.json()
    return !!json.success
  } catch (error) {
    console.error('[v0] Error deleting page:', error)
    return false
  }
}

export async function getPagesByMenuLocation(menuLocation: string): Promise<Page[]> {
  try {
    const res = await fetch(`/api/pages?menuLocation=${encodeURIComponent(menuLocation)}`, { cache: 'no-store' })
    const json = await res.json()
    return json.success ? (json.data as Page[]) : []
  } catch (error) {
    console.error('[v0] Error fetching pages by menu location:', error)
    return []
  }
}

// Audit Logging
export async function logAdminAction(
  adminId: string,
  action: string,
  target: string,
  targetId: string,
  changes?: Record<string, any>,
  ipAddress?: string
): Promise<void> {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      adminId,
      action,
      target,
      targetId,
      changes,
      ipAddress,
      timestamp: new Date(),
    } as AuditLog)
  } catch (error) {
    console.error('[v0] Error logging admin action:', error)
  }
}
