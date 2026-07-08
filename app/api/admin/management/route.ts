import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { getUserDisplayName, getUserProfilePictureURL, getUserInitials } from '@/lib/user-profile'
import { auditFromApiRequest } from '@/lib/audit-log-server'
import { formatAdminRoleLabel } from '@/lib/audit-log-shared'
import { auditAdminApiAction, tryResolveAdminUid } from '@/lib/audit-api-helper'
import crypto from 'crypto'

const db = getAdminDb()

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
  const userSnap = await db.collection('users').doc(userId.trim()).get()
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

// Generate a random access code
function generateAccessCode(): string {
  return crypto.randomBytes(6).toString('hex').toUpperCase()
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('query')

    if (query === 'admins') {
      const snapshot = await db.collection('admin-users').orderBy('createdAt', 'desc').get()
      const admins = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data()
          let profilePictureURL = ''
          let phone = typeof data.phone === 'string' ? data.phone : ''
          if (typeof data.profilePictureURL === 'string') {
            profilePictureURL = data.profilePictureURL
          }
          const userSnap = await db.collection('users').doc(docSnap.id).get()
          if (userSnap.exists) {
            const u = userSnap.data() as Record<string, unknown>
            profilePictureURL =
              (typeof u.profilePictureURL === 'string' && u.profilePictureURL) ||
              profilePictureURL ||
              (typeof u.avatarUrl === 'string' && u.avatarUrl) ||
              ''
            phone =
              (typeof u.phone === 'string' && u.phone) ||
              phone ||
              (typeof u.whatsappNumber === 'string' && u.whatsappNumber) ||
              ''
          }
          return {
            id: docSnap.id,
            ...data,
            profilePictureURL,
            phone,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            lastLogin: data.lastLogin?.toDate?.() || data.lastLogin,
          }
        })
      )
      return NextResponse.json({ success: true, data: admins })
    }

    if (query === 'access-codes') {
      const snapshot = await db.collection('adminAccessCodes').get()
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
      const { adminName, adminEmail, role, permissions, sendEmail, expiresAt: expiresAtStr, invitedByUserId } = data
      
      console.log('[v0] Processing generate-access-code with:', {
        adminName,
        adminEmail,
        role,
        permissions,
        sendEmail,
        hasExpiresAt: !!expiresAtStr,
      })

      if (!adminEmail || !adminName || !role) {
        return NextResponse.json({ 
          success: false, 
          error: 'Missing required fields: adminName, adminEmail, role' 
        }, { status: 400 })
      }

      const code = generateAccessCode()
      const expiresAt = expiresAtStr ? new Date(expiresAtStr) : new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours default

      const accessCodeData = {
        code,
        adminName,
        adminEmail,
        adminRole: role,
        role,
        permissions: permissions || ['full_access'],
        isUsed: false,
        used: false,
        status: 'active',
        usedBy: null,
        usedAt: null,
        createdAt: new Date(),
        expiresAt,
        sendEmail: !!sendEmail,
        createdBy: invitedByUserId || 'management-api',
      }

      console.log('[v0] Saving access code to Firestore:', {
        code,
        permissions: accessCodeData.permissions,
        expiresAt,
        collectionName: 'adminAccessCodes',
      })

      let docRef
      try {
        docRef = await db.collection('adminAccessCodes').add(accessCodeData)
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

      // If sendEmail is true, trigger the email sending
      if (sendEmail) {
        console.log('[v0] Triggering email send to:', adminEmail)
        try {
          const invitedBy = invitedByUserId ? await loadInviterProfile(invitedByUserId) : null
          const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://test.myflynai.com'}/api/email/send-admin-invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accessCode: code,
              adminEmail,
              adminName,
              role,
              expiresAt: expiresAt.toISOString(),
              permissions: accessCodeData.permissions,
              invitedBy,
            }),
          })
          
          const emailData = await emailResponse.json()
          console.log('[v0] Email API response:', {
            status: emailResponse.status,
            success: emailData.success,
            message: emailData.message,
            error: emailData.error,
          })
          
          if (!emailResponse.ok) {
            console.error('[v0] Email API returned error:', emailData.error || 'Unknown error')
          } else {
            console.log('[v0] Email sent successfully to:', adminEmail)
          }
        } catch (emailError) {
          console.error('[v0] Failed to send email:', {
            error: emailError instanceof Error ? emailError.message : String(emailError),
            email: adminEmail,
          })
          // Don't fail the entire operation if email fails
        }
      }

      if (invitedByUserId) {
        const inviterSnap = await db.collection('users').doc(invitedByUserId).get()
        const inviter = inviterSnap.data() as Record<string, unknown> | undefined
        await auditFromApiRequest(request, {
          adminId: invitedByUserId,
          adminEmail: String(inviter?.email || 'unknown'),
          adminName: getUserDisplayName(inviter as Parameters<typeof getUserDisplayName>[0]),
          adminRole: formatAdminRoleLabel(String(inviter?.role || 'admin')),
          actionType: 'create',
          action: `Generated admin invitation for ${adminEmail}`,
          entityType: 'admin',
          entityName: adminName,
          status: 'success',
          details: `Role: ${role}; Code sent: ${!!sendEmail}`,
        })
      }

      return NextResponse.json({
        success: true,
        data: { id: docRef.id, ...accessCodeData },
      })
    }

    if (action === 'create-admin') {
      // Called after user signs up with access code
      const { email, name, role, accessCodeId } = data

      if (!email || !role || !accessCodeId) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
      }

      const codeRef = db.collection('adminAccessCodes').doc(accessCodeId)
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

      const docRef = await db.collection('admin-users').add(adminData)

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

    await db.collection('admin-users').doc(id).update(updateData)

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

    const snap = await db.collection('admin-users').doc(id).get()
    const data = snap.data() as Record<string, unknown> | undefined
    const label = String(data?.name || data?.email || id)

    await db.collection('admin-users').doc(id).delete()

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
