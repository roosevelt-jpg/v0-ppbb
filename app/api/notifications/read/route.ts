import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import { verifyIdToken } from '@/lib/admin-access-server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const header = request.headers.get('authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    const uid = token ? await verifyIdToken(token) : null
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 })
    }

    const body = (await request.json().catch(() => null)) as { id?: string; scope?: string } | null
    const id = String(body?.id || '').trim()
    const scope = body?.scope === 'admin' ? 'admin' : 'user'
    if (!id || id.includes('/')) {
      return NextResponse.json({ success: false, error: 'Invalid notification' }, { status: 400 })
    }

    const db = getAdminDb()
    if (scope === 'admin') {
      const adminUid = await requireAdminFromRequest(request)
      if (!adminUid) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }
      await db.collection('adminNotifications').doc(id).set(
        { read: true, readAt: new Date() },
        { merge: true }
      )
    } else {
      await db.collection('users').doc(uid).collection('notifications').doc(id).set(
        { read: true, readAt: new Date() },
        { merge: true }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[notifications] mark read failed:', error)
    return NextResponse.json({ success: false, error: 'Could not update notification' }, { status: 500 })
  }
}
