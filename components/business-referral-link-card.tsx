'use client'

import React from 'react'
import { Copy, Check, Link2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

/**
 * Business dashboard referral link card — shares site/?ref={referralCode}.
 */
export function BusinessReferralLinkCard() {
  const { user } = useAuth()
  const [referralCode, setReferralCode] = React.useState<string | null>(null)
  const [ready, setReady] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!user?.id) return
    const unsub = onSnapshot(
      doc(db, 'businesses', user.id),
      (snap) => {
        if (!snap.exists()) {
          setReferralCode(null)
        } else {
          const code = snap.data()?.referralCode
          setReferralCode(typeof code === 'string' && code.trim() ? code.trim() : null)
        }
        setReady(true)
      },
      () => setReady(true)
    )
    return () => unsub()
  }, [user?.id])

  const siteURL =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')) ||
    (typeof window !== 'undefined' ? window.location.origin : '')

  const link = referralCode && siteURL ? `${siteURL}/?ref=${referralCode}` : null

  const copy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  if (!ready) {
    return (
      <div className="rounded-lg border border-[#e4e1da] bg-white p-4 sm:p-6 animate-pulse">
        <div className="h-4 w-32 bg-neutral-100 rounded mb-3" />
        <div className="h-10 w-full bg-neutral-100 rounded" />
      </div>
    )
  }

  if (!referralCode) {
    return (
      <div className="rounded-lg border border-[#e4e1da] bg-white p-4 sm:p-6">
        <p
          className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Referrals
        </p>
        <h3
          className="text-xl text-neutral-900 mb-2"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          Your referral link
        </h3>
        <p className="text-sm text-neutral-600" style={{ fontFamily: 'Inter, sans-serif' }}>
          Your referral link will appear here after your business listing is approved.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[#e4e1da] bg-white p-4 sm:p-6 space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
          <Link2 className="w-5 h-5 text-neutral-700" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Referrals
          </p>
          <h3
            className="text-xl text-neutral-900"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Your referral link
          </h3>
        </div>
      </div>
      <p className="text-sm text-neutral-600 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
        Share this link. When people join or purchase through it, a portion of that revenue
        supports Passive Blessings.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          readOnly
          value={link || ''}
          className="flex-1 min-w-0 border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm bg-neutral-50"
          style={{ fontFamily: 'Inter, sans-serif' }}
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 bg-black text-white rounded text-sm font-semibold hover:bg-neutral-900 shrink-0"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
      <p className="text-xs text-neutral-500" style={{ fontFamily: 'Inter, sans-serif' }}>
        Code: <span className="font-mono text-neutral-800">{referralCode}</span>
      </p>
    </div>
  )
}
