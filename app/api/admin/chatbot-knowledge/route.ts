import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdminFromRequest, unauthorizedResponse } from '@/lib/admin-api-auth'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import {
  normalizeKnowledgeDoc,
  type ChatbotKnowledgeInput,
  type ChatbotKnowledgeStatus,
} from '@/lib/chatbot-knowledge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COLLECTION = 'chatbotKnowledge'

export async function GET(request: NextRequest) {
  const uid = await requireAdminFromRequest(request)
  if (!uid) return unauthorizedResponse()

  try {
    const includeArchived = request.nextUrl.searchParams.get('includeArchived') === 'true'
    const db = getAdminDb()
    const snap = await db.collection(COLLECTION).get()
    let items = snap.docs.map((docSnap) =>
      normalizeKnowledgeDoc(docSnap.id, docSnap.data() as Record<string, unknown>)
    )

    if (!includeArchived) {
      items = items.filter((item) => item.status === 'active')
    }

    items.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))

    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('[v0] chatbot-knowledge GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load knowledge' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const uid = await requireAdminFromRequest(request)
  if (!uid) return unauthorizedResponse()

  try {
    const body = (await request.json()) as ChatbotKnowledgeInput
    const title = String(body.title || '').trim()
    const content = String(body.content || '').trim()

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const status: ChatbotKnowledgeStatus = body.status === 'archived' ? 'archived' : 'active'
    const payload = sanitizeForFirestore({
      title,
      content,
      triggers: String(body.triggers || '').trim(),
      alwaysInclude: Boolean(body.alwaysInclude),
      status,
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : Number(body.sortOrder) || 0,
      sourceFileName:
        typeof body.sourceFileName === 'string' && body.sourceFileName.trim()
          ? body.sourceFileName.trim()
          : null,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    })

    const db = getAdminDb()
    if (body.id) {
      const ref = db.collection(COLLECTION).doc(body.id)
      const existing = await ref.get()
      if (!existing.exists) {
        return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
      }
      await ref.update(payload)
      const updated = await ref.get()
      return NextResponse.json({
        success: true,
        data: normalizeKnowledgeDoc(updated.id, updated.data() as Record<string, unknown>),
      })
    }

    const ref = await db.collection(COLLECTION).add({
      ...payload,
      createdAt: FieldValue.serverTimestamp(),
    })
    const created = await ref.get()
    return NextResponse.json({
      success: true,
      data: normalizeKnowledgeDoc(created.id, created.data() as Record<string, unknown>),
    })
  } catch (error) {
    console.error('[v0] chatbot-knowledge POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save knowledge' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const uid = await requireAdminFromRequest(request)
  if (!uid) return unauthorizedResponse()

  try {
    const id = request.nextUrl.searchParams.get('id')?.trim()
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 })
    }

    const db = getAdminDb()
    const ref = db.collection(COLLECTION).doc(id)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
    }

    await ref.delete()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] chatbot-knowledge DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete knowledge' }, { status: 500 })
  }
}
