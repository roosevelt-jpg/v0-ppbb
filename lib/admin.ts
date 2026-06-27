import { db } from '@/lib/firebase'
import { SiteSettings, Page, AuditLog } from '@/lib/types'
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore'

const SITE_SETTINGS_ID = 'default'

// Site Settings
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    // Read from settings/global (same as admin API)
    const docSnap = await getDoc(doc(db, 'settings', 'global'))
    return docSnap.exists() ? (docSnap.data() as SiteSettings) : null
  } catch (error) {
    console.error('[v0] Error fetching site settings:', error)
    return null
  }
}

export async function updateSiteSettings(updates: Partial<SiteSettings>): Promise<boolean> {
  try {
    const settingsRef = doc(db, 'siteSettings', SITE_SETTINGS_ID)
    const currentSettings = await getDoc(settingsRef)

    if (!currentSettings.exists()) {
      // Create default settings if they don't exist
      const defaultSettings: SiteSettings = {
        id: SITE_SETTINGS_ID,
        siteName: 'Passive Blessings',
        siteDescription: 'Community platform for events, volunteering, and community support',
        logoUrl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PB%20ORIGINAL%20LOGO%20%5Bwhite%5D-yu7P76Kj7QQ6XvNGPww4648xqCmM4s.png',
        logoUrlDark: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PB%20ORIGINAL%20LOGO%20%5Bblack%5D-9KcTa1PocHznEBM4QR6dN4R2eseFlT.png',
        faviconUrl: '/favicon.ico',
        primaryColor: '#000000',
        secondaryColor: '#FFFFFF',
        accentColor: '#666666',
        email: 'support@passiveblessings.ae',
        phone: '+971 50 000 0000',
        address: 'Dubai, UAE',
        socialLinks: {},
        footerText: 'Passive Blessings © 2025. All rights reserved.',
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
