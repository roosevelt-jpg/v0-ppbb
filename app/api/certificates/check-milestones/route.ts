import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'
import { evaluateCertificateMilestonesForUser } from '@/lib/certificate-milestones-server'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const requestedUserId = typeof body.userId === 'string' ? body.userId : uid

    if (requestedUserId !== uid) {
      const isAdmin = await isAdminUser(uid)
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }
    }

    const result = await evaluateCertificateMilestonesForUser(requestedUserId)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[certificates/check-milestones]', error)
    return NextResponse.json({ success: false, error: 'Failed to evaluate milestones' }, { status: 500 })
  }
}
