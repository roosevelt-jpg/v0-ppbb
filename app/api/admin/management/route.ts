import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { getUserDisplayName, getUserProfilePictureURL, getUserInitials } from '@/lib/user-profile'
import { auditFromApiRequest } from '@/lib/audit-log-server'
import { formatAdminRoleLabel } from '@/lib/audit-log-shared'
import { auditAdminApiAction, tryResolveAdminUid } from '@/lib/audit-api-helper'
import {
  dispatchAdminInviteEmail,
  dispatchAdminPasswordResetEmail,
} from '@/lib/gmail-service'
import { getUserProfileData, verifyIdToken } from '@/lib/admin-access-server'
import { getUserRoles } from '@/lib/roles-server'
import crypto from 'crypto'

function getPublicSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://www.passive-blessings.com'
  ).replace(/\/$/, '')
}

function isSixDigitAccessCode(code: string): boolean {
  return /^\d{6}$/.test(String(code || '').trim())
}

async function requireSuperAdmin(request: NextRequest): Promise<
  | { ok: true; uid: string; email: string; name: string; role: string }
  | { ok: false; response: NextResponse }
> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Sign in required' },
        { status: 401 }
      ),
    }
  }

  const uid = await verifyIdToken(token)
  if (!uid) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      ),
    }
  }

  const profile = await getUserProfileData(uid)
  const roles = getUserRoles(profile)
  const role =
    (typeof profile?.role === 'string' && profile.role) ||
    roles.find((r) => r === 'super_admin') ||
    roles[0] ||
    ''
  // Accept role on `role` or inside `roles[]` (invite redeem writes both)
  if (!roles.includes('super_admin')) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Only super admins can manage admin invitations' },
        { status: 403 }
      ),
    }
  }

  return {
    ok: true,
    uid,
    email: String(profile?.email || 'unknown'),
    name: getUserDisplayName(profile as Parameters<typeof getUserDisplayName>[0]),
    role: String(role),
  }
}

function formatInviteRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    founder_admin: 'Founder Admin',
    manager: 'Manager',
    welfare: 'Welfare',
    founder: 'Founder',
    coordinator: 'Coordinator',
    moderator: 'Moderator',
  }
  return labels[role] || role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

async function loadInviterProfile(userId: string) {
  if (!userId?.trim()) return null
  const userSnap = await getAdminDb().collection('users').doc(userId.trim()).get()
  if (!userSnap.exists) return null
  const data = userSnap.data() as Record<string, unknown>
  const role = typeof data.role === 'string' ? data.role : 'admin'
  return {
    name: getUserDisplayName(data as Parameters<typeof getUserDisplayName>[0]),
    roleLabel: formatInviteRoleLabel(role),
    profilePictureURL: getUserProfilePictureURL(data as Parameters<typeof getUserProfilePictureURL>[0]),
    initials: getUserInitials(data as Parameters<typeof getUserInitials>[0]),
  }
}

