'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export type PartnershipInquiryPayload = {
  submitterName: string
  submitterEmail: string
  phone: string
  title: string
  description: string
  type: string
}

type Props = {
  /** Partnership type sent to the API (e.g. partnership, sponsorship). */
  type?: string
  submitLabel?: string
  showContactLink?: boolean
  cancelHref?: string
  onSuccess?: () => void
  className?: string
}

/**
 * Shared partnership inquiry fields — same shape as the public /partners form
 * so business portal and apply page submissions stay consistent.
 */
export function PartnershipInquiryForm({
  type = 'partnership',
  submitLabel = 'Submit inquiry',
  showContactLink = true,
  cancelHref,
  onSuccess,
  className = '',
}: Props) {
  const { user, firebaseUser } = useAuth()
  const [form, setForm] = useState({
    submitterName: '',
    submitterEmail: '',
    phone: '',
    title: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    setForm((f) => ({
      ...f,
      submitterName:
        f.submitterName ||
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        user.email ||
        '',
      submitterEmail: f.submitterEmail || user.email || '',
      phone: f.phone || user.phone || '',
    }))
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const token = firebaseUser ? await firebaseUser.getIdToken() : null
      const res = await fetch('/api/partnerships/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          submitterName: form.submitterName,
          submitterEmail: form.submitterEmail,
          phone: form.phone,
          type,
          title: form.title,
          description: form.description,
        } satisfies PartnershipInquiryPayload),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Submission failed')
      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Thank you — your partnership inquiry was submitted. Our partnerships team will respond
        within 48 hours.
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-lg border border-[#e4e1da] bg-white p-4 sm:p-5 space-y-4 ${className}`}
    >
      {error ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1 font-body">Full name *</label>
          <input
            required
            value={form.submitterName}
            onChange={(e) => setForm((f) => ({ ...f, submitterName: e.target.value }))}
            className="w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 font-body">Email *</label>
          <input
            required
            type="email"
            value={form.submitterEmail}
            onChange={(e) => setForm((f) => ({ ...f, submitterEmail: e.target.value }))}
            className="w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 font-body">Phone</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 font-body">Organisation / subject *</label>
        <input
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg text-sm"
          placeholder="e.g. Brand partnership proposal"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 font-body">Your vision *</label>
        <textarea
          required
          rows={4}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full px-3 py-2 border border-[#e4e1da] rounded-lg text-sm"
          placeholder="Brief us on what you have in mind…"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {showContactLink ? (
          <p className="text-xs text-muted-foreground">
            General questions?{' '}
            <Link href="/contact" className="underline font-medium text-foreground">
              Use the Contact page
            </Link>
          </p>
        ) : cancelHref ? (
          <Link
            href={cancelHref}
            className="inline-flex items-center justify-center min-h-[44px] px-5 py-3 border border-black rounded-lg font-body text-sm font-semibold hover:bg-neutral-50"
          >
            Cancel
          </Link>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={submitting}
          className="min-h-[44px] px-5 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800 disabled:opacity-60"
        >
          {submitting ? 'Sending…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
