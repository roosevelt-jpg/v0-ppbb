import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { isAccountDeleted } from '@/lib/user-settings'

export async function GET(request: NextRequest) {
  try {
    const userType = request.nextUrl.searchParams.get('userType')
    const status = request.nextUrl.searchParams.get('status')
    const search = request.nextUrl.searchParams.get('search')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '1000')

    let query = getAdminDb().collection('users').orderBy('dateJoined', 'desc').limit(limit)

    const snapshot = await query.get()
    let members = snapshot.docs.map(doc => {
      const data = doc.data()
      const dateJoined = data.dateJoined?.toDate?.() || (data.dateJoined instanceof Date ? data.dateJoined : new Date(data.dateJoined))
      const createdAt = data.createdAt?.toDate?.() || (data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt))
      return {
        id: doc.id,
        ...data,
        dateJoined: dateJoined,
        joinedAt: data.joinedAt?.toDate?.() || data.joinedAt,
        createdAt: createdAt,
      }
    })

    members = members.filter((m) => !isAccountDeleted(m))

    // Filter by user type (role in signup)
    if (userType) {
      members = members.filter(m => m.role === userType || m.userType === userType)
    }

    // Filter by status
    if (status) {
      members = members.filter(m => m.status === status)
    }

    // Search by name, email, location
    if (search) {
      const searchLower = search.toLowerCase()
      members = members.filter(m =>
        (m.name?.toLowerCase().includes(searchLower)) ||
        (m.email?.toLowerCase().includes(searchLower)) ||
        (m.location?.city?.toLowerCase().includes(searchLower))
      )
    }

    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    console.error('[v0] Members fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ids, ...updateData } = body

    // Bulk update: { ids: string[], status?, role?, userType? }
    if (Array.isArray(ids) && ids.length > 0) {
      const db = getAdminDb()
      const batch = db.batch()
      const allowed: Record<string, unknown> = { updatedAt: new Date() }
      if (typeof updateData.status === 'string') allowed.status = updateData.status
      if (typeof updateData.role === 'string') {
        allowed.role = updateData.role
        allowed.userType = updateData.role
      }
      if (typeof updateData.userType === 'string') {
        allowed.userType = updateData.userType
        if (!allowed.role) allowed.role = updateData.userType
      }
      for (const memberId of ids.slice(0, 200)) {
        if (typeof memberId !== 'string' || !memberId) continue
        batch.update(db.collection('users').doc(memberId), allowed)
      }
      await batch.commit()
      return NextResponse.json({ success: true, message: `Updated ${ids.length} members` })
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing member ID' }, { status: 400 })
    }

    updateData.updatedAt = new Date()

    await getAdminDb().collection('users').doc(id).update(updateData)

    return NextResponse.json({ success: true, message: 'Member updated' })
  } catch (error) {
    console.error('[v0] Member update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update member' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ids: string[] = Array.isArray(body.ids)
      ? body.ids.filter((id: unknown) => typeof id === 'string' && id)
      : typeof body.id === 'string'
        ? [body.id]
        : []

    if (!ids.length) {
      return NextResponse.json({ success: false, error: 'Missing member ID(s)' }, { status: 400 })
    }

    const db = getAdminDb()
    const batch = db.batch()
    const now = new Date()
    for (const id of ids.slice(0, 200)) {
      // Soft-delete: mark deleted rather than wiping auth/history
      batch.update(db.collection('users').doc(id), {
        status: 'deleted',
        accountDeleted: true,
        deletedAt: now,
        updatedAt: now,
      })
    }
    await batch.commit()

    return NextResponse.json({
      success: true,
      message: ids.length === 1 ? 'Member deleted' : `Deleted ${ids.length} members`,
    })
  } catch (error) {
    console.error('[v0] Member delete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete member(s)' }, { status: 500 })
  }
}