// Generate a unique 6-digit numeric access code
async function generateUniqueAccessCode(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
    const existing = await getAdminDb()
      .collection('adminAccessCodes')
      .where('code', '==', code)
      .limit(1)
      .get()
    if (existing.empty) return code
  }
  // Extremely unlikely fallback
  return String(Date.now()).slice(-6)
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('query')

    if (query === 'admins') {
      const adminRoles = new Set([
        'admin',
        'super_admin',
        'welfare',
        'founder',
        'coordinator',
        'founder_admin',
        'manager',
        'moderator',
      ])
      const [adminUsersSnap, usersSnap] = await Promise.all([
        getAdminDb().collection('admin-users').get(),
        getAdminDb().collection('users').get(),
      ])

      const byId = new Map<string, Record<string, unknown>>()

      for (const docSnap of adminUsersSnap.docs) {
        const data = docSnap.data() as Record<string, unknown>
        byId.set(docSnap.id, {
          id: docSnap.id,
          ...data,
          createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.() || data.createdAt,
          lastLogin: (data.lastLogin as { toDate?: () => Date })?.toDate?.() || data.lastLogin,
        })
      }

      for (const docSnap of usersSnap.docs) {
        const u = docSnap.data() as Record<string, unknown>
        const role = typeof u.role === 'string' ? u.role : ''
        const roles = Array.isArray(u.roles) ? (u.roles as string[]) : []
        const isAdmin =
          adminRoles.has(role) || roles.some((r) => adminRoles.has(String(r)))
        if (!isAdmin) continue

        const existing = byId.get(docSnap.id) || { id: docSnap.id }
        byId.set(docSnap.id, {
          ...existing,
          email: existing.email || u.email,
          name:
            existing.name ||
            getUserDisplayName(u as Parameters<typeof getUserDisplayName>[0]),
          role: existing.role || role,
          permissions: existing.permissions || u.permissions || [],
          profilePictureURL:
            (typeof existing.profilePictureURL === 'string' && existing.profilePictureURL) ||
            getUserProfilePictureURL(u as Parameters<typeof getUserProfilePictureURL>[0]) ||
            '',
          phone:
            (typeof existing.phone === 'string' && existing.phone) ||
            (typeof u.phone === 'string' && u.phone) ||
            (typeof u.whatsappNumber === 'string' && u.whatsappNumber) ||
            '',
          createdAt:
            existing.createdAt ||
            (u.createdAt as { toDate?: () => Date })?.toDate?.() ||
            u.createdAt,
          status: existing.status || u.status || 'active',
        })
      }

      const admins = Array.from(byId.values()).sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt as string | Date).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt as string | Date).getTime() : 0
        return bTime - aTime
      })

      return NextResponse.json({ success: true, data: admins })
    }

    if (query === 'access-codes') {
      const snapshot = await getAdminDb().collection('adminAccessCodes').get()
      const codes = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data()
          const isUsed = data.isUsed === true || data.used === true || data.status === 'used'
          return {
            id: docSnap.id,
            ...data,
            used: isUsed,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            expiresAt: data.expiresAt?.toDate?.() || data.expiresAt,
          }
        })
        .sort((a, b) => {
          const aTime = new Date(a.createdAt).getTime()
          const bTime = new Date(b.createdAt).getTime()
          return bTime - aTime
        })
      return NextResponse.json({ success: true, data: codes })
    }

    return NextResponse.json({ success: false, error: 'Invalid query' }, { status: 400 })
  } catch (error) {
    console.error('[v0] Admin management fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch admin data' }, { status: 500 })
  }
}

