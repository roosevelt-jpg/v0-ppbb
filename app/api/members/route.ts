import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { isAccountDeleted } from '@/lib/user-settings'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'

async function requireAdmin(request: NextRequest): Promise<
  | { ok: true; uid: string }
  | { ok: false; response: NextResponse }
> {
  const uid = await requireAdminFromRequest(request)
  if (!uid) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Admin access required (manage_members)' },
        { status: 403 }
      ),
    }
  }
  return { ok: true, uid }
}

function normalizeIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))]
    .map((id) => id.trim())
    .slice(0, 200)
}

async function applyBulkUpdate(ids: string[], patch: Record<string, unknown>) {
  const db = getAdminDb()
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += 400) chunks.push(ids.slice(i, i + 400))

  let updated = 0
  for (const chunk of chunks) {
    const batch = db.batch()
    for (const id of chunk) {
      batch.set(db.collection('users').doc(id), patch, { merge: true })
      updated += 1
    }
    await batch.commit()
  }
  return updated
}

async function applyBulkDelete(ids: string[]) {
  const db = getAdminDb()
  const now = FieldValue.serverTimestamp()
  const patch = {
    status: 'deleted',
    accountDeleted: true,
    active: false,
    deletedAt: now,
    updatedAt: now,
  }
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += 400) chunks.push(ids.slice(i, i + 400))

  let deleted = 0
  for (const chunk of chunks) {
    const batch = db.batch()
    for (const id of chunk) {
      batch.set(db.collection('users').doc(id), patch, { merge: true })
      // Keep admin mirror in sync if present
      batch.set(
        db.collection('admin-users').doc(id),
        { status: 'deleted', active: false, updatedAt: now },
        { merge: true }
      )
      deleted += 1
    }
    await batch.commit()
  }
  return deleted
}

