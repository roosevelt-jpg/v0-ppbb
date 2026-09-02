import { NextRequest, NextResponse } from 'next/server'
import { doc, updateDoc } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const { scheduledFor } = body

    if (!scheduledFor) {
      return NextResponse.json(
        { error: 'Missing scheduledFor date' },
        { status: 400 }
      )
    }

    const scheduledDate = new Date(scheduledFor)
    if (scheduledDate < new Date()) {
      return NextResponse.json(
        { error: 'Scheduled date must be in the future' },
        { status: 400 }
      )
    }

    const docRef = doc(db, 'newsletters', params.id)
    await updateDoc(docRef, {
      status: 'scheduled',
      scheduledFor: scheduledDate,
    })

    return NextResponse.json({
      success: true,
      message: 'Newsletter scheduled successfully',
      scheduledFor: scheduledDate.toISOString(),
    })
  } catch (error) {
    console.error('[v0] Error scheduling newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to schedule newsletter' },
      { status: 500 }
    )
  }
}
