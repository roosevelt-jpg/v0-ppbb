/** Door QR payload. A phone camera opens this URL; the token is also accepted raw. */

export function publicSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || ''
  const base = fromEnv.replace(/\/$/, '')
  if (base) return base
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin
  return 'https://www.passive-blessings.com'
}

export function eventDoorScanUrl(token: string): string {
  return `${publicSiteOrigin()}/admin/scan?t=${encodeURIComponent(token)}`
}

export function parseDoorScanToken(raw: string): string {
  const value = String(raw || '').trim()
  if (!value) return ''
  try {
    const url = new URL(value)
    const fromQuery = url.searchParams.get('t') || url.searchParams.get('token')
    if (fromQuery) return fromQuery.trim()
  } catch {
    /* not a URL */
  }
  return value
}
