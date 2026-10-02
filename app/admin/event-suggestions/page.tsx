'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { adminApiFetch } from '@/lib/admin-api-client'

type Suggestion = {
  id: string
  name: string
  email: string
  phone: string
  title: string
  description: string
  preferredDate: string
  location: string
  audience: string
  status: string
  adminNote: string
  createdAt: string | null
}

const ACTIONS = [
  { status: 'reviewing', label: 'Mark reviewing' },
  { status: 'planned', label: 'Plan it' },
  { status: 'declined', label: 'Decline' },
  { status: 'pending', label: 'Reset to pending' },
] as const

export default function EventSuggestionsPage() {
  const [items, setItems] = useState<Suggestion[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await adminApiFetch<{ items?: Suggestion[] } | Suggestion[]>('/api/admin/event-suggestions')
    const payload = res as { success?: boolean; items?: Suggestion[]; error?: string }
    if (payload.success === false || payload.error) {
      setError(payload.error || 'Could not load suggestions')
      setItems([])
    } else {
      const list = Array.isArray(payload.items) ? payload.items : []
      setItems(list)
      setNotes(Object.fromEntries(list.map((item) => [item.id, item.adminNote || ''])))
      setError('')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const act = async (id: string, status: string) => {
    setBusyId(id)
    const res = await adminApiFetch('/api/admin/event-suggestions', {
      method: 'PATCH',
      body: JSON.stringify({ id, status, adminNote: notes[id] || '' }),
    })
    setBusyId('')
    if (res.success === false) {
      setError(res.error || 'Could not update the suggestion')
      return
    }
    await load()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Ideas sent from the event registration email. Update the status and the member is notified.
      </p>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-neutral-600">Loading suggestions…</p> : null}
      {!loading && items.length === 0 ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-300">No event suggestions yet.</p>
      ) : null}
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-neutral-200 bg-white p-4 text-neutral-900">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">{item.title}</h2>
                <p className="text-xs text-neutral-600 mt-1">
                  {item.name} · {item.email}
                  {item.phone ? ` · ${item.phone}` : ''}
                  {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleString()}` : ''}
                </p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-800 border border-neutral-300 rounded-full px-2 py-1">
                {item.status}
              </span>
            </div>
            <p className="text-sm text-neutral-800 mt-3 whitespace-pre-wrap">{item.description}</p>
            <p className="text-xs text-neutral-600 mt-2">
              {[item.preferredDate && `When: ${item.preferredDate}`, item.location && `Where: ${item.location}`, item.audience && `For: ${item.audience}`]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <label className="block text-xs font-medium text-neutral-800 mt-3">
              Note to the member
              <textarea
                value={notes[item.id] || ''}
                onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                rows={2}
                className="mt-1 w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 bg-white"
              />
            </label>
            <div className="flex flex-wrap gap-2 mt-3">
              {ACTIONS.map((action) => (
                <button
                  key={action.status}
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void act(item.id, action.status)}
                  className="pb-outline-btn min-h-[36px] px-3 rounded-lg border border-neutral-300 bg-white text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
