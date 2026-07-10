import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { getAdminDb } from '@/lib/firebase-admin'

function buildThreadId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_')
}

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

    const body = await request.json()
    const recipientId = String(body.recipientId || '')
    if (!recipientId || recipientId === uid) {
      return NextResponse.json({ success: false, error: 'Invalid recipient' }, { status: 400 })
    }

    const db = getAdminDb()
    const [senderSnap, recipientSnap] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('users').doc(recipientId).get(),
    ])

    const senderData = senderSnap.data() || {}
    const recipientData = recipientSnap.data() || {}
    const senderName =
      `${senderData.firstName || ''} ${senderData.lastName || ''}`.trim() ||
      String(senderData.displayName || 'Member')
    const recipientName =
      `${recipientData.firstName || ''} ${recipientData.lastName || ''}`.trim() ||
      String(recipientData.displayName || recipientData.businessProfile?.businessName || 'Member')

    const threadId = buildThreadId(uid, recipientId)
    const threadRef = db.collection('dmThreads').doc(threadId)
    const threadSnap = await threadRef.get()

    if (!threadSnap.exists) {
      await threadRef.set({
        participantIds: [uid, recipientId],
        participantNames: {
          [uid]: senderName,
          [recipientId]: recipientName,
        },
        lastMessage: '',
        lastMessageAt: new Date(),
        lastSenderId: '',
        unreadCounts: { [uid]: 0, [recipientId]: 0 },
        createdAt: new Date(),
      })
    }

    return NextResponse.json({
      success: true,
      threadId,
      recipientName,
    })
  } catch (error) {
    console.error('[dm/threads] POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to open thread' }, { status: 500 })
  }
}
