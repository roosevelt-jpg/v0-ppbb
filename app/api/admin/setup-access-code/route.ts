import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin
const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  credential: cert(firebaseAdminConfig as any),
})

const db = getFirestore(app)

export async function POST(request: NextRequest) {
  try {
    const { email, accessCode, adminSecret } = await request.json()

    // Verify admin secret (basic protection)
    if (adminSecret !== process.env.ADMIN_SETUP_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!email || !accessCode) {
      return NextResponse.json(
        { error: 'Email and access code are required' },
        { status: 400 }
      )
    }

    // Update admin user with access code
    await db.collection('users').doc(email).update({
      accessCode,
      accessCodeUpdatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: `Access code set for ${email}`,
      email,
      accessCode,
    })
  } catch (error: any) {
    console.error('Error setting access code:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
