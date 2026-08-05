import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import {
  HOSTING_BILLED_TO,
  HOSTING_DOC_PATH,
  HOSTING_LINE_ITEMS,
  HOSTING_TOTAL_USD,
  type HostingRecord,
} from '@/lib/hosting-config'

function toIso(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString()
    } catch {
      return null
    }
  }
  if (typeof value === 'string') return value
  return null
}

export function defaultHostingRecord(): HostingRecord {
  return {
    status: 'inactive',
    currency: 'usd',
    amountDueUsd: HOSTING_TOTAL_USD,
    amountPaidUsd: null,
    billedTo: HOSTING_BILLED_TO,
    lineItems: HOSTING_LINE_ITEMS.map((item) => ({ ...item })),
    storageNote: 'Additional cost will be billed monthly for storage used.',
    paidAt: null,
    paymentIntentId: null,
    paidByAdminId: null,
    paidByEmail: null,
    updatedAt: null,
  }
}

export async function getHostingRecord(): Promise<HostingRecord> {
  const db = getAdminDb()
  const snap = await db.collection(HOSTING_DOC_PATH.collection).doc(HOSTING_DOC_PATH.id).get()
  const base = defaultHostingRecord()
  if (!snap.exists) return base
  const data = snap.data() || {}
  return {
    ...base,
    status: data.status === 'active' ? 'active' : 'inactive',
    amountPaidUsd: typeof data.amountPaidUsd === 'number' ? data.amountPaidUsd : null,
    billedTo: typeof data.billedTo === 'string' ? data.billedTo : HOSTING_BILLED_TO,
    paidAt: toIso(data.paidAt),
    paymentIntentId: typeof data.paymentIntentId === 'string' ? data.paymentIntentId : null,
    paidByAdminId: typeof data.paidByAdminId === 'string' ? data.paidByAdminId : null,
    paidByEmail: typeof data.paidByEmail === 'string' ? data.paidByEmail : null,
    updatedAt: toIso(data.updatedAt),
  }
}

export async function ensureHostingDoc(): Promise<HostingRecord> {
  const db = getAdminDb()
  const ref = db.collection(HOSTING_DOC_PATH.collection).doc(HOSTING_DOC_PATH.id)
  const snap = await ref.get()
  if (!snap.exists) {
    const base = defaultHostingRecord()
    await ref.set({
      ...base,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
  return getHostingRecord()
}

export async function markHostingActive(params: {
  paymentIntentId: string
  adminUid: string
  adminEmail: string | null
}): Promise<HostingRecord> {
  const db = getAdminDb()
  await db
    .collection(HOSTING_DOC_PATH.collection)
    .doc(HOSTING_DOC_PATH.id)
    .set(
      {
        status: 'active',
        currency: 'usd',
        amountDueUsd: HOSTING_TOTAL_USD,
        amountPaidUsd: HOSTING_TOTAL_USD,
        billedTo: HOSTING_BILLED_TO,
        lineItems: HOSTING_LINE_ITEMS.map((item) => ({ ...item })),
        storageNote: 'Additional cost will be billed monthly for storage used.',
        paidAt: FieldValue.serverTimestamp(),
        paymentIntentId: params.paymentIntentId,
        paidByAdminId: params.adminUid,
        paidByEmail: params.adminEmail,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  return getHostingRecord()
}
