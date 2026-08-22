import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { getAdminApp } from '@/lib/firebase-admin'

const db = getFirestore(getAdminApp())

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id

    const docSnap = await db.collection('conversations').doc(conversationId).get()

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: docSnap.id,
      ...docSnap.data(),
    })
  } catch (error) {
    console.error('[v0] Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id
    const updates = await request.json()

    await db.collection('conversations').doc(conversationId).update({
      ...updates,
      updatedAt: new Date(),
    })

    return NextResponse.json({
      message: 'Conversation updated successfully',
    })
  } catch (error) {
    console.error('[v0] Error updating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id

    await db.collection('conversations').doc(conversationId).delete()

    return NextResponse.json({
      message: 'Conversation deleted successfully',
    })
  } catch (error) {
    console.error('[v0] Error deleting conversation:', error)
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}