export async function GET(request: NextRequest) {
  try {
    const userType = request.nextUrl.searchParams.get('userType')
    const status = request.nextUrl.searchParams.get('status')
    const search = request.nextUrl.searchParams.get('search')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '1000', 10)

    // Prefer dateJoined, fall back to unordered if the index/field is sparse
    let snapshot
    try {
      snapshot = await getAdminDb()
        .collection('users')
        .orderBy('dateJoined', 'desc')
        .limit(limit)
        .get()
    } catch {
      snapshot = await getAdminDb().collection('users').limit(limit).get()
    }

    let members = snapshot.docs.map((doc) => {
      const data = doc.data()
      const dateJoined =
        data.dateJoined?.toDate?.() ||
        (data.dateJoined instanceof Date ? data.dateJoined : data.dateJoined ? new Date(data.dateJoined) : null)
      const createdAt =
        data.createdAt?.toDate?.() ||
        (data.createdAt instanceof Date ? data.createdAt : data.createdAt ? new Date(data.createdAt) : null)
      return {
        id: doc.id,
        ...data,
        dateJoined,
        joinedAt: data.joinedAt?.toDate?.() || data.joinedAt,
        createdAt,
      }
    })

    members = members.filter((m) => !isAccountDeleted(m))

    if (userType) {
      members = members.filter((m) => m.role === userType || m.userType === userType)
    }

    if (status) {
      members = members.filter((m) => m.status === status)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      members = members.filter(
        (m) =>
          String(m.name || '').toLowerCase().includes(searchLower) ||
          String(m.displayName || '').toLowerCase().includes(searchLower) ||
          String(m.firstName || '').toLowerCase().includes(searchLower) ||
          String(m.lastName || '').toLowerCase().includes(searchLower) ||
          String(m.email || '').toLowerCase().includes(searchLower) ||
          String(m.location?.city || m.location || m.emirate || '')
            .toLowerCase()
            .includes(searchLower)
      )
    }

    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    console.error('[v0] Members fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authz = await requireAdmin(request)
    if (!authz.ok) return authz.response

    const body = await request.json().catch(() => ({}))
    const action = String(body.action || '')
    const ids = normalizeIds(body.ids)

    if (!ids.length) {
      return NextResponse.json({ success: false, error: 'Select at least one member' }, { status: 400 })
    }

    if (action === 'bulk-delete') {
      const deleted = await applyBulkDelete(ids)
      return NextResponse.json({
        success: true,
        message: deleted === 1 ? 'Member deleted' : `Deleted ${deleted} members`,
        count: deleted,
      })
    }

    if (action === 'bulk-update') {
      // This endpoint only requires manage_members (not manage_admins), so
      // the role value must be restricted to the plain member types the
      // admin UI's own dropdown offers — never an admin-panel role like
      // 'admin'/'super_admin', or a member-management-scoped admin could
      // grant themselves (or anyone) elevated access through this API.
      const ALLOWED_ROLES = new Set(['member', 'volunteer', 'business'])
      const ALLOWED_STATUSES = new Set(['active', 'inactive', 'suspended'])

      const allowed: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }
      if (typeof body.status === 'string' && body.status.trim()) {
        const status = body.status.trim()
        if (!ALLOWED_STATUSES.has(status)) {
          return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
        }
        allowed.status = status
        if (status === 'active') {
          allowed.active = true
          allowed.accountDeleted = false
        }
        if (status === 'inactive' || status === 'suspended') {
          allowed.active = false
        }
      }
      if (typeof body.role === 'string' && body.role.trim()) {
        const role = body.role.trim()
        if (!ALLOWED_ROLES.has(role)) {
          return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 })
        }
        allowed.role = role
        allowed.userType = role
      }
      if (typeof body.userType === 'string' && body.userType.trim()) {
        const userType = body.userType.trim()
        if (!ALLOWED_ROLES.has(userType)) {
          return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 })
        }
        allowed.userType = userType
        if (!allowed.role) allowed.role = userType
      }

      if (Object.keys(allowed).length <= 1) {
        return NextResponse.json(
          { success: false, error: 'Choose a status and/or role to apply' },
          { status: 400 }
        )
      }

      const updated = await applyBulkUpdate(ids, allowed)
      return NextResponse.json({
        success: true,
        message: `Updated ${updated} members`,
        count: updated,
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[v0] Members bulk POST error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Bulk operation failed',
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authz = await requireAdmin(request)
    if (!authz.ok) return authz.response

    const body = await request.json()
    const { id, ids, ...updateData } = body

    // Same plain-member-only roles as the bulk-update action above — this
    // endpoint only requires manage_members, so it must never be able to
    // grant an admin-panel role like 'admin'/'super_admin'.
    const ALLOWED_ROLES = new Set(['member', 'volunteer', 'business'])
    const ALLOWED_STATUSES = new Set(['active', 'inactive', 'suspended'])

    // Bulk update (legacy path)
    if (Array.isArray(ids) && ids.length > 0) {
      const normalized = normalizeIds(ids)
      const allowed: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }
      if (typeof updateData.status === 'string') {
        if (!ALLOWED_STATUSES.has(updateData.status)) {
          return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
        }
        allowed.status = updateData.status
        if (updateData.status === 'active') {
          allowed.active = true
          allowed.accountDeleted = false
        }
        if (updateData.status === 'inactive' || updateData.status === 'suspended') {
          allowed.active = false
        }
      }
      if (typeof updateData.role === 'string') {
        if (!ALLOWED_ROLES.has(updateData.role)) {
          return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 })
        }
        allowed.role = updateData.role
        allowed.userType = updateData.role
      }
      if (typeof updateData.userType === 'string') {
        if (!ALLOWED_ROLES.has(updateData.userType)) {
          return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 })
        }
        allowed.userType = updateData.userType
        if (!allowed.role) allowed.role = updateData.userType
      }
      const updated = await applyBulkUpdate(normalized, allowed)
      return NextResponse.json({ success: true, message: `Updated ${updated} members` })
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing member ID' }, { status: 400 })
    }

    if (typeof updateData.role === 'string' && !ALLOWED_ROLES.has(updateData.role)) {
      return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 })
    }
    if (typeof updateData.userType === 'string' && !ALLOWED_ROLES.has(updateData.userType)) {
      return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 })
    }
    // Never let a plain member-edit request touch admin-panel permissions.
    delete updateData.permissions
    delete updateData.roles

    updateData.updatedAt = FieldValue.serverTimestamp()
    await getAdminDb().collection('users').doc(id).set(updateData, { merge: true })

    return NextResponse.json({ success: true, message: 'Member updated' })
  } catch (error) {
    console.error('[v0] Member update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update member' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authz = await requireAdmin(request)
    if (!authz.ok) return authz.response

    const body = await request.json().catch(() => ({}))
    const ids = normalizeIds(
      Array.isArray(body.ids) ? body.ids : typeof body.id === 'string' ? [body.id] : []
    )

    if (!ids.length) {
      return NextResponse.json({ success: false, error: 'Missing member ID(s)' }, { status: 400 })
    }

    const deleted = await applyBulkDelete(ids)
    return NextResponse.json({
      success: true,
      message: deleted === 1 ? 'Member deleted' : `Deleted ${deleted} members`,
      count: deleted,
    })
  } catch (error) {
    console.error('[v0] Member delete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete member(s)' }, { status: 500 })
  }
}
