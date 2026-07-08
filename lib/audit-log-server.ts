import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import {
  type AuditLogInput,
  type AdminAuditLogEntry,
  getRequestAuditContext,
} from '@/lib/audit-log-shared'

const COLLECTION = 'auditLogs'

function normalizeEntry(input: AuditLogInput): Record<string, unknown> {
  return sanitizeForFirestore({
    timestamp: input.timestamp ?? Date.now(),
    adminId: input.adminId?.trim() || 'unknown',
    adminEmail: input.adminEmail?.trim() || 'unknown',
    adminName: input.adminName?.trim() || 'Unknown',
    adminRole: input.adminRole?.trim() || 'unknown',
    action: input.action?.trim() || 'Unknown action',
    actionType: input.actionType || 'other',
    entityType: input.entityType || 'other',
    entityId: input.entityId?.trim() || '',
    entityName: input.entityName?.trim() || '',
    route: input.route?.trim() || '',
    status: input.status || 'success',
    ipAddress: input.ipAddress?.trim() || 'unknown',
    userAgent: input.userAgent || '',
    deviceBrowser: input.deviceBrowser || 'Unknown',
    deviceOs: input.deviceOs || 'Unknown',
    deviceType: input.deviceType || 'desktop',
    details: input.details?.trim() || '',
    failureReason: input.failureReason?.trim() || '',
    ...(input.changes && Object.keys(input.changes).length > 0 ? { changes: input.changes } : {}),
  })
}

/** Persist audit log via Admin SDK (server-only). */
export async function writeAuditLogServer(input: AuditLogInput): Promise<string | null> {
  try {
    const db = getAdminDb()
    const ref = await db.collection(COLLECTION).add(normalizeEntry(input))
    return ref.id
  } catch (error) {
    console.error('[v0] writeAuditLogServer error:', error)
    return null
  }
}

/** Convenience for API routes — enriches IP/UA from request headers. */
export async function auditFromApiRequest(
  request: Request,
  input: AuditLogInput
): Promise<string | null> {
  const ctx = getRequestAuditContext(request)
  return writeAuditLogServer({
    ...input,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    deviceBrowser: ctx.deviceBrowser,
    deviceOs: ctx.deviceOs,
    deviceType: ctx.deviceType,
  })
}

export type { AdminAuditLogEntry }
