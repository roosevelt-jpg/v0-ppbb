import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { toGroupChatIdentity, toPublicMemberProfile } from '@/lib/user-settings'
import { verifyIdToken } from '@/lib/admin-access-server'

/**
 * Batch resolve privacy-aware member identities for group chat / forum.
 * POST { ids: string[], viewerId?: string, mode?: 'chat' | 'profile' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
      : []
    const uniqueIds = [...new Set(ids.map((id: string) => id.trim()))].slice(0, 100)

    let viewerId =
      typeof body.viewerId === 'string' && body.viewerId.trim() ? body.viewerId.trim() : null

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (token) {
      const uid = await verifyIdToken(token)
      if (uid) viewerId = uid
    }

    if (uniqueIds.length === 0) {
      return NextResponse.json({ success: true, data: {} })
    }

    const db = getAdminDb()
    const mode = body.mode === 'profile' ? 'profile' : 'chat'
    const result: Record<string, unknown> = {}

    await Promise.all(
      uniqueIds.map(async (id) => {
        const snap = await db.collection('users').doc(id).get()
        const data = snap.exists ? snap.data() : null
        result[id] =
          mode === 'profile'
            ? toPublicMemberProfile(id, data, viewerId)
            : toGroupChatIdentity(id, data, viewerId)
      })
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[v0] batch-public-profiles error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load profiles' }, { status: 500 })
  }
}
