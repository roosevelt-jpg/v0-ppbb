import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import type { ReferralConversionDoc } from '@/lib/referral-config'
import {
  getUserReferralAttribution,
  resolveBusinessFromReferralCode,
} from '@/lib/referral-attribution-server'

export type RecordReferralConversionParams = {
  convertedUserId: string
  conversionType: ReferralConversionDoc['conversionType']
  relatedDocId: string
  revenueAmount: number
  referralCode?: string
  /** Defaults to confirmed when revenue is captured at payment time. */
  status?: ReferralConversionDoc['status']
  idempotencyKey: string
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

function businessRecordStatus(
  status: ReferralConversionDoc['status']
): 'pending' | 'converted' | 'failed' {
  if (status === 'paid' || status === 'confirmed') return 'converted'
  if (status === 'pending') return 'pending'
  return 'pending'
}

export async function recordReferralConversion(
  params: RecordReferralConversionParams
): Promise<{ recorded: boolean; referralId?: string; reason?: string }> {
  const revenueAmount = roundMoney(Number(params.revenueAmount) || 0)
  if (revenueAmount <= 0) {
    return { recorded: false, reason: 'no_revenue' }
  }

  const convertedUserId = String(params.convertedUserId || '').trim()
  const relatedDocId = String(params.relatedDocId || '').trim()
  const idempotencyKey = String(params.idempotencyKey || '').trim()
  if (!convertedUserId || !relatedDocId || !idempotencyKey) {
    return { recorded: false, reason: 'missing_fields' }
  }

  const db = getAdminDb()
  const idemRef = db.collection('referralConversionKeys').doc(idempotencyKey)
  const idemSnap = await idemRef.get()
  if (idemSnap.exists) {
    return {
      recorded: false,
      referralId: String(idemSnap.data()?.referralId || ''),
      reason: 'duplicate',
    }
  }

  let businessId = ''
  let referralCode = String(params.referralCode || '').trim()
  let contributionPercent = 0

  if (referralCode) {
    const resolved = await resolveBusinessFromReferralCode(db, referralCode)
    if (!resolved) return { recorded: false, reason: 'invalid_code' }
    businessId = resolved.businessId
    referralCode = resolved.referralCode
    contributionPercent = resolved.contributionPercent
  } else {
    const attribution = await getUserReferralAttribution(convertedUserId)
    if (!attribution) return { recorded: false, reason: 'no_attribution' }
    businessId = attribution.businessId
    referralCode = attribution.referralCode
    const resolved = await resolveBusinessFromReferralCode(db, referralCode)
    contributionPercent = resolved?.contributionPercent ?? 10
  }

  if (businessId === convertedUserId) {
    return { recorded: false, reason: 'self_referral' }
  }

  const contributionAmount = roundMoney((revenueAmount * contributionPercent) / 100)
  const status: ReferralConversionDoc['status'] =
    params.status || (params.conversionType === 'event' ? 'pending' : 'confirmed')

  const userSnap = await db.collection('users').doc(convertedUserId).get()
  const userData = userSnap.data() || {}
  const referredUserName =
    `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
    String(userData.displayName || 'Member')
  const referredUserEmail = String(userData.email || '')

  const referralRef = db.collection('referrals').doc()
  const payload = sanitizeForFirestore({
    businessId,
    referrerId: businessId,
    referralCode,
    conversionType: params.conversionType,
    convertedUserId,
    referredUserId: convertedUserId,
    referredUserName,
    referredUserEmail,
    relatedDocId,
    revenueAmount,
    contributionPercent,
    contributionAmount,
    amount: revenueAmount,
    commissionPercent: contributionPercent,
    status,
    businessStatus: businessRecordStatus(status),
    settled: status === 'paid',
    referredAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    idempotencyKey,
  })

  const batch = db.batch()
  batch.set(referralRef, payload)
  batch.set(
    idemRef,
    sanitizeForFirestore({
      referralId: referralRef.id,
      conversionType: params.conversionType,
      relatedDocId,
      convertedUserId,
      businessId,
      createdAt: FieldValue.serverTimestamp(),
    })
  )
  await batch.commit()

  try {
    await db
      .collection('businesses')
      .doc(businessId)
      .set(
        sanitizeForFirestore({
          referralConversionCount: FieldValue.increment(1),
          referralRevenueTotal: FieldValue.increment(revenueAmount),
          updatedAt: FieldValue.serverTimestamp(),
        }),
        { merge: true }
      )
  } catch {
    /* non-fatal */
  }

  return { recorded: true, referralId: referralRef.id }
}

export async function confirmReferralConversion(
  idempotencyKey: string
): Promise<{ updated: boolean }> {
  const key = String(idempotencyKey || '').trim()
  if (!key) return { updated: false }

  const db = getAdminDb()
  const idemSnap = await db.collection('referralConversionKeys').doc(key).get()
  if (!idemSnap.exists) return { updated: false }

  const referralId = String(idemSnap.data()?.referralId || '').trim()
  if (!referralId) return { updated: false }

  const ref = db.collection('referrals').doc(referralId)
  const snap = await ref.get()
  if (!snap.exists) return { updated: false }
  if (snap.data()?.status === 'confirmed' || snap.data()?.status === 'paid') {
    return { updated: false }
  }

  await ref.update(
    sanitizeForFirestore({
      status: 'confirmed',
      businessStatus: 'converted',
      confirmedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  )

  return { updated: true }
}
