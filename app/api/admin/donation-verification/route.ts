import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { auditAdminApiAction } from '@/lib/audit-api-helper'
import { generateDonationReceipt } from '@/lib/pdf-receipt-generator'
import { uploadBufferToPath } from '@/lib/storage-server'

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const uid = await verifyIdToken(token)
  if (!uid) return null
  const ok = await isAdminUser(uid)
  return ok ? uid : null
}

async function notifyDonor(
  db: Firestore,
  userId: string,
  title: string,
  bodyText: string,
  submissionId: string,
  type = 'donation_update'
) {
  if (!userId) return
  try {
    await db.collection('users').doc(userId).collection('notifications').add(
      sanitizeForFirestore({
        type,
        title,
        message: bodyText,
        submissionId,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      })
    )
  } catch (err) {
    console.warn('[donation-verification] donor notify failed:', err)
  }
}

async function generateAndStoreReceipt(
  db: Firestore,
  submissionId: string,
  data: Record<string, unknown>
): Promise<string | null> {
  try {
    const causeId = data.causeId ? String(data.causeId) : ''
    let cause: Record<string, unknown> = {}
    if (causeId) {
      const caseSnap = await db.collection('charityCases').doc(causeId).get()
      if (caseSnap.exists) cause = caseSnap.data() || {}
      else {
        const legacy = await db.collection('causes').doc(causeId).get()
        if (legacy.exists) cause = legacy.data() || {}
      }
    }

    const partnerId = data.partnerId ? String(data.partnerId) : ''
    let partner: Record<string, unknown> = {}
    if (partnerId) {
      const partnerSnap = await db.collection('charityPartners').doc(partnerId).get()
      if (partnerSnap.exists) partner = partnerSnap.data() || {}
    }

    const verifiedAt = data.verifiedAt || new Date()
    const receiptBuffer = await generateDonationReceipt({
      donationId: submissionId,
      donorName: String(data.donorName || 'Valued Donor'),
      donorEmail: String(data.donorEmail || 'donor@example.com'),
      amount: Number(data.amount) || 0,
      currency: 'AED',
      causeName: String(cause.title || cause.name || data.causeName || 'Cause'),
      category: String(
        data.donationType
          ? String(data.donationType).charAt(0).toUpperCase() + String(data.donationType).slice(1)
          : cause.category || 'General'
      ),
      partnerName: String(partner.name || data.partnerName || 'Partner'),
      referenceNumber: String(data.referenceNumber || ''),
      verificationDate: verifiedAt as never,
      notes: data.notes ? String(data.notes) : undefined,
      organizationName: 'Passive Blessings',
    })

    const timestamp = Date.now()
    const path = `receipts/donation_${submissionId}_${timestamp}.pdf`
    const result = await uploadBufferToPath(receiptBuffer, 'application/pdf', path, {
      donationId: submissionId,
      donorEmail: String(data.donorEmail || ''),
    })

    await db.collection('donationSubmissions').doc(submissionId).update(
      sanitizeForFirestore({
        receiptURL: result.url,
        receiptGeneratedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    )

    return result.url
  } catch (err) {
    console.warn('[donation-verification] receipt generation failed:', err)
    return null
  }
}

/**
 * Verify / reject / request-info on donationSubmissions.
 */
export async function POST(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { submissionId, action, reason, message } = body as {
      submissionId?: string
      action?: 'verify' | 'reject' | 'request_info' | 'request_resubmission'
      reason?: string
      message?: string
    }

    if (!submissionId || !action) {
      return NextResponse.json(
        { success: false, error: 'submissionId and action required' },
        { status: 400 }
      )
    }

    const db = getAdminDb()
    const submissionRef = db.collection('donationSubmissions').doc(submissionId)

    if (action === 'reject') {
      const snap = await submissionRef.get()
      const data = snap.data() || {}
      await submissionRef.update(
        sanitizeForFirestore({
          status: 'rejected',
          rejectionReason: reason || 'No reason provided',
          rejectedAt: FieldValue.serverTimestamp(),
          rejectedBy: adminUid,
          updatedAt: FieldValue.serverTimestamp(),
        })
      )
      await notifyDonor(
        db,
        String(data.userId || ''),
        'Donation proof rejected',
        reason || 'Your donation proof was rejected. Please contact support if you need help.',
        submissionId,
        'donation_rejected'
      )
      await auditAdminApiAction(request, adminUid, {
        actionType: 'reject',
        action: `Rejected donation submission ${submissionId}`,
        entityType: 'donation',
        entityId: submissionId,
        status: 'success',
        details: reason || '',
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'request_info' || action === 'request_resubmission') {
      const snap = await submissionRef.get()
      const data = snap.data() || {}
      const userId = data.userId ? String(data.userId) : ''
      const note =
        message || reason || 'Please resubmit your donation proof with clearer information.'

      await submissionRef.update(
        sanitizeForFirestore({
          status:
            action === 'request_resubmission' ? 'resubmission_requested' : 'more_info_requested',
          infoRequestMessage: note,
          infoRequestedAt: FieldValue.serverTimestamp(),
          infoRequestedBy: adminUid,
          updatedAt: FieldValue.serverTimestamp(),
        })
      )

      await notifyDonor(
        db,
        userId,
        'Donation proof — resubmission requested',
        note,
        submissionId,
        'donation_resubmission'
      )
      await auditAdminApiAction(request, adminUid, {
        actionType: 'update',
        action: `Donation submission ${action}: ${submissionId}`,
        entityType: 'donation',
        entityId: submissionId,
        status: 'success',
        details: note,
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'verify') {
      let verifiedData: Record<string, unknown> = {}
      let userId = ''

      await db.runTransaction(async (tx) => {
        const snap = await tx.get(submissionRef)
        if (!snap.exists) throw new Error('Submission not found')
        const data = snap.data() || {}
        verifiedData = data
        const status = String(data.status || '')
        if (status === 'confirmed' || status === 'verified') {
          throw new Error('Already verified')
        }
        if (status === 'rejected') {
          throw new Error('Cannot verify a rejected submission')
        }

        const amount = Number(data.amount) || 0
        const causeId = data.causeId ? String(data.causeId) : ''
        userId = data.userId ? String(data.userId) : ''

        const causeRef = causeId ? db.collection('charityCases').doc(causeId) : null
        const legacyCauseRef = causeId ? db.collection('causes').doc(causeId) : null
        const userRef = userId ? db.collection('users').doc(userId) : null
        const causeSnap = causeRef ? await tx.get(causeRef) : null
        const legacyCauseSnap = legacyCauseRef ? await tx.get(legacyCauseRef) : null
        const userSnap = userRef ? await tx.get(userRef) : null

        tx.update(
          submissionRef,
          sanitizeForFirestore({
            status: 'verified',
            verifiedAt: FieldValue.serverTimestamp(),
            verifiedBy: adminUid,
            updatedAt: FieldValue.serverTimestamp(),
          })
        )

        if (causeRef && causeSnap?.exists && amount > 0) {
          tx.update(causeRef, {
            amountRaised: FieldValue.increment(amount),
            currentAmount: FieldValue.increment(amount),
            updatedAt: FieldValue.serverTimestamp(),
          })
        } else if (legacyCauseRef && legacyCauseSnap?.exists && amount > 0) {
          tx.update(legacyCauseRef, {
            amountRaised: FieldValue.increment(amount),
            currentAmount: FieldValue.increment(amount),
            updatedAt: FieldValue.serverTimestamp(),
          })
        }

        if (userRef && userSnap?.exists && amount > 0) {
          tx.update(userRef, {
            totalDonations: FieldValue.increment(amount),
            lastDonationDate: FieldValue.serverTimestamp(),
          })
        }
      })

      const receiptURL = await generateAndStoreReceipt(db, submissionId, {
        ...verifiedData,
        verifiedAt: new Date(),
      })

      await notifyDonor(
        db,
        userId,
        'Donation verified',
        receiptURL
          ? 'Your donation was verified. Your receipt is ready on your donations dashboard.'
          : 'Your donation was verified. Thank you for your support.',
        submissionId,
        'donation_verified'
      )

      await auditAdminApiAction(request, adminUid, {
        actionType: 'approve',
        action: `Verified donation submission ${submissionId}`,
        entityType: 'donation',
        entityId: submissionId,
        status: 'success',
      })

      return NextResponse.json({ success: true, receiptURL })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[donation-verification]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      },
      { status: 500 }
    )
  }
}
