/** Platform cloud hosting invoice constants (admin Hosting tab). */

export const HOSTING_BILLED_TO = 'Passive Blessings, Dubai, UAE'

export const HOSTING_CREDENTIALS_EMAIL = 'tech.passiveblessings@gmail.com'

export const HOSTING_LINE_ITEMS = [
  { id: 'cloud_os', label: 'Cloud OS', amountUsd: 560 },
  { id: 'ssl', label: 'SSL', amountUsd: 120 },
  { id: 'storage_bucket', label: 'Storage bucket', amountUsd: 80 },
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
  lineItems: { id: string; label: string; amountUsd: number }[]
  storageNote: string
  paidAt: string | null
  paymentIntentId: string | null
  paidByAdminId: string | null
  paidByEmail: string | null
  updatedAt: string | null
}