// Generate new access code for admin invitation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    console.log('[v0] Admin management POST received:', {
      action,
      hasData: !!data,
      dataKeys: Object.keys(data),
    })

    if (action === 'generate-access-code') {
      const authz = await requireSuperAdmin(request)
      if (!authz.ok) return authz.response

      const { adminName, adminEmail, role, permissions, sendEmail, expiresAt: expiresAtStr } = data
      
      console.log('[v0] Processing generate-access-code with:', {
        adminName,
        adminEmail,
        role,
        permissions,
        sendEmail,
        hasExpiresAt: !!expiresAtStr,
        invitedBy: authz.uid,
      })

      if (!adminEmail || !adminName || !role) {
        return NextResponse.json({ 
          success: false, 
          error: 'Missing required fields: adminName, adminEmail, role' 
        }, { status: 400 })
      }

      const normalizedEmail = String(adminEmail).trim().toLowerCase()
      if (!normalizedEmail.includes('@')) {
        return NextResponse.json(
          { success: false, error: 'A valid email address is required' },
          { status: 400 }
        )
      }

      const code = await generateUniqueAccessCode()
      const expiresAt = expiresAtStr ? new Date(expiresAtStr) : new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours default

      const accessCodeData = {
        code,
        adminName: String(adminName).trim(),
        adminEmail: normalizedEmail,
        adminRole: role,
        role,
        permissions: Array.isArray(permissions) && permissions.length > 0 ? permissions : ['full_access'],
        isUsed: false,
        used: false,
        status: 'active',
        usedBy: null,
        usedAt: null,
        createdAt: new Date(),
        expiresAt,
        sendEmail: !!sendEmail,
        createdBy: authz.uid,
      }

      console.log('[v0] Saving access code to Firestore:', {
        code,
        permissions: accessCodeData.permissions,
        expiresAt,
        collectionName: 'adminAccessCodes',
      })

      let docRef
      try {
        docRef = await getAdminDb().collection('adminAccessCodes').add(accessCodeData)
        console.log('[v0] Access code saved successfully:', {
          docId: docRef.id,
          code,
          permissions: accessCodeData.permissions,
        })
      } catch (dbError) {
        console.error('[v0] Firestore write error:', {
          error: dbError instanceof Error ? dbError.message : String(dbError),
          collection: 'adminAccessCodes',
          dataSize: JSON.stringify(accessCodeData).length,
        })
        throw dbError
      }

      // Send branded invite email via Gmail SMTP (Integrations vault)
      let emailSent = false
      let emailError: string | null = null
      if (sendEmail) {
        console.log('[v0] Sending invite email in-process to:', normalizedEmail)
        try {
          const invitedBy = await loadInviterProfile(authz.uid)
          await dispatchAdminInviteEmail({
            accessCode: code,
            adminEmail: normalizedEmail,
            adminName: accessCodeData.adminName,
            role,
            expiresAt,
            permissions: accessCodeData.permissions,
            invitedBy: invitedBy || {
              name: authz.name,
              roleLabel: formatInviteRoleLabel(authz.role),
              profilePictureURL: null,
              initials: authz.name
                .split(/\s+/)
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'SA',
            },
          })
          emailSent = true
          console.log('[v0] Invite email sent successfully to:', normalizedEmail)
        } catch (emailErr) {
          emailError =
            emailErr instanceof Error ? emailErr.message : 'Failed to send invitation email'
          console.error('[v0] Failed to send invite email:', {
            error: emailError,
            email: normalizedEmail,
          })
        }
      }

      await auditFromApiRequest(request, {
        adminId: authz.uid,
        adminEmail: authz.email,
        adminName: authz.name,
        adminRole: formatAdminRoleLabel(authz.role),
        actionType: 'create',
        action: `Generated admin invitation for ${normalizedEmail}`,
        entityType: 'admin',
        entityName: accessCodeData.adminName,
        status: 'success',
        details: `Role: ${role}; Code: ${code}; Email sent: ${emailSent}${emailError ? `; Error: ${emailError}` : ''}`,
      })

      return NextResponse.json({
        success: true,
        emailSent,
        emailError,
        data: {
          id: docRef.id,
          accessCode: code,
          ...accessCodeData,
        },
        message: emailSent
          ? `Access code generated and invitation emailed to ${normalizedEmail}`
          : sendEmail
            ? `Access code generated, but email failed: ${emailError || 'unknown error'}`
            : 'Access code generated',
      })
    }

    if (action === 'resend-invite') {
      const authz = await requireSuperAdmin(request)
      if (!authz.ok) return authz.response

      const { codeId, extendExpiry } = data
      if (!codeId) {
        return NextResponse.json(
          { success: false, error: 'codeId is required' },
          { status: 400 }
        )
      }

      const codeRef = getAdminDb().collection('adminAccessCodes').doc(String(codeId))
      const codeSnap = await codeRef.get()
      if (!codeSnap.exists) {
        return NextResponse.json(
          { success: false, error: 'Access code not found' },
          { status: 404 }
        )
      }

      const codeData = codeSnap.data() || {}
      let accessCode = String(codeData.code || '').trim().toUpperCase()
      const adminEmail = String(codeData.adminEmail || codeData.email || '')
        .trim()
        .toLowerCase()
      const adminName = String(codeData.adminName || adminEmail.split('@')[0] || 'Admin')
      const role = String(codeData.adminRole || codeData.role || 'admin')
      const permissions = Array.isArray(codeData.permissions)
        ? codeData.permissions
        : ['full_access']

      if (!accessCode || !adminEmail) {
        return NextResponse.json(
          { success: false, error: 'Invite is missing email or access code' },
          { status: 400 }
        )
      }

      // Migrate legacy hex invites (e.g. 12-char) to the current 6-digit format
      let codeMigrated = false
      if (!isSixDigitAccessCode(accessCode)) {
        accessCode = await generateUniqueAccessCode()
        codeMigrated = true
      }

      let expiresAt =
        codeData.expiresAt?.toDate?.() ||
        (codeData.expiresAt ? new Date(codeData.expiresAt) : null)

      // Extend unused (or recovery) invites so the resent link stays valid
      const patch: Record<string, unknown> = {
        code: accessCode,
        lastResentAt: new Date(),
        updatedAt: new Date(),
      }
      if (extendExpiry !== false) {
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
        patch.expiresAt = expiresAt
      }
      await codeRef.update(patch)

      let emailSent = false
      let emailError: string | null = null
      try {
        const invitedBy = await loadInviterProfile(authz.uid)
        await dispatchAdminInviteEmail({
          accessCode,
          adminEmail,
          adminName,
          role,
          expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
          permissions,
          invitedBy: invitedBy || {
            name: authz.name,
            roleLabel: formatInviteRoleLabel(authz.role),
            profilePictureURL: null,
            initials: authz.name
              .split(/\s+/)
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'SA',
          },
        })
        emailSent = true
      } catch (emailErr) {
        emailError =
          emailErr instanceof Error ? emailErr.message : 'Failed to send invitation email'
      }

      await auditFromApiRequest(request, {
        adminId: authz.uid,
        adminEmail: authz.email,
        adminName: authz.name,
        adminRole: formatAdminRoleLabel(authz.role),
        actionType: 'update',
        action: `Resent admin invitation to ${adminEmail}`,
        entityType: 'admin',
        entityId: String(codeId),
        entityName: adminName,
        status: emailSent ? 'success' : 'failed',
        details: `Role: ${role}; Code: ${accessCode}; Migrated: ${codeMigrated}; Email sent: ${emailSent}${emailError ? `; Error: ${emailError}` : ''}`,
      })

      return NextResponse.json({
        success: emailSent,
        emailSent,
        emailError,
        data: {
          id: codeId,
          code: accessCode,
          adminEmail,
          adminName,
          expiresAt,
          codeMigrated,
        },
        message: emailSent
          ? `Invitation resent to ${adminEmail}`
          : `Failed to resend invite: ${emailError || 'unknown error'}`,
        error: emailSent ? undefined : emailError || 'Failed to resend invite',
      })
    }

    if (action === 'send-password-reset') {
      const authz = await requireSuperAdmin(request)
      if (!authz.ok) return authz.response

      const email = String(data.email || '')
        .trim()
        .toLowerCase()
      if (!email || !email.includes('@')) {
        return NextResponse.json(
          { success: false, error: 'A valid email address is required' },
          { status: 400 }
        )
      }

      const adminName =
        typeof data.adminName === 'string' && data.adminName.trim()
          ? data.adminName.trim()
          : email.split('@')[0] || 'Admin'

      try {
        const { getAuth } = await import('firebase-admin/auth')
        const { getAdminApp } = await import('@/lib/firebase-admin')
        const auth = getAuth(getAdminApp())

        // Create Auth account if invitee has not finished setup yet, so reset still works
        let authUserCreated = false
        try {
          await auth.getUserByEmail(email)
        } catch {
          await auth.createUser({
            email,
            emailVerified: false,
            password: crypto.randomBytes(32).toString('base64url'),
            displayName: adminName,
            disabled: false,
          })
          authUserCreated = true
        }

        const resetLink = await auth.generatePasswordResetLink(email, {
          url: `${getPublicSiteUrl()}/admin/login`,
          handleCodeInApp: false,
        })

        await dispatchAdminPasswordResetEmail({
          to: email,
          adminName,
          resetLink,
          requestedBy: {
            name: authz.name,
            roleLabel: formatInviteRoleLabel(authz.role),
            profilePictureURL: (await loadInviterProfile(authz.uid))?.profilePictureURL || null,
            initials: authz.name
              .split(/\s+/)
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'SA',
          },
        })

        await auditFromApiRequest(request, {
          adminId: authz.uid,
          adminEmail: authz.email,
          adminName: authz.name,
          adminRole: formatAdminRoleLabel(authz.role),
          actionType: 'update',
          action: `Sent password reset email to ${email}`,
          entityType: 'admin',
          entityId: email,
          entityName: adminName,
          status: 'success',
          details: `Password reset link emailed via Admin Management${authUserCreated ? '; Auth account created' : ''}`,
        })

        return NextResponse.json({
          success: true,
          emailSent: true,
          authUserCreated,
          message: `Password reset email sent to ${email}`,
        })
      } catch (resetErr) {
        const message =
          resetErr instanceof Error ? resetErr.message : 'Failed to send password reset email'
        console.error('[v0] Admin password reset error:', resetErr)
        return NextResponse.json(
          { success: false, error: message, emailError: message },
          { status: 500 }
        )
      }
    }

    if (action === 'create-admin') {
      // Called after user signs up with access code
      const { email, name, role, accessCodeId } = data

      if (!email || !role || !accessCodeId) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
      }

      const codeRef = getAdminDb().collection('adminAccessCodes').doc(accessCodeId)
      const codeSnap = await codeRef.get()
      const codeData = codeSnap.exists ? codeSnap.data() : null
      const invitePermissions = Array.isArray(codeData?.permissions)
        ? codeData.permissions
        : getRolePermissions(role)

      await codeRef.update({
        isUsed: true,
        used: true,
        status: 'used',
        usedBy: email,
        usedAt: new Date(),
      })

      // Create admin user
      const adminData = {
        email,
        name,
        role, // 'super_admin' | 'admin' | 'moderator'
        permissions: invitePermissions,
        avatarUrl: '', // User uploads this after signup
        bio: '',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
      }

      const docRef = await getAdminDb().collection('admin-users').add(adminData)

      await auditFromApiRequest(request, {
        adminId: email,
        adminEmail: email,
        adminName: name || email,
        adminRole: formatAdminRoleLabel(role),
        actionType: 'create',
        action: `Admin account created via access code: ${email}`,
        entityType: 'admin',
        entityId: docRef.id,
        entityName: name || email,
        status: 'success',
        details: `Role: ${role}`,
      })

      return NextResponse.json({
        success: true,
        data: { id: docRef.id, ...adminData },
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'
    
    console.error('[v0] Admin management error:', {
      message: errorMessage,
      stack: errorStack,
      type: error?.constructor?.name,
    })
    
    return NextResponse.json({
      success: false,
      error: errorMessage || 'Operation failed'
    }, { status: 500 })
  }
}

