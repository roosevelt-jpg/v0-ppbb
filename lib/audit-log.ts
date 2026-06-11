import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore'

export interface AuditLog {
  id?: string
  action: 'create' | 'update' | 'delete' | 'test' | 'view'
  serviceName: string
  adminId: string
  adminEmail: string
  timestamp: Date
  status: 'success' | 'failure'
  errorMessage?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

const AUDIT_LOGS_COLLECTION = 'integrationAuditLogs'

export async function logAuditAction(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, AUDIT_LOGS_COLLECTION), {
      ...log,
      timestamp: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error('[v0] Error logging audit action:', error)
    return null
  }
}

export async function getAuditLogs(
  serviceName?: string,
  adminId?: string,
  limit: number = 100
): Promise<AuditLog[]> {
  try {
    let q = collection(db, AUDIT_LOGS_COLLECTION)
    const constraints = []

    if (serviceName) {
      constraints.push(where('serviceName', '==', serviceName))
    }
    if (adminId) {
      constraints.push(where('adminId', '==', adminId))
    }

    const queryRef = constraints.length > 0 ? query(q, ...constraints) : q
    const snapshot = await getDocs(queryRef)

    return snapshot.docs
      .map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as AuditLog
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  } catch (error) {
    console.error('[v0] Error fetching audit logs:', error)
    return []
  }
}

export async function getServiceAuditTrail(
  serviceName: string,
  limit: number = 50
): Promise<AuditLog[]> {
  return getAuditLogs(serviceName, undefined, limit)
}

export async function getAdminAuditTrail(
  adminId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  return getAuditLogs(undefined, adminId, limit)
}
