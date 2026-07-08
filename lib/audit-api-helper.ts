import { getAdminUserData, verifyIdToken, isAdminUser } from '@/lib/admin-access-server'
import { auditFromApiRequest } from '@/lib/audit-log-server'
import { formatAdminRoleLabel, type AuditActionType, type AuditLogInput } from '@/lib/audit-log-shared'
import { getUserDisplayName } from '@/lib/user-profile'

/** Resolve admin UID from Bearer token; returns null if missing/invalid. */
export async function tryResolveAdminUid(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const uid = await verifyIdToken(token)
  if (!uid) return null
  const ok = await isAdminUser(uid)
  return ok ? uid : null
}

type AuditPayload = Omit<
  AuditLogInput,
  'adminId' | 'adminEmail' | 'adminName' | 'adminRole' | 'ipAddress' | 'userAgent' | 'deviceBrowser' | 'deviceOs' | 'deviceType'
>

/** Attach authenticated admin identity and write audit log from an API route. */
export async function auditAdminApiAction(
  request: Request,
  adminUid: string,
  payload: AuditPayload
): Promise<void> {
  try {
    const adminData = (await getAdminUserData(adminUid)) as Record<string, unknown> | null
    await auditFromApiRequest(request, {
      adminId: adminUid,
      adminEmail: String(adminData?.email || 'unknown'),
      adminName: getUserDisplayName(adminData as Parameters<typeof getUserDisplayName>[0]),
      adminRole: formatAdminRoleLabel(String(adminData?.role || adminData?.adminRole || 'admin')),
      ...payload,
    })
  } catch (error) {
    console.warn('[v0] auditAdminApiAction failed (non-blocking):', error)
  }
}