// Update admin user
export async function PUT(request: NextRequest) {
  try {
    const adminUid = await tryResolveAdminUid(request)
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing admin ID' }, { status: 400 })
    }

    updateData.updatedAt = new Date()

    // If role changed, update permissions
    if (updateData.role) {
      updateData.permissions = getRolePermissions(updateData.role)
    }

    await getAdminDb().collection('admin-users').doc(id).update(updateData)

    if (adminUid) {
      await auditAdminApiAction(request, adminUid, {
        actionType: 'update',
        action: `Updated admin user: ${updateData.email || updateData.name || id}`,
        entityType: 'admin',
        entityId: id,
        entityName: String(updateData.name || updateData.email || id),
        status: 'success',
        details: updateData.role ? `Role: ${updateData.role}` : '',
      })
    }

    return NextResponse.json({ success: true, message: 'Admin user updated' })
  } catch (error) {
    console.error('[v0] Admin update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update admin' }, { status: 500 })
  }
}

// Delete admin user
export async function DELETE(request: NextRequest) {
  try {
    const adminUid = await tryResolveAdminUid(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing admin ID' }, { status: 400 })
    }

    const snap = await getAdminDb().collection('admin-users').doc(id).get()
    const data = snap.data() as Record<string, unknown> | undefined
    const label = String(data?.name || data?.email || id)

    await getAdminDb().collection('admin-users').doc(id).delete()

    if (adminUid) {
      await auditAdminApiAction(request, adminUid, {
        actionType: 'delete',
        action: `Deleted admin user: ${label}`,
        entityType: 'admin',
        entityId: id,
        entityName: label,
        status: 'success',
      })
    }

    return NextResponse.json({ success: true, message: 'Admin user deleted' })
  } catch (error) {
    console.error('[v0] Admin delete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete admin' }, { status: 500 })
  }
}

