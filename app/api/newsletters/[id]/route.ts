import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, doc, getDoc, updateDoc, deleteDoc, getDocs, collection } from 'firebase-admin/firestore'
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
    return NextResponse.json({
      success: true,
      data: {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        scheduledFor: data.scheduledFor?.toDate?.() || null,
        sentAt: data.sentAt?.toDate?.() || null,
      },
    })
  } catch (error) {
    console.error('[v0] Error fetching newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to fetch newsletter' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, subject, content, template, status, scheduledFor } = body

    const docRef = doc(db, 'newsletters', params.id)
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (title !== undefined) updateData.title = title
    if (subject !== undefined) updateData.subject = subject
    if (content !== undefined) updateData.content = content
    if (template !== undefined) updateData.template = template
    if (status !== undefined) updateData.status = status
    if (scheduledFor !== undefined) updateData.scheduledFor = scheduledFor ? new Date(scheduledFor) : null

    await updateDoc(docRef, updateData)

    return NextResponse.json({
      success: true,
      message: 'Newsletter updated successfully',
    })
  } catch (error) {
    console.error('[v0] Error updating newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to update newsletter' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = doc(db, 'newsletters', params.id)
    await deleteDoc(docRef)

    return NextResponse.json({
      success: true,
      message: 'Newsletter deleted successfully',
    })
  } catch (error) {
    console.error('[v0] Error deleting newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to delete newsletter' },
      { status: 500 }
    )
  }
}
