import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, collection, query, where, getDocs, updateDoc } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

const db = getFirestore()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    const q = query(collection(db, 'newsletter_subscribers'), where('email', '==', email))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    const doc = snapshot.docs[0]
    await updateDoc(doc.ref, {
      unsubscribedAt: new Date(),
      isActive: false,
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
    })
  } catch (error) {
    console.error('[v0] Error unsubscribing from newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    )
  }
}
