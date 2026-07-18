import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

export const MEMBERSHIP_PROMO_COLLECTION = 'membershipPromoCodes'

export type MembershipPromoType = 'free_access' | 'percent_off'
export type MembershipPromoStatus = 'active' | 'paused' | 'exhausted' | 'expired'

export type MembershipPromoCode = {
  id: string
  code: string
  label: string
  description: string
  scope: 'membership'
  type: MembershipPromoType
  percentOff: number
  planId: string
  planName: string
  benefitDurationMonths: number
  maxRedemptions: number | null
  usedCount: number
  codeExpiresAt: Date | null
  status: MembershipPromoStatus
  createdBy: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export function normalizePromoCode(value: unknown): string {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

function parseDate(raw: unknown): Date | null {
  if (!raw) return null
  if (typeof (raw as { toDate?: () => Date }).toDate === 'function') {
    return (raw as { toDate: () => Date }).toDate()
  }
  const d = new Date(String(raw))
  return Number.isNaN(d.getTime()) ? null : d
}

/** 0 = lifetime / forever free; otherwise whole months of access (1–12). */
export function normalizeBenefitDurationMonths(value: unknown): number {
  if (value === 'forever' || value === 'lifetime' || value === Infinity) return 0
  const n = Math.floor(Number(value))
  if (!Number.isFinite(n) || n < 0) return 1
  if (n === 0) return 0
  return Math.min(12, Math.max(1, n))
}

export function isLifetimeBenefit(months: number): boolean {
  return months === 0
}

export function formatBenefitDuration(months: number): string {
  if (isLifetimeBenefit(months)) return 'Forever'
  return `${months} month${months === 1 ? '' : 's'}`
}

export function mapPromoDoc(id: string, data: Record<string, unknown>): MembershipPromoCode {
  const type = data.type === 'percent_off' ? 'percent_off' : 'free_access'
  const percentOff =
    type === 'free_access'
      ? 100
      : Math.min(100, Math.max(0, Number(data.percentOff) || 0))
  const maxRaw = data.maxRedemptions
  const maxRedemptions =
    maxRaw === null || maxRaw === undefined || maxRaw === ''
      ? null
      : Math.max(0, Math.floor(Number(maxRaw)))

  return {
    id,
    code: normalizePromoCode(data.code),
    label: String(data.label || ''),
    description: String(data.description || ''),
    scope: 'membership',
    type,
    percentOff,
    planId: String(data.planId || ''),
    planName: String(data.planName || ''),
    benefitDurationMonths: normalizeBenefitDurationMonths(data.benefitDurationMonths),
    maxRedemptions: Number.isFinite(maxRedemptions as number) ? maxRedemptions : null,
    usedCount: Math.max(0, Math.floor(Number(data.usedCount) || 0)),
    codeExpiresAt: parseDate(data.codeExpiresAt),
    status: (['active', 'paused', 'exhausted', 'expired'].includes(String(data.status))
      ? String(data.status)
      : 'active') as MembershipPromoStatus,
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : null,
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
  }
}

export function resolvePromoStatus(promo: MembershipPromoCode, now = new Date()): MembershipPromoStatus {
  if (promo.status === 'paused') return 'paused'
  if (promo.codeExpiresAt && now > promo.codeExpiresAt) return 'expired'
  if (promo.maxRedemptions != null && promo.usedCount >= promo.maxRedemptions) return 'exhausted'
  return 'active'
}

export function promoGrantsFreeAccess(promo: MembershipPromoCode): boolean {
  return promo.type === 'free_access' || promo.percentOff >= 100
}

export async function listMembershipPromoCodes(): Promise<MembershipPromoCode[]> {
  const snap = await getAdminDb().collection(MEMBERSHIP_PROMO_COLLECTION).get()
  return snap.docs
    .map((d) => mapPromoDoc(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
}

export async function findPromoByCode(code: string): Promise<MembershipPromoCode | null> {
  const normalized = normalizePromoCode(code)
  if (!normalized) return null
  const snap = await getAdminDb()
    .collection(MEMBERSHIP_PROMO_COLLECTION)
    .where('code', '==', normalized)
    .limit(1)
    .get()
  if (snap.empty) return null
  return mapPromoDoc(snap.docs[0].id, snap.docs[0].data() as Record<string, unknown>)
}

export type CreateMembershipPromoInput = {
  code: string
  label?: string
  description?: string
  type: MembershipPromoType
  percentOff?: number
  planId: string
  benefitDurationMonths: number
  maxRedemptions?: number | null
  codeExpiresAt?: Date | null
  createdBy: string
}

export async function createMembershipPromoCode(
  input: CreateMembershipPromoInput
): Promise<MembershipPromoCode> {
  const code = normalizePromoCode(input.code)
  if (!code || code.length < 3) {
    throw new Error('Code must be at least 3 characters')
  }
  if (!input.planId) throw new Error('planId is required')

  const existing = await findPromoByCode(code)
  if (existing) throw new Error('A promo code with this value already exists')

  const db = getAdminDb()
  const planSnap = await db.collection('pricingPlans').doc(input.planId).get()
  if (!planSnap.exists) throw new Error('Pricing plan not found')
  const plan = planSnap.data() || {}

  const type = input.type === 'percent_off' ? 'percent_off' : 'free_access'
  const percentOff = type === 'free_access' ? 100 : Math.min(100, Math.max(0, Number(input.percentOff) || 0))
  if (type === 'percent_off' && percentOff <= 0) {
    throw new Error('percentOff must be greater than 0')
  }

  const benefitDurationMonths = normalizeBenefitDurationMonths(input.benefitDurationMonths)
  const maxRedemptions =
    input.maxRedemptions === null || input.maxRedemptions === undefined
      ? null
      : Math.max(1, Math.floor(Number(input.maxRedemptions)))

  const payload = sanitizeForFirestore({
    code,
    label: String(input.label || code).trim(),
    description: String(input.description || '').trim(),
    scope: 'membership',
    type,
    percentOff,
    planId: input.planId,
    planName: String(plan.name || input.planId),
    benefitDurationMonths,
    maxRedemptions,
    usedCount: 0,
    codeExpiresAt: input.codeExpiresAt || null,
    status: 'active',
    createdBy: input.createdBy,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  const ref = await db.collection(MEMBERSHIP_PROMO_COLLECTION).add(payload)
  const created = await ref.get()
  return mapPromoDoc(ref.id, (created.data() || {}) as Record<string, unknown>)
}

export async function updateMembershipPromoCode(
  id: string,
  patch: Partial<{
    label: string
    description: string
    status: MembershipPromoStatus
    codeExpiresAt: Date | null
    maxRedemptions: number | null
    benefitDurationMonths: number
  }>
): Promise<MembershipPromoCode> {
  const db = getAdminDb()
  const ref = db.collection(MEMBERSHIP_PROMO_COLLECTION).doc(id)
  const snap = await ref.get()
  if (!snap.exists) throw new Error('Promo code not found')

  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  }
  if (patch.label !== undefined) updates.label = String(patch.label).trim()
  if (patch.description !== undefined) updates.description = String(patch.description).trim()
  if (patch.status !== undefined) updates.status = patch.status
  if (patch.codeExpiresAt !== undefined) updates.codeExpiresAt = patch.codeExpiresAt
  if (patch.maxRedemptions !== undefined) updates.maxRedemptions = patch.maxRedemptions
  if (patch.benefitDurationMonths !== undefined) {
    updates.benefitDurationMonths = normalizeBenefitDurationMonths(patch.benefitDurationMonths)
  }

  await ref.update(sanitizeForFirestore(updates))
  const next = await ref.get()
  return mapPromoDoc(id, (next.data() || {}) as Record<string, unknown>)
}

export type RedeemMembershipPromoResult = {
  promo: MembershipPromoCode
  planId: string
  planName: string
  membershipUrl: string
  renewDate: string | null
}

/**
 * Atomically redeem a free / 100% membership promo for a signed-in user.
 * MVP: only free_access (or percentOff >= 100) grants immediately.
 */
export async function redeemMembershipPromo(input: {
  userId: string
  code: string
}): Promise<RedeemMembershipPromoResult> {
  const normalized = normalizePromoCode(input.code)
  if (!normalized) throw new Error('Promo code is required')
  if (!input.userId) throw new Error('User is required')

  const db = getAdminDb()
  const userRef = db.collection('users').doc(input.userId)
  const userSnap = await userRef.get()
  if (!userSnap.exists) throw new Error('User profile not found')
  const userData = userSnap.data() || {}

  if (userData.membershipPromoCodeId || userData.promoCodeId) {
    throw new Error('You have already redeemed a membership promo code')
  }

  const codeSnap = await db
    .collection(MEMBERSHIP_PROMO_COLLECTION)
    .where('code', '==', normalized)
    .limit(1)
    .get()
  if (codeSnap.empty) throw new Error('Invalid promo code')

  const promoRef = codeSnap.docs[0].ref
  let grantedPlanId = ''
  let grantedPlanName = ''
  let benefitMonths = 3
  const reserved: { promo: MembershipPromoCode | null; previousUsed: number } = {
    promo: null,
    previousUsed: 0,
  }

  await db.runTransaction(async (tx) => {
    const promoSnap = await tx.get(promoRef)
    const freshUserSnap = await tx.get(userRef)
    if (!promoSnap.exists) throw new Error('Invalid promo code')
    const promo = mapPromoDoc(promoSnap.id, promoSnap.data() as Record<string, unknown>)
    reserved.promo = promo
    reserved.previousUsed = promo.usedCount

    const freshUser = freshUserSnap.data() || {}
    if (freshUser.membershipPromoCodeId || freshUser.promoCodeId) {
      throw new Error('You have already redeemed a membership promo code')
    }

    const status = resolvePromoStatus(promo)
    if (status === 'paused') throw new Error('This promo code is paused')
    if (status === 'expired') throw new Error('This promo code has expired')
    if (status === 'exhausted') throw new Error('This promo code has reached its redemption limit')
    if (status !== 'active') throw new Error('This promo code is not available')

    if (!promoGrantsFreeAccess(promo)) {
      throw new Error('This promo requires checkout and is not supported yet. Use a 100% free code.')
    }
    if (!promo.planId) throw new Error('Promo code is missing a pricing plan')

    grantedPlanId = promo.planId
    grantedPlanName = promo.planName || promo.planId
    benefitMonths = promo.benefitDurationMonths

    const nextUsed = promo.usedCount + 1
    const exhausted = promo.maxRedemptions != null && nextUsed >= promo.maxRedemptions
    tx.update(promoRef, {
      usedCount: nextUsed,
      ...(exhausted ? { status: 'exhausted' } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    })

    tx.set(
      userRef,
      {
        membershipPromoCodeId: promo.id,
        membershipPromoCode: promo.code,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    )
  })

  const redeemedPromo = reserved.promo
  if (!redeemedPromo || !grantedPlanId) {
    throw new Error('Failed to redeem promo code')
  }

  const paymentReference = `promo_${redeemedPromo.id}_${input.userId}_${Date.now()}`
  try {
    const { completeMembershipPayment } = await import('@/lib/payment-completion')
    const result = await completeMembershipPayment({
      userId: input.userId,
      planId: grantedPlanId,
      gateway: 'promo',
      paymentReference,
      amountCents: 0,
      benefitDurationMonths: benefitMonths,
      promoCodeId: redeemedPromo.id,
      promoCode: redeemedPromo.code,
    })

    const renewDate =
      benefitMonths === 0
        ? null
        : (() => {
            const d = new Date()
            d.setMonth(d.getMonth() + benefitMonths)
            return d
          })()

    return {
      promo: redeemedPromo,
      planId: grantedPlanId,
      planName: grantedPlanName,
      membershipUrl: result.membershipUrl,
      renewDate: renewDate ? renewDate.toISOString() : null,
    }
  } catch (err) {
    // Roll back reservation so the user can retry and the code stays usable.
    await Promise.all([
      promoRef.set(
        {
          usedCount: reserved.previousUsed,
          status: 'active',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      ),
      userRef.set(
        {
          membershipPromoCodeId: FieldValue.delete(),
          membershipPromoCode: FieldValue.delete(),
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      ),
    ]).catch((rollbackErr) => {
      console.error('[redeemMembershipPromo] rollback failed', rollbackErr)
    })
    throw err
  }
}
