'use client'

import React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { REFERRAL_COOKIE_NAME, DEFAULT_REFERRALS_CONFIG } from '@/lib/referral-config'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string, days: number) {
  const maxAge = Math.max(1, Math.floor(days * 24 * 60 * 60))
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${
    secure ? '; Secure' : ''
  }`
}

/**
 * Global first-touch referral capture: ?ref={code} → pb_referral_code cookie.
 * Mounted once under Providers; does not overwrite an existing cookie.
 */
function ReferralAttributionInner() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const ran = React.useRef<string | null>(null)

  React.useEffect(() => {
    const code = (searchParams.get('ref') || '').trim()
    if (!code) return
    if (ran.current === code) return
    ran.current = code

    const stripRefParam = () => {
      try {
        const params = new URLSearchParams(searchParams.toString())
        if (!params.has('ref')) return
        params.delete('ref')
        const qs = params.toString()
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
      } catch {
        /* ignore */
      }
    }

    // First-touch: never overwrite a valid existing cookie
    const existing = getCookie(REFERRAL_COOKIE_NAME)
    if (existing) {
      stripRefParam()
      return
    }

    void (async () => {
      try {
        const res = await fetch(`/api/referral/validate?code=${encodeURIComponent(code)}`)
        const json = await res.json()
        if (json?.valid) {
          const days =
            typeof json.attributionWindowDays === 'number'
              ? json.attributionWindowDays
              : DEFAULT_REFERRALS_CONFIG.attributionWindowDays
          setCookie(REFERRAL_COOKIE_NAME, code, days)
        }
      } catch (err) {
        console.warn('[referral] attribution capture failed:', err)
      } finally {
        stripRefParam()
      }
    })()
  }, [searchParams, pathname, router])

  return null
}

export function ReferralAttributionCapture() {
  return (
    <React.Suspense fallback={null}>
      <ReferralAttributionInner />
    </React.Suspense>
  )
}
