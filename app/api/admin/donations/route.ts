import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'

async function requireAdmin(request: NextRequest): Promise<string | null> {
  return requireAdminFromRequest(request)
}

const ALLOWED_STATUSES = new Set([
  'pending',
  'pending_verification',
  'verified',
  'completed',
  'refunded',
  'cancelled',
  'archived',
])

type DonationSource = 'donations' | 'donationSubmissions'

async function resolveDonationDoc(id: string, preferred?: string | null) {
  const db = getAdminDb()
  const order: DonationSource[] =
    preferred === 'donationSubmissions'
      ? ['donationSubmissions', 'donations']
      : preferred === 'donations'
        ? ['donations', 'donationSubmissions']
        : ['donationSubmissions', 'donations']

  for (const collectionName of order) {
    const ref = db.collection(collectionName).doc(id)
    const snap = await ref.get()
    if (snap.exists) {
      return { ref, snap, source: collectionName as DonationSource }
    }
  }
  return null
}

function serializeTimestamp(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }
  if (typeof value === 'object' && value !== null) {
    const maybe = value as { toDate?: () => Date; seconds?: number; _seconds?: number }
    if (typeof maybe.toDate === 'function') {
      try {
        return maybe.toDate().toISOString()
      } catch {
        /* ignore */
      }
    }
    const seconds = maybe.seconds ?? maybe._seconds
    if (typeof seconds === 'number') {
      return new Date(seconds * 1000).toISOString()
    }
  }
  return null
}

function normalizeDonation(id: string, data: Record<string, unknown>, source: DonationSource) {
  const statusRaw = String(data.status || 'pending')
  const status =
    statusRaw === 'pending_verification'
      ? 'pending'
      : statusRaw === 'verified'
        ? 'completed'
        : statusRaw

  return {
    id,
    donorName: data.donorName || data.userName || data.anonymousName || 'Anonymous',
    donorEmail: data.donorEmail || data.email || '',
    email: data.donorEmail || data.email || '',
    amount: Number(data.amount) || 0,
    type: data.donationType || data.type || 'monetary',
    targetCase: data.causeName || data.targetCase || 'General',
    purpose: data.purpose || data.notes || data.message || '',
    notes: data.notes || '',
    status,
    paymentMethod: data.paymentMethod || data.method || 'bank-transfer',
    currency: data.currency || 'AED',
    createdAt: serializeTimestamp(data.createdAt || data.submittedAt),
    receiptUrl: data.receiptUrl || data.proofUrl || null,
    _source: source,
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get('id')?.trim() || ''
    const sourceHint = request.nextUrl.searchParams.get('source')?.trim() || ''
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing donation id' }, { status: 400 })
    }

    const resolved = await resolveDonationDoc(id, sourceHint)
    if (!resolved) {
      return NextResponse.json({ success: false, error: 'Donation not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: normalizeDonation(resolved.snap.id, resolved.snap.data() || {}, resolved.source),
    })
  } catch (error) {
    console.error('[admin/donations] GET error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Fetch failed' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing donation id' }, { status: 400 })
    }

    const resolved = await resolveDonationDoc(
      id,
      typeof body.source === 'string' ? body.source : null
    )
    if (!resolved) {
      return NextResponse.json({ success: false, error: 'Donation not found' }, { status: 404 })
    }

    const { ref, source } = resolved

    if (body.action === 'archive') {
      await ref.set(
        {
          status: 'archived',
          archivedAt: FieldValue.serverTimestamp(),
          archivedBy: adminUid,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      return NextResponse.json({ success: true, id, status: 'archived', source })
    }

    const patch: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: adminUid,
    }

    const stringFields = [
      'donorName',
      'donorEmail',
      'type',
      'purpose',
      'notes',
      'paymentMethod',
      'targetCase',
    ] as const
    for (const key of stringFields) {
      if (typeof body[key] === 'string') {
        patch[key] = body[key].trim()
      }
    }

    // Keep email aliases in sync for donationSubmissions docs.
    if (typeof body.donorEmail === 'string') {
      patch.email = body.donorEmail.trim()
    } else if (typeof body.email === 'string') {
      patch.email = body.email.trim()
      patch.donorEmail = body.email.trim()
    }

    if (body.amount !== undefined && body.amount !== null && body.amount !== '') {
      const amount = Number(body.amount)
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
      }
      patch.amount = amount
    }

    if (typeof body.status === 'string' && body.status.trim()) {
      const status = body.status.trim()
      if (!ALLOWED_STATUSES.has(status)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
      }
      // Map UI-friendly values back to submission statuses when needed.
      if (source === 'donationSubmissions') {
        if (status === 'pending') patch.status = 'pending_verification'
        else if (status === 'completed') patch.status = 'verified'
        else patch.status = status
      } else {
        patch.status = status
      }
    }

    await ref.set(patch, { merge: true })
    return NextResponse.json({ success: true, id, source })
  } catch (error) {
    console.error('[admin/donations] PATCH error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const idFromBody = typeof body.id === 'string' ? body.id.trim() : ''
    const idFromQuery = request.nextUrl.searchParams.get('id')?.trim() || ''
    const id = idFromBody || idFromQuery
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing donation id' }, { status: 400 })
    }

    const resolved = await resolveDonationDoc(
      id,
      typeof body.source === 'string' ? body.source : request.nextUrl.searchParams.get('source')
    )
    if (!resolved) {
      return NextResponse.json({ success: false, error: 'Donation not found' }, { status: 404 })
    }

    await resolved.ref.delete()
    return NextResponse.json({
      success: true,
      id,
      deletedBy: adminUid,
      source: resolved.source,
    })
  } catch (error) {
    console.error('[admin/donations] DELETE error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
