'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { logoutUser } from '@/lib/auth'
import { getUserPhone, isValidPhone } from '@/lib/user-profile'

const EXEMPT_PATH_PREFIXES = [
  '/signup',
  '/login',
  '/admin/login',
  '/admin/setup',
  '/forgot-password',
  '/legal',
  '/policies',
  '/privacy',
  '/terms',
]

function isValidEmail(value: unknown): boolean {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function accountPhone(user: Record<string, unknown>): string {
  const candidates = [
    getUserPhone(user as Parameters<typeof getUserPhone>[0]),
    user.businessPhone,
    user.sponsorPhone,
  ]
  for (const value of candidates) {
    if (isValidPhone(value)) return String(value).trim()
  }
  return ''
}

/**
 * Phone and email are mandatory for every account. Accounts created through
 * Google / Facebook sign-in, or before the rule existed, must add them before
 * using the site.
 */
export function RequiredContactGate() {
  const { user, loading } = useAuth()
  const pathname = usePathname() || '/'
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  const exempt = EXEMPT_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const profile = user as unknown as Record<string, unknown> | null
  const missingPhone = Boolean(profile) && !accountPhone(profile!)
  const missingEmail = Boolean(user) && !isValidEmail(user?.email)

  React.useEffect(() => {
    if (!user) return
    setPhone((prev) => prev || getUserPhone(user) || '')
    setEmail((prev) => prev || user.email || '')
  }, [user])

  if (loading || !user || exempt || (!missingPhone && !missingEmail)) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const nextPhone = phone.trim()
    const nextEmail = email.trim().toLowerCase()
    if (missingPhone && !isValidPhone(nextPhone)) {
      setError('Enter a valid phone number (8–15 digits, include your country code).')
      return
    }
    if (missingEmail && !isValidEmail(nextEmail)) {
      setError('Enter a valid email address.')
      return
    }
    setSaving(true)
    try {
      const update: Record<string, string | ReturnType<typeof serverTimestamp>> = {
        updatedAt: serverTimestamp(),
      }
      if (missingPhone) {
        update.phone = nextPhone
        if (!user.whatsappNumber) update.whatsappNumber = nextPhone
      }
      if (missingEmail) update.email = nextEmail
      // The live profile listener in auth-context hides this prompt once saved.
      await updateDoc(doc(db, 'users', user.id), update)
    } catch (err) {
      console.error('[required-contact-gate]', err)
      setError('Could not save your details. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const title =
    missingPhone && missingEmail
      ? 'Add your phone number and email'
      : missingPhone
        ? 'Add your phone number'
        : 'Add your email address'

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="required-contact-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4 text-neutral-900"
      >
        <div>
          <h2 id="required-contact-title" className="text-lg font-semibold">
            {title}
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            A phone number and email address are required for every Passive Blessings account,
            so we can reach you about events, payments and your membership.
          </p>
        </div>

        {missingPhone && (
          <div>
            <label htmlFor="required-contact-phone" className="block text-xs font-semibold mb-1.5">
              Phone number *
            </label>
            <input
              id="required-contact-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971 50 123 4567"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
            />
          </div>
        )}

        {missingEmail && (
          <div>
            <label htmlFor="required-contact-email" className="block text-xs font-semibold mb-1.5">
              Email address *
            </label>
            <input
              id="required-contact-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
            />
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save and continue'}
        </button>
        <button
          type="button"
          onClick={() => void logoutUser()}
          className="w-full text-sm text-neutral-600 underline"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
