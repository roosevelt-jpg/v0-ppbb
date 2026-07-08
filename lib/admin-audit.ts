'use client'

import { db } from '@/lib/firebase'
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore'
import type { User } from '@/lib/types'
import { getUserDisplayName } from '@/lib/user-profile'
import {
  type AdminAuditLogEntry,
  type AuditLogInput,
  formatAdminRoleLabel,
} from '@/lib/audit-log-shared'

export type AuditLog = AdminAuditLogEntry & { id: string }

/** Non-blocking client → server audit write (IP captured server-side). */
export async function recordAdminAudit(input: AuditLogInput): Promise<void> {
  try {
    await fetch('/api/admin/audit-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      keepalive: true,
    })
  } catch (error) {
    console.warn('[v0] recordAdminAudit failed (non-blocking):', error)
  }
}

export function recordAdminAuditFromUser(
  user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role'> & { name?: string },
  input: Omit<
    AuditLogInput,
    'adminId' | 'adminEmail' | 'adminName' | 'adminRole'
  >
): void {
  void recordAdminAudit({
    adminId: user.id || 'unknown',
    adminEmail: user.email || 'unknown',
    adminName: getUserDisplayName(user),
    adminRole: formatAdminRoleLabel(user.role || 'admin'),
    ...input,
  })
}

/** Live subscription — most recent first */
export function subscribeToAllAuditLogs(
  onUpdate: (logs: AuditLog[]) => void,
  maxEntries = 500
): () => void {
  try {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(maxEntries))
    return onSnapshot(
      q,
      (snapshot) => {
        const logs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<AdminAuditLogEntry, 'id'>),
        })) as AuditLog[]
        onUpdate(logs)
      },
      (error) => {
        console.error('[v0] subscribeToAllAuditLogs error:', error)
        onUpdate([])
      }
    )
  } catch (error) {
    console.error('[v0] subscribeToAllAuditLogs setup error:', error)
    return () => {}
  }
}

/** @deprecated Use recordAdminAudit — client Firestore writes are disabled by rules */
export async function logAdminAction(_log: AuditLogInput): Promise<string | null> {
  await recordAdminAudit(_log)
  return null
}

/** @deprecated Use subscribeToAllAuditLogs */
export async function getAllAuditLogs(limitCount = 100): Promise<AuditLog[]> {
  return new Promise((resolve) => {
    const unsub = subscribeToAllAuditLogs((logs) => {
      unsub()
      resolve(logs.slice(0, limitCount))
    })
    setTimeout(() => {
      unsub()
      resolve([])
    }, 5000)
  })
}

export async function getAdminAuditLogs(adminId: string, limitCount = 50): Promise<AuditLog[]> {
  const all = await getAllAuditLogs(500)
  return all.filter((l) => l.adminId === adminId).slice(0, limitCount)
}

export async function getEntityAuditLogs(entityType: string, entityId: string): Promise<AuditLog[]> {
  const all = await getAllAuditLogs(500)
  return all.filter((l) => l.entityType === entityType && l.entityId === entityId).slice(0, 50)
}

export async function getAuditLogsByDateRange(startTime: number, endTime: number): Promise<AuditLog[]> {
  const all = await getAllAuditLogs(500)
  return all.filter((l) => l.timestamp >= startTime && l.timestamp <= endTime)
}
