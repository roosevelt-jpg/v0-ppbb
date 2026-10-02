'use client'

import React, { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/firebase'

export default function SuggestEventPage() {
  const { user } = useAuth()
  const profile = user as { email?: string; firstName?: string; lastName?: string; phone?: string } | null
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [location, setLocation] = useState('')
  const [audience, setAudience] = useState('')
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [seeded, setSeeded] = useState(false)

  React.useEffect(() => {
    if (seeded || !profile) return
    setSeeded(true)
    const full = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    if (full) setName(full)
    if (profile.email) setEmail(profile.email)
    if (profile.phone) setPhone(profile.phone)
  }, [profile, seeded])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('saving')
    setError('')
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch('/api/event-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          title,
          description,
          preferredDate,
          location,
          audience,
          companyWebsite,
        }),
      })
      const json = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null
      if (!res.ok || json?.success === false) {
        setStatus('error')
        setError(json?.error || 'Could not send your suggestion.')
        return
      }
      setStatus('done')
    } catch {
      setStatus('error')
      setError('Could not send your suggestion.')
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-neutral-900">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-semibold text-neutral-900">Suggest an event</h1>
        <p className="mt-2 text-sm text-neutral-700">
          Share an idea with the Passive Blessings team. They review every suggestion in the admin dashboard.
        </p>
        {status === 'done' ? (
          <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 text-neutral-900">
            <p className="font-semibold">Jazakallah khair. Your idea is with the team.</p>
            <p className="text-sm text-neutral-700 mt-2">We&apos;ll follow up by email if we need more details.</p>
          </div>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
            <label className="block text-sm font-medium text-neutral-900">
              Your name
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 bg-white"
              />
            </label>
            <label className="block text-sm font-medium text-neutral-900">
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 bg-white"
              />
            </label>
            <label className="block text-sm font-medium text-neutral-900">
              Phone (optional)
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                inputMode="tel"
                className="mt-1 w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 bg-white"
              />
            </label>
            <label className="block text-sm font-medium text-neutral-900">
              Event idea
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Community iftar, skills workshop…"
                className="mt-1 w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 bg-white"
              />
            </label>
            <label className="block text-sm font-medium text-neutral-900">
              What should it be?
              <textarea
                required
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 bg-white"
              />
            </label>
            <label className="block text-sm font-medium text-neutral-900">
              Preferred date (optional)
              <input
                value={preferredDate}
                onChange={(event) => setPreferredDate(event.target.value)}
                placeholder="DD/MM/YYYY or a month"
                className="mt-1 w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 bg-white"
              />
            </label>
            <label className="block text-sm font-medium text-neutral-900">
              Location (optional)
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 bg-white"
              />
            </label>
            <label className="block text-sm font-medium text-neutral-900">
              Who is it for? (optional)
              <input
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 bg-white"
              />
            </label>
            <input
              tabIndex={-1}
              autoComplete="off"
              value={companyWebsite}
              onChange={(event) => setCompanyWebsite(event.target.value)}
              className="hidden"
              aria-hidden
            />
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <button
              type="submit"
              disabled={status === 'saving'}
              className="w-full min-h-[44px] rounded-lg bg-neutral-900 text-white font-semibold"
            >
              {status === 'saving' ? 'Sending…' : 'Send suggestion'}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  )
}
