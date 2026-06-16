import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

if (!getApps().length) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

const db = getFirestore()

export async function GET(request: NextRequest) {
  try {
    const adminsRef = collection(db, 'adminUsers')
    const snapshot = await getDocs(adminsRef)
    
    const admins = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    }))

    return NextResponse.json({
      success: true,
      admins,
      count: admins.length,
    })
  } catch (error) {
    console.error('[v0] Error fetching admins:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch admins' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: any) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      )
    }

    await deleteDoc(doc(db, 'adminUsers', id))
    // Also delete from users collection
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
