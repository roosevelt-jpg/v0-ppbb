import { NextRequest, NextResponse } from 'next/server'
import {
  verifyIdToken,
  isAdminUser,
  hasInvitePermissionServer,
} from '@/lib/admin-access-server'
import {
  getIntegrationsVaultSettings,
  getUnlockTokenFromRequest,
  verifyIntegrationsUnlockToken,
} from '@/lib/integrations/vault-lock'

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
    const allowed = await hasInvitePermissionServer(uid, 'manage_integrations')
    if (!allowed) {
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
