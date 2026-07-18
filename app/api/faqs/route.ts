import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'

type FaqStatus = 'published' | 'draft'

interface FaqRow {
  id: string
  question: string
  answer: string
  category: string
  order: number
  status: FaqStatus
  isActive: boolean
  createdAt?: unknown
  updatedAt?: unknown
}

async function requireAdmin(request: NextRequest): Promise<string | null> {
  return requireAdminFromRequest(request)
}

function mapDoc(id: string, data: Record<string, any>): FaqRow {
  const status: FaqStatus =
    data.status === 'published' || data.isActive === true ? 'published' : 'draft'
  return {
    id,
    question: String(data.question || ''),
    answer: String(data.answer || ''),
    category: String(data.category || 'General'),
    order: typeof data.order === 'number' ? data.order : 0,
    status,
    isActive: status === 'published',
    createdAt: data.createdAt?.toDate?.() ?? data.createdAt ?? null,
    updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt ?? null,
  }
}

/** GET — public published FAQs; all FAQs when Authorization Bearer is admin */
export async function GET(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    const category = request.nextUrl.searchParams.get('category')?.trim() || ''

    const snap = await getAdminDb().collection('faqs').get()
    let faqs = snap.docs.map((d) => mapDoc(d.id, d.data()))

    if (!adminUid) {
      faqs = faqs.filter((f) => f.status === 'published')
    }

    if (category) {
      faqs = faqs.filter((f) => f.category === category)
    }

    faqs.sort((a, b) => a.order - b.order || a.question.localeCompare(b.question))

    return NextResponse.json({ success: true, data: faqs })
  } catch (error) {
    console.error('[faqs] GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch FAQs' }, { status: 500 })
  }
}

/** POST — create or update (admin Bearer required) */
export async function POST(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const question = typeof body.question === 'string' ? body.question.trim() : ''
    const answer = typeof body.answer === 'string' ? body.answer.trim() : ''
    const category = typeof body.category === 'string' ? body.category.trim() : ''
    const id = typeof body.id === 'string' ? body.id.trim() : ''

    if (!question || !answer || !category) {
      return NextResponse.json(
        { success: false, error: 'Question, answer, and category are required' },
        { status: 400 }
      )
    }

    const resolvedStatus: FaqStatus = body.status === 'published' ? 'published' : 'draft'
    const order = Number.isFinite(Number(body.order)) ? Number(body.order) : 0

    const faqData = {
      question,
      answer,
      category,
      order,
      status: resolvedStatus,
      isActive: resolvedStatus === 'published',
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: adminUid,
    }

    if (id) {
      const ref = getAdminDb().collection('faqs').doc(id)
      const existing = await ref.get()
      if (!existing.exists) {
        return NextResponse.json({ success: false, error: 'FAQ not found' }, { status: 404 })
      }
      await ref.set(faqData, { merge: true })
      return NextResponse.json({
        success: true,
        data: { id, question, answer, category, order, status: resolvedStatus, isActive: resolvedStatus === 'published' },
        message: 'FAQ updated',
      })
    }

    const docRef = await getAdminDb().collection('faqs').add({
      ...faqData,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: adminUid,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        question,
        answer,
        category,
        order,
        status: resolvedStatus,
        isActive: resolvedStatus === 'published',
      },
      message: 'FAQ created',
    })
  } catch (error) {
    console.error('[faqs] POST error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save FAQ' },
      { status: 500 }
    )
  }
}

/** DELETE — remove FAQ (admin Bearer required) */
export async function DELETE(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let faqId = request.nextUrl.searchParams.get('id')?.trim() || ''
    if (!faqId) {
      const body = await request.json().catch(() => ({}))
      faqId = typeof body.id === 'string' ? body.id.trim() : ''
    }

    if (!faqId) {
      return NextResponse.json({ success: false, error: 'Missing FAQ ID' }, { status: 400 })
    }

    await getAdminDb().collection('faqs').doc(faqId).delete()
    return NextResponse.json({ success: true, message: 'FAQ deleted', id: faqId })
  } catch (error) {
    console.error('[faqs] DELETE error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete FAQ' },
      { status: 500 }
    )
  }
}
