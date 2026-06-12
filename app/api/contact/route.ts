import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, subject, message, status, read } = await req.json()

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'contactRequests'), {
      name,
      email,
      phone: phone || '',
      subject,
      message,
      status: status || 'new',
      read: read || false,
      createdAt: serverTimestamp(),
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Contact request submitted successfully',
        id: docRef.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Contact API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