// Helper function to map roles to permissions
function getRolePermissions(role: string): string[] {
  const permissionMap: Record<string, string[]> = {
    super_admin: [
      'manage_admins',
      'manage_events',
      'manage_workshops',
      'manage_recordings',
      'manage_team',
      'manage_community',
      'manage_members',
      'manage_settings',
      'view_analytics',
      'manage_security',
    ],
    founder_admin: [
      'manage_admins',
      'manage_events',
      'manage_workshops',
      'manage_recordings',
      'manage_team',
      'manage_community',
      'manage_members',
      'manage_settings',
      'view_analytics',
      'manage_security',
      'manage_beneficiary',
    ],
    manager: [
      'manage_events',
      'manage_workshops',
      'manage_recordings',
      'manage_team',
      'manage_community',
      'manage_members',
      'view_analytics',
      'manage_beneficiary',
    ],
    welfare: ['manage_beneficiary'],
    founder: ['manage_beneficiary'],
    coordinator: ['manage_beneficiary'],
    admin: [
      'manage_events',
      'manage_workshops',
      'manage_recordings',
      'manage_team',
      'manage_community',
      'manage_members',
      'view_analytics',
    ],
    moderator: [
      'manage_events',
      'manage_community',
      'manage_members',
    ],
  }

  return permissionMap[role] || []
}
