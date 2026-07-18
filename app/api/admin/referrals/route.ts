import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { auditAdminApiAction } from '@/lib/audit-api-helper'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

async function requireAdmin(request: NextRequest): Promise<string | null> {
  return requireAdminFromRequest(request)
}

async function bulkUpdateReferralStatus(
  businessId: string,
  fromStatus: string,
  toStatus: string,
  adminUid: string,
  extra: Record<string, unknown> = {}
) {
  const db = getAdminDb()
  const snap = await db
    .collection('referrals')
    .where('businessId', '==', businessId)
    .where('status', '==', fromStatus)
    .get()

  if (snap.empty) return 0

  const batchSize = 400
  let updated = 0
  let batch = db.batch()
  let ops = 0

  for (const docSnap of snap.docs) {
    batch.update(
      docSnap.ref,
      sanitizeForFirestore({
        status: toStatus,
        businessStatus: toStatus === 'confirmed' || toStatus === 'paid' ? 'converted' : 'pending',
        settled: toStatus === 'paid',
        ...extra,
        updatedAt: FieldValue.serverTimestamp(),
      })
    )
    ops += 1
    updated += 1
    if (ops >= batchSize) {
      await batch.commit()
      batch = db.batch()
      ops = 0
    }
  }

  if (ops > 0) await batch.commit()
  return updated
}

/**
 * Admin referral finance actions: confirm pending (e.g. paid events) or mark confirmed as paid.
 */
export async function POST(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as {
      action?: string
      businessId?: string
    }

    const businessId = typeof body.businessId === 'string' ? body.businessId.trim() : ''
    if (!businessId) {
      return NextResponse.json({ success: false, error: 'businessId required' }, { status: 400 })
    }

    if (body.action === 'confirm_pending') {
      const confirmed = await bulkUpdateReferralStatus(businessId, 'pending', 'confirmed', adminUid, {
        confirmedAt: FieldValue.serverTimestamp(),
        confirmedBy: adminUid,
      })

      if (confirmed === 0) {
        return NextResponse.json({
          success: false,
          error: 'No pending referrals to confirm for this business.',
          confirmed: 0,
        })
      }

      await auditAdminApiAction(request, adminUid, {
        actionType: 'update',
        action: `Confirmed ${confirmed} pending referral contribution(s)`,
        entityType: 'business',
        entityId: businessId,
        entityName: businessId,
        status: 'success',
        details: `${confirmed} referral(s) pending → confirmed`,
      })

      return NextResponse.json({ success: true, confirmed })
    }

    if (body.action !== 'mark_paid') {
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }

    const marked = await bulkUpdateReferralStatus(businessId, 'confirmed', 'paid', adminUid, {
      paidAt: FieldValue.serverTimestamp(),
      paidBy: adminUid,
    })

    if (marked === 0) {
      const db = getAdminDb()
      const pendingSnap = await db
        .collection('referrals')
        .where('businessId', '==', businessId)
        .where('status', '==', 'pending')
        .limit(1)
        .get()

      return NextResponse.json({
        success: false,
        error: pendingSnap.empty
          ? 'No confirmed contributions to mark as paid for this business.'
          : 'No confirmed contributions to mark as paid. Confirm pending event referrals after payment first.',
        marked: 0,
        gap: !pendingSnap.empty,
      })
    }

    await auditAdminApiAction(request, adminUid, {
      actionType: 'update',
      action: `Marked ${marked} referral contribution(s) as paid`,
      entityType: 'business',
      entityId: businessId,
      entityName: businessId,
      status: 'success',
      details: `${marked} referral(s) updated to paid`,
    })

    return NextResponse.json({ success: true, marked })
  } catch (error) {
    console.error('[api/admin/referrals]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
