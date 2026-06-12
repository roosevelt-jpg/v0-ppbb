import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { initializeApp, getApps } from 'firebase/app'

export interface AuditLog {
  id?: string
  timestamp: number
  adminId: string
  adminEmail: string
  action: string
  entityType: 'admin' | 'integration' | 'settings' | 'webhook' | 'alert'
  entityId?: string
  entityName?: string
  changes?: Record<string, { before: any; after: any }>
  status: 'success' | 'failed'
  ipAddress?: string
  userAgent?: string
  details?: string
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
})

const db = getFirestore(app)

/**
 * Log an admin action to the audit trail
 */
export async function logAdminAction(log: AuditLog): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'auditLogs'), {
      ...log,
      timestamp: Date.now(),
    })
    return docRef.id
  } catch (error) {
    console.error('[v0] Error logging audit:', error)
    return null
  }
}

/**
 * Get all audit logs for a specific admin
 */
export async function getAdminAuditLogs(adminId: string, limitCount: number = 50) {
  try {
    const q = query(
      collection(db, 'auditLogs'),
      where('adminId', '==', adminId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog & { id: string }))
  } catch (error) {
    console.error('[v0] Error fetching admin audit logs:', error)
    return []
  }
}

/**
 * Get all audit logs (for super admin overview)
 */
export async function getAllAuditLogs(limitCount: number = 100) {
  try {
    const q = query(
      collection(db, 'auditLogs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog & { id: string }))
  } catch (error) {
    console.error('[v0] Error fetching all audit logs:', error)
    return []
  }
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLogs(entityType: string, entityId: string) {
  try {
    const q = query(
      collection(db, 'auditLogs'),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('timestamp', 'desc'),
      limit(50)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog & { id: string }))
  } catch (error) {
    console.error('[v0] Error fetching entity audit logs:', error)
    return []
  }
}

/**
 * Get audit logs for a date range
 */
export async function getAuditLogsByDateRange(startTime: number, endTime: number) {
  try {
    const q = query(
      collection(db, 'auditLogs'),
      where('timestamp', '>=', startTime),
      where('timestamp', '<=', endTime),
      orderBy('timestamp', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog & { id: string }))
  } catch (error) {
    console.error('[v0] Error fetching date range audit logs:', error)
    return []
  }
}
