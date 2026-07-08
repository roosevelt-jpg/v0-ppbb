import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { serializeFirestoreDoc } from '@/lib/serialize-firestore'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    const snapshot = await db.collectionGroup('messages').orderBy('timestamp', 'desc').limit(100).get()

    const messages = snapshot.docs.map((doc) => {
      const pathParts = doc.ref.path.split('/')
      const communityId = pathParts[1] || ''
      const groupId = pathParts[3] || ''
      return {
        ...serializeFirestoreDoc(doc.id, doc.data() as Record<string, unknown>),
        communityId,
        groupId,
        path: doc.ref.path,
      }
    })

    return NextResponse.json({ success: true, data: messages })
  } catch (error) {
    console.error('[v0] Admin group messages fetch error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch messages'
    if (message.includes('index')) {
      console.error(
        '[v0] Create a Firestore collection group index for messages.timestamp in Firebase Console:',
        message
      )
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch messages', data: [] }, { status: 500 })
  }
}
