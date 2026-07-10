import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { verifyIdToken } from '@/lib/admin-access-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const title = String(body.title || '').trim()
    const description = String(body.description || '').trim()
    const type = String(body.type || 'partnership').trim()
    const submitterName = String(body.submitterName || '').trim()
    const submitterEmail = String(body.submitterEmail || '').trim()

    if (!title || !description || !submitterName || !submitterEmail) {
      return NextResponse.json(
        { success: false, error: 'Name, email, title, and description are required' },
        { status: 400 }
      )
    }

    let submittedBy = 'public'
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (token) {
      const uid = await verifyIdToken(token)
      if (uid) submittedBy = uid
    }

    const db = getAdminDb()
    const ref = db.collection('partnerships').doc()
    const now = Timestamp.now()

    await ref.set(
      sanitizeForFirestore({
        id: ref.id,
        submittedBy,
        submitterName,
        submitterEmail,
        type,
        title,
        description,
        proposedBudget: body.proposedBudget || null,
        attachmentURL: body.attachmentURL || null,
        status: 'pending',
        adminNotes: null,
        submittedAt: now,
        updatedAt: now,
      })
    )

    return NextResponse.json({ success: true, id: ref.id })
  } catch (error) {
    console.error('[partnerships/apply] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit request' }, { status: 500 })
  }
}
