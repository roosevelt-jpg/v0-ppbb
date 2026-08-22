import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, doc, getDoc } from 'firebase-admin/firestore'
import { getAdminApp } from '@/lib/firebase-admin'

const db = getFirestore(getAdminApp())

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = doc(db, 'newsletters', params.id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Newsletter not found' },
        { status: 404 }
      )
    }

    const data = docSnap.data()
    const analytics = {
      recipientCount: data.recipientCount || 0,
      openedCount: data.openedCount || 0,
      clickedCount: data.clickedCount || 0,
      openRate: data.recipientCount ? ((data.openedCount || 0) / data.recipientCount * 100).toFixed(2) : 0,
      clickRate: data.recipientCount ? ((data.clickedCount || 0) / data.recipientCount * 100).toFixed(2) : 0,
      sentAt: data.sentAt?.toDate?.() || null,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    }

    return NextResponse.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    console.error('[v0] Error fetching newsletter analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
