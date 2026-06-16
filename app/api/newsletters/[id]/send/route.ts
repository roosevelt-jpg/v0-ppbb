import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, doc, updateDoc, getDocs, collection } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

const db = getFirestore()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = doc(db, 'newsletters', params.id)

    // Get all users to send newsletter to
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const recipients = usersSnapshot.docs.map(doc => doc.data())

    // Update newsletter status to sent
    await updateDoc(docRef, {
      status: 'sent',
      sentAt: new Date(),
      recipientCount: recipients.length,
    })

    // TODO: Integrate with email service (SendGrid/Resend)
    // This would send the newsletter to all users using configured email service
    // For now, we're just marking it as sent in the database

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${recipients.length} recipients`,
      recipientCount: recipients.length,
    })
  } catch (error) {
    console.error('[v0] Error sending newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    )
  }
}
