import type { NextRequest } from 'next/server'
import { REFERRAL_COOKIE_NAME } from '@/lib/referral-config'

export function getReferralCodeFromRequest(request: NextRequest): string | null {
  const raw = request.cookies.get(REFERRAL_COOKIE_NAME)?.value
  const code = raw ? decodeURIComponent(raw).trim() : ''
  return code || null
}

export function getReferralCodeFromDocument(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${REFERRAL_COOKIE_NAME}=([^;]*)`)
  )
  return match ? decodeURIComponent(match[1]).trim() : null
}
