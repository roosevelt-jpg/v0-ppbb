import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import { getAdminUserData } from '@/lib/admin-access-server'
import { auditAdminApiAction } from '@/lib/audit-api-helper'
import { serializeFirestoreDoc } from '@/lib/serialize-firestore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DOC_ID = 'current'

async function requireAdmin(request: NextRequest) {
  const uid = await requireAdminFromRequest(request)
  if (!uid) return null
  const adminData = await getAdminUserData(uid)
  return { uid, email: String(adminData?.email || 'admin') }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    const snap = await db.collection('euDataProtectionPolicy').doc(DOC_ID).get()
    if (!snap.exists) {
      return NextResponse.json({ success: true, data: null })
    }

    return NextResponse.json({
      success: true,
      data: serializeFirestoreDoc(snap.id, snap.data() as Record<string, unknown>),
    })
  } catch (error) {
    console.error('[admin/eu-policy GET]', error)
    return NextResponse.json({ success: false, error: 'Failed to load policy' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const title = String(body.title || '').trim()
    const content = String(body.content || '').trim()
    const status = body.status as 'draft' | 'active' | 'archived'
    const requiresAcceptance = Boolean(body.requiresAcceptance)
    const publish = Boolean(body.publish)

    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'Title and content are required' }, { status: 400 })
    }

    if (!['draft', 'active', 'archived'].includes(status) && !publish) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
    }

    const db = getAdminDb()
    const ref = db.collection('euDataProtectionPolicy').doc(DOC_ID)
    const existing = await ref.get()
    const existingData = existing.exists ? existing.data() : null
    const nextVersion = Number(existingData?.version || 0) + 1
    const resolvedStatus = publish ? 'active' : status

    const payload = {
      id: DOC_ID,
      title,
      content,
      version: nextVersion,
      status: resolvedStatus,
      effectiveDate: existingData?.effectiveDate || FieldValue.serverTimestamp(),
      lastUpdated: FieldValue.serverTimestamp(),
      createdBy: existingData?.createdBy || admin.email,
      updatedBy: admin.email,
      requiresAcceptance,
      acceptanceRequired: requiresAcceptance,
    }

    await ref.set(payload, { merge: true })

    await auditAdminApiAction(request, admin.uid, {
      actionType: publish ? 'update' : 'update',
      action: publish ? 'Published EU Data Protection policy' : 'Updated EU Data Protection policy',
      entityType: 'content',
      entityId: DOC_ID,
      status: 'success',
      details: `Version ${nextVersion}, status: ${resolvedStatus}`,
    })

    const saved = await ref.get()
    return NextResponse.json({
      success: true,
      data: serializeFirestoreDoc(saved.id, (saved.data() || {}) as Record<string, unknown>),
    })
  } catch (error) {
    console.error('[admin/eu-policy POST]', error)
    return NextResponse.json({ success: false, error: 'Failed to save policy' }, { status: 500 })
  }
}
