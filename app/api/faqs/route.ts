import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

const db = getAdminDb()

interface FAQ {
  id?: string
  question: string
  answer: string
  category: string
  order: number
  status: 'published' | 'draft'
  createdAt?: Date
  updatedAt?: Date
}

// GET: Fetch all published FAQs (public) or all FAQs for admin
export async function GET(request: NextRequest) {
  try {
    const isAdmin = request.headers.get('x-admin-auth') === 'true'
    const category = request.nextUrl.searchParams.get('category')

    let query = db.collection('faqs')

    if (!isAdmin) {
      // Public: only published FAQs
      query = query.where('status', '==', 'published')
    }

    if (category) {
      query = query.where('category', '==', category)
    }

    query = query.orderBy('order', 'asc')

    const snapshot = await query.get()
    const faqs: FAQ[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
      updatedAt: doc.data().updatedAt?.toDate?.(),
    })) as FAQ[]

    return NextResponse.json({ success: true, data: faqs })
  } catch (error) {
    console.error('[v0] FAQ fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch FAQs' }, { status: 500 })
  }
}

// POST: Create or update FAQ (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, question, answer, category, order, status } = body

    if (!question || !answer || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const faqData: FAQ = {
      question,
      answer,
      category,
      order: order || 0,
      status: status || 'draft',
      updatedAt: new Date(),
    }

    if (id) {
      // Update existing
      await db.collection('faqs').doc(id).update(faqData)
      return NextResponse.json({
        success: true,
        data: { id, ...faqData },
        message: 'FAQ updated',
      })
    } else {
      // Create new
      faqData.createdAt = new Date()
      const docRef = await db.collection('faqs').add(faqData)
      return NextResponse.json({
        success: true,
        data: { id: docRef.id, ...faqData },
        message: 'FAQ created',
      })
    }
  } catch (error) {
    console.error('[v0] FAQ create/update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save FAQ' },
      { status: 500 }
    )
  }
}

// DELETE: Remove FAQ (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing FAQ ID' },
        { status: 400 }
      )
    }

    await db.collection('faqs').doc(id).delete()
    return NextResponse.json({ success: true, message: 'FAQ deleted' })
  } catch (error) {
    console.error('[v0] FAQ delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete FAQ' },
      { status: 500 }
    )
  }
}
