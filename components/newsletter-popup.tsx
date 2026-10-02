'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/firebase'

const DISMISS_KEY = 'pb-newsletter-dismissed-until'
const EMAIL_KEY = 'pb-newsletter-email'

function dismissed(): boolean {
  try {
    const until = Number(localStorage.getItem(DISMISS_KEY) || '0')
    if (until > Date.now()) return true
    return Boolean(localStorage.getItem(EMAIL_KEY))
  } catch {
    return false
  }
}

export function NewsletterPopup() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!pathname || pathname.startsWith('/admin')) return
    if (dismissed()) return
    const profile = user as { newsletterSubscribed?: boolean; newsletterOptOut?: boolean; email?: string; firstName?: string } | null
    if (profile?.newsletterSubscribed && profile.newsletterOptOut !== true) {
      try {
        if (profile.email) localStorage.setItem(EMAIL_KEY, profile.email.toLowerCase())
      } catch {
        /* ignore */
      }
      return
    }
    if (profile?.email) setEmail(profile.email)
    if (profile?.firstName) setName(profile.firstName)
    const timer = window.setTimeout(() => setOpen(true), 6000)
    return () => window.clearTimeout(timer)
  }, [loading, pathname, user])

  if (!open) return null

  const close = (days = 14) => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 24 * 60 * 60 * 1000))
    } catch {
      /* ignore */
    }
    setOpen(false)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('saving')
    setError('')
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch('/api/newsletters/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email, name, source: 'popup' }),
      })
      const json = (await res.json().catch(() => null)) as { error?: string; success?: boolean } | null
      if (!res.ok || json?.success === false) {
        setStatus('error')
        setError(json?.error || 'Could not subscribe. Please try again.')
        return
      }
      try {
        localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase())
      } catch {
        /* ignore */
      }
      setStatus('done')
    } catch {
      setStatus('error')
      setError('Could not subscribe. Please try again.')
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:p-5 flex justify-center sm:justify-end pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-neutral-200 bg-white text-neutral-900 shadow-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Passive Blessings</p>
            <h2 className="text-xl font-semibold text-neutral-900 mt-1">Join the newsletter</h2>
          </div>
          <button
            type="button"
            data-dashboard-control
            className="pb-ghost-btn p-1 rounded-md text-neutral-700 hover:bg-neutral-100"
            aria-label="Close newsletter signup"
            onClick={() => close(14)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-neutral-700 mt-2">
          Events, community news, and updates. You can unsubscribe any time.
        </p>
        {status === 'done' ? (
          <p className="mt-4 text-sm font-medium text-neutral-900">You&apos;re on the list. Jazakallah khair.</p>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name (optional)"
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 bg-white"
              autoComplete="name"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 bg-white"
              autoComplete="email"
            />
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <button
              type="submit"
              disabled={status === 'saving'}
              className="w-full min-h-[44px] rounded-lg bg-neutral-900 text-white font-semibold disabled:opacity-60"
            >
              {status === 'saving' ? 'Joining…' : 'Subscribe'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
