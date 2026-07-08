import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { auditAdminApiAction } from '@/lib/audit-api-helper'

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const uid = await verifyIdToken(token)
  if (!uid) return null
  const ok = await isAdminUser(uid)
  return ok ? uid : null
}

/**
 * Verify / reject / request-info on donationSubmissions.
 * Verify uses a Firestore transaction to increment charityCases.amountRaised.
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

    async function notifyDonor(userId: string, title: string, bodyText: string) {
      if (!userId) return
      try {
        await db.collection('users').doc(userId).collection('notifications').add(
          sanitizeForFirestore({
            type: 'donation_resubmission',
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

    if (action === 'reject') {
      await submissionRef.update(
        sanitizeForFirestore({
          status: 'rejected',
          rejectionReason: reason || 'No reason provided',
          rejectedAt: FieldValue.serverTimestamp(),
          rejectedBy: adminUid,
          updatedAt: FieldValue.serverTimestamp(),
        })
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
      const snap = await submissionRef.get()
      const data = snap.data() || {}
      const userId = data.userId ? String(data.userId) : ''
      const note =
        message || reason || 'Please resubmit your donation proof with clearer information.'

      await submissionRef.update(
        sanitizeForFirestore({
          // Part 13A uses resubmission_requested; Part 7B also treats more_info_* as pending
          status:
            action === 'request_resubmission' ? 'resubmission_requested' : 'more_info_requested',
          infoRequestMessage: note,
          infoRequestedAt: FieldValue.serverTimestamp(),
          infoRequestedBy: adminUid,
          updatedAt: FieldValue.serverTimestamp(),
        })
      )

      await notifyDonor(
        userId,
        'Donation proof — resubmission requested',
        note
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
      await db.runTransaction(async (tx) => {
        // All reads must complete before any writes (Firestore transaction rule)
        const snap = await tx.get(submissionRef)
        if (!snap.exists) throw new Error('Submission not found')
        const data = snap.data() || {}
        const status = String(data.status || '')
        if (status === 'confirmed' || status === 'verified') {
          throw new Error('Already verified')
        }
        if (status === 'rejected') {
          throw new Error('Cannot verify a rejected submission')
        }

        const amount = Number(data.amount) || 0
        const causeId = data.causeId ? String(data.causeId) : ''
        const userId = data.userId ? String(data.userId) : ''

        const causeRef = causeId ? db.collection('charityCases').doc(causeId) : null
        const legacyCauseRef = causeId ? db.collection('causes').doc(causeId) : null
        const userRef = userId ? db.collection('users').doc(userId) : null
        const causeSnap = causeRef ? await tx.get(causeRef) : null
        const legacyCauseSnap = legacyCauseRef ? await tx.get(legacyCauseRef) : null
        const userSnap = userRef ? await tx.get(userRef) : null

        tx.update(
          submissionRef,
          sanitizeForFirestore({
            // Part 13A canonical status; Part 7B UI already accepts "verified"
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

      // Optional receipt generation (non-blocking for verification success)
      try {
        const origin = request.nextUrl.origin
        await fetch(`${origin}/api/donations/generate-receipt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ donationId: submissionId }),
        })
      } catch {
        /* receipt is best-effort */
      }

      await auditAdminApiAction(request, adminUid, {
        actionType: 'approve',
        action: `Verified donation submission ${submissionId}`,
        entityType: 'donation',
        entityId: submissionId,
        status: 'success',
      })

      return NextResponse.json({ success: true })
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
