import { NextRequest, NextResponse } from 'next/server'
import {
  verifyIdToken,
  isAdminUser,
  hasInvitePermissionServer,
  getAdminUserData,
} from '@/lib/admin-access-server'
import {
  getIntegrationsVaultSettings,
  getUnlockTokenFromRequest,
  verifyIntegrationsUnlockToken,
} from '@/lib/integrations/vault-lock'
import { getEffectiveInvitePermissions } from '@/lib/admin-invite-permissions'

/**
 * Integrations access follows invite permissions only.
 * `full_access` / `manage_integrations` / `super_admin` → allowed.
 * Role names like manager/admin alone do NOT bypass a limited invite.
 */
export async function canManageIntegrations(uid: string): Promise<boolean> {
  if (await hasInvitePermissionServer(uid, 'manage_integrations')) {
    return true
  }

  // Legacy profiles with no permissions array: only super_admin keeps vault access
  const data = await getAdminUserData(uid)
  const role = String(data?.role || data?.adminRole || '')
  const perms = Array.isArray(data?.permissions) ? (data.permissions as string[]) : []
  if (role === 'super_admin') return true
  const effective = getEffectiveInvitePermissions(perms, role)
  return effective.includes('full_access') || effective.includes('manage_integrations')
}

/**
 * Require admin + manage_integrations, and vault unlock when passcode is enabled.
 */
export async function requireIntegrationsAccess(
  request: NextRequest
): Promise<{ uid: string } | NextResponse> {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await isAdminUser(uid))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!(await canManageIntegrations(uid))) {
      return NextResponse.json(
        { error: 'Forbidden: manage_integrations permission required' },
        { status: 403 }
      )
    }

    const vault = await getIntegrationsVaultSettings()
    if (vault.enabled) {
      const unlock = getUnlockTokenFromRequest(request)
      if (!verifyIntegrationsUnlockToken(unlock, uid)) {
        return NextResponse.json(
          {
            error: 'Integrations vault is locked. Enter the passcode to continue.',
            code: 'INTEGRATIONS_VAULT_LOCKED',
          },
          { status: 423 }
        )
      }
    }

    return { uid }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[integrations] access check failed:', message)
    return NextResponse.json(
      { error: message || 'Integrations access check failed' },
      { status: 500 }
    )
  }
}
