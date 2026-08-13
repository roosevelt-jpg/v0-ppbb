/** Platform cloud hosting invoice constants (admin Hosting tab). */

export const HOSTING_BILLED_TO = 'Passive Blessings, Dubai, UAE'

export const HOSTING_CREDENTIALS_EMAIL = 'tech.passiveblessings@gmail.com'

/** Billed as $47/mo for a 1-year (12-month) term. */
export const HOSTING_MONTHLY_USD = 47
export const HOSTING_PERIOD_MONTHS = 12
export const HOSTING_PERIOD_LABEL = '12 months'
export const HOSTING_PLAN_NAME = 'AWS Cloud Hosting'

export const HOSTING_LINE_ITEMS = [
  {
    id: 'cloud_os',
    label: 'Cloud OS',
    detail: `${HOSTING_PERIOD_LABEL} · $${HOSTING_MONTHLY_USD}/mo`,
    amountUsd: HOSTING_MONTHLY_USD * HOSTING_PERIOD_MONTHS,
  },
  {
    id: 'ssl',
    label: 'SSL',
    detail: '1yr',
    amountUsd: 120,
  },
  {
    id: 'storage_bucket',
    label: 'Storage bucket',
    detail: 'Included for term',
    amountUsd: 80,
  },
] as const

export const HOSTING_TOTAL_USD = HOSTING_LINE_ITEMS.reduce((sum, item) => sum + item.amountUsd, 0)

export const HOSTING_DOC_PATH = {
  collection: 'platformConfig',
  id: 'hosting',
} as const

export type HostingStatus = 'inactive' | 'active'

export type HostingRecord = {
  status: HostingStatus
  currency: 'usd'
  amountDueUsd: number
  amountPaidUsd: number | null
  billedTo: string
  lineItems: { id: string; label: string; amountUsd: number; detail?: string }[]
  storageNote: string
  paidAt: string | null
  paymentIntentId: string | null
  /** Open PaymentIntent awaiting card confirmation (avoids Incomplete duplicates). */
  pendingPaymentIntentId: string | null
  paidByAdminId: string | null
  paidByEmail: string | null
  updatedAt: string | null
}
