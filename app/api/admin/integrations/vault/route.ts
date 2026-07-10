import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, isAdminUser, getAdminUserData } from '@/lib/admin-access-server'
import { canManageIntegrations } from '@/lib/integrations/require-vault-access'
import {
  clearIntegrationsVaultPasscode,
  createIntegrationsUnlockToken,
  getIntegrationsVaultSettings,
  getUnlockTokenFromRequest,
  setIntegrationsVaultPasscode,
  verifyIntegrationsUnlockToken,
  verifyPasscode,
} from '@/lib/integrations/vault-lock'
import { auditAdminApiAction } from '@/lib/audit-api-helper'

async function requireAdmin(request: NextRequest): Promise<{ uid: string } | NextResponse> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const uid = await verifyIdToken(token)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isAdminUser(uid))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!(await canManageIntegrations(uid))) {
    return NextResponse.json(
      { error: 'Forbidden: manage_integrations permission required' },
      { status: 403 }
    )
  }
  return { uid }
}

async function isSuperAdminUid(uid: string): Promise<boolean> {
  const data = await getAdminUserData(uid)
  const role = String(data?.role || data?.adminRole || '')
  return role === 'super_admin'
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const vault = await getIntegrationsVaultSettings()
  const unlockToken = getUnlockTokenFromRequest(request)
  const unlocked =
    !vault.enabled || verifyIntegrationsUnlockToken(unlockToken, auth.uid)
  const superAdmin = await isSuperAdminUid(auth.uid)

  return NextResponse.json({
    enabled: vault.enabled,
    unlocked,
    isSuperAdmin: superAdmin,
    updatedAt: vault.updatedAt || null,
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => ({}))
  const action = String(body.action || '')
  const vault = await getIntegrationsVaultSettings()
  const superAdmin = await isSuperAdminUid(auth.uid)

  if (action === 'unlock') {
    if (!vault.enabled || !vault.passcodeHash) {
      const token = createIntegrationsUnlockToken(auth.uid)
      return NextResponse.json({ success: true, unlockToken: token, enabled: false })
    }
    const passcode = String(body.passcode || '')
    if (!verifyPasscode(passcode, vault.passcodeHash)) {
      return NextResponse.json({ error: 'Incorrect passcode' }, { status: 401 })
    }
    const unlockToken = createIntegrationsUnlockToken(auth.uid)
    return NextResponse.json({ success: true, unlockToken, enabled: true })
  }

  if (action === 'set' || action === 'change') {
    if (!superAdmin) {
      return NextResponse.json(
        { error: 'Only a super admin can set or change the integrations passcode' },
        { status: 403 }
      )
    }
    if (action === 'change' || vault.enabled) {
      const current = String(body.currentPasscode || '')
      if (vault.passcodeHash && !verifyPasscode(current, vault.passcodeHash)) {
        return NextResponse.json({ error: 'Current passcode is incorrect' }, { status: 401 })
      }
    }
    const newPasscode = String(body.newPasscode || body.passcode || '')
    try {
      await setIntegrationsVaultPasscode(newPasscode, auth.uid)
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Failed to set passcode' },
        { status: 400 }
      )
    }
    await auditAdminApiAction(request, auth.uid, {
      actionType: 'update',
      action: 'Set integrations vault passcode',
      entityType: 'integration',
      entityId: 'vault',
      entityName: 'Integrations vault',
      status: 'success',
    })
    const unlockToken = createIntegrationsUnlockToken(auth.uid)
    return NextResponse.json({ success: true, enabled: true, unlockToken })
  }

  if (action === 'clear') {
    if (!superAdmin) {
      return NextResponse.json(
        { error: 'Only a super admin can remove the integrations passcode' },
        { status: 403 }
      )
    }
    if (vault.enabled && vault.passcodeHash) {
      const current = String(body.currentPasscode || '')
      if (!verifyPasscode(current, vault.passcodeHash)) {
        return NextResponse.json({ error: 'Current passcode is incorrect' }, { status: 401 })
      }
    }
    await clearIntegrationsVaultPasscode(auth.uid)
    await auditAdminApiAction(request, auth.uid, {
      actionType: 'update',
      action: 'Cleared integrations vault passcode',
      entityType: 'integration',
      entityId: 'vault',
      entityName: 'Integrations vault',
      status: 'success',
    })
    return NextResponse.json({ success: true, enabled: false })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
