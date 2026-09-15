import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { releaseAccountForReregistration } from '@/lib/account-delete'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const result = await releaseAccountForReregistration(uid)
    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      authDeleted: result.authDeleted,
      message: 'Account deleted. You can register again with the same email.',
    })
  } catch (error) {
    console.error('[v0] Account delete error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
