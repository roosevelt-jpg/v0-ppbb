import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore'

let db: any

function getAdminDb() {
  if (db) return db
  
  const app = getApps().length > 0 ? getApps()[0] : initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    } as any),
  })
  
  db = getAdminFirestore(app)
  return db
}

// GET - Fetch moderation reports/actions
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('communityId')
    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = db.collection('community-moderation')

    if (communityId) {
      query = query.where('communityId', '==', communityId)
    }

    query = query.where('action', '==', status).orderBy('createdAt', 'desc').limit(limit)

    const snapshot = await query.get()
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
      resolvedAt: doc.data().resolvedAt?.toDate?.(),
    }))

    return NextResponse.json({ success: true, data: reports })
  } catch (error) {
    console.error('[v0] Error fetching moderation reports:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch reports' }, { status: 500 })
  }
}

// POST - Report content or user
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const { communityId, type, targetId, reportedBy, reason, bannedWords } = body

    if (!communityId || !type || !targetId || !reportedBy || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('[v0] Creating moderation report:', { type, targetId, reason })

    const reportRef = await db.collection('community-moderation').add({
      communityId,
      type,
      targetId,
      reportedBy,
      reason,
      bannedWords: bannedWords || [],
      action: 'pending',
      createdAt: new Date(),
    })

    // Flag the message if it's a message flag report
    if (type === 'message_flag') {
      const messageDoc = await db.collection('community-messages').doc(targetId).get()
      if (messageDoc.exists) {
        const flaggedCount = (messageDoc.data().flaggedCount || 0) + 1
        await db.collection('community-messages').doc(targetId).update({
          isFlagged: true,
          flaggedCount,
          flagReason: reason,
          updatedAt: new Date(),
        })
      }
    }

    console.log('[v0] Report created:', reportRef.id)

    return NextResponse.json({
      success: true,
      data: { id: reportRef.id, type, targetId },
    })
  } catch (error) {
    console.error('[v0] Error creating report:', error)
    return NextResponse.json({ success: false, error: 'Failed to create report' }, { status: 500 })
  }
}

// PUT - Resolve moderation action
export async function PUT(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const { reportId, action, actionTakenBy, duration, notes, messageIdToDelete } = body

    if (!reportId || !action) {
      return NextResponse.json(
        { success: false, error: 'reportId and action are required' },
        { status: 400 }
      )
    }

    console.log('[v0] Resolving moderation action:', { reportId, action })

    // Get the report to know what to do
    const reportDoc = await db.collection('community-moderation').doc(reportId).get()
    if (!reportDoc.exists) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 })
    }

    const report = reportDoc.data()

    // If action is warning/mute/ban on user
    if (report.type === 'user_ban' || report.type === 'user_warning') {
      const userId = report.targetId
      const memberRef = db.collection('community-memberships').where('userId', '==', userId).where('communityId', '==', report.communityId)
      const memberSnap = await memberRef.get()

      if (!memberSnap.empty) {
        const memberDoc = memberSnap.docs[0]
        const updateData: any = {
          status: action === 'ban' ? 'banned' : action === 'mute' ? 'suspended' : 'active',
          updatedAt: new Date(),
        }

        if (action === 'mute' && duration) {
          updateData.mutedUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
        }

        await memberDoc.ref.update(updateData)
      }
    }

    // If action is delete message
    if (report.type === 'message_flag' && action === 'delete') {
      await db.collection('community-messages').doc(report.targetId).delete()
    }

    // Update the report
    await db.collection('community-moderation').doc(reportId).update({
      action,
      actionTakenBy: actionTakenBy || 'system',
      notes: notes || '',
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })

    console.log('[v0] Moderation action resolved')

    return NextResponse.json({ success: true, message: 'Action resolved' })
  } catch (error) {
    console.error('[v0] Error resolving action:', error)
    return NextResponse.json({ success: false, error: 'Failed to resolve action' }, { status: 500 })
  }
}
