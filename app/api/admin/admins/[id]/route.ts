import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, doc, deleteDoc } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

if (!getApps().length) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

const db = getFirestore()

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      )
    }

    await deleteDoc(doc(db, 'adminUsers', id))
    await deleteDoc(doc(db, 'users', id))

    return NextResponse.json({
      success: true,
      message: 'Admin deleted successfully',
    })
  } catch (error) {
    console.error('[v0] Error deleting admin:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete admin' },
      { status: 500 }
    )
  }
}
