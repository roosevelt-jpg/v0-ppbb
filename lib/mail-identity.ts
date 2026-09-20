/**
 * Canonical mail identity for Passive Blessings.
 * All outbound mail should use the live brand domain so SPF/DKIM/DMARC align.
 */

export const MAIL_BRAND_DOMAIN = 'passive-blessings.com'

/** Default From for transactional + marketing mail (must be authenticated in SendGrid). */
export const DEFAULT_MAIL_FROM = `noreply@${MAIL_BRAND_DOMAIN}`

/** Monitored Reply-To for member replies. */
export const DEFAULT_MAIL_REPLY_TO = `support@${MAIL_BRAND_DOMAIN}`

export const DEFAULT_MAIL_FROM_NAME = 'Passive Blessings'

/** Postal line shown in email footers (helps inbox placement / trust). */
export const MAIL_PHYSICAL_ADDRESS = 'Dubai, United Arab Emirates'

const LEGACY_MAIL_HOSTS = new Set([
  'passiveblessings.ae',
  'passiveblessing.ae',
  'passiveblessings.com',
  'www.passive-blessings.com',
])

/**
 * Rewrite known legacy / typo hosts onto the live brand domain.
 * Leaves unrelated domains (e.g. verified Google Workspace) unchanged.
 */
export function canonicalizeMailAddress(address: string | null | undefined): string {
  const raw = String(address || '').trim().toLowerCase()
  if (!raw.includes('@')) return DEFAULT_MAIL_FROM
  const [local, host] = raw.split('@')
  if (!local || !host) return DEFAULT_MAIL_FROM
  if (LEGACY_MAIL_HOSTS.has(host) || host === MAIL_BRAND_DOMAIN) {
    return `${local}@${MAIL_BRAND_DOMAIN}`
  }
  return `${local}@${host}`
}

export function isConsumerGmailAddress(address: string | null | undefined): boolean {
  const host = String(address || '')
    .trim()
    .toLowerCase()
    .split('@')[1]
  return host === 'gmail.com' || host === 'googlemail.com'
}
