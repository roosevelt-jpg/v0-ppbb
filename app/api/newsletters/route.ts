import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, getDocs, getDoc, doc, query, orderBy } from 'firebase-admin/firestore'
import { getAdminApp } from '@/lib/firebase-admin'

const db = getFirestore(getAdminApp())

export async function GET(request: NextRequest) {
  try {
    const q = query(collection(db, 'newsletters'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    const newsletters = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      scheduledFor: doc.data().scheduledFor?.toDate?.() || null,
      sentAt: doc.data().sentAt?.toDate?.() || null,
    }))

    return NextResponse.json({
      success: true,
      data: newsletters,
      count: newsletters.length,
    })
  } catch (error) {
    console.error('[v0] Error fetching newsletters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch newsletters' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, subject, content, template, status = 'draft', scheduledFor } = body

    if (!title || !subject || !content || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: title, subject, content, template' },
        { status: 400 }
      )
    }

    // Get all users for recipient count
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const recipientCount = usersSnapshot.size

    const newsLetterData = {
      title,
      subject,
      content,
      template,
      status,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      recipientCount,
      openedCount: 0,
      clickedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const docRef = await addDoc(collection(db, 'newsletters'), newsLetterData)

    return NextResponse.json({
      success: true,
      message: 'Newsletter created successfully',
      id: docRef.id,
      data: {
        id: docRef.id,
        ...newsLetterData,
      },
    })
  } catch (error) {
    console.error('[v0] Error creating newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to create newsletter' },
      { status: 500 }
    )
  }
}
