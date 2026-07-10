'use client'

import React from 'react'
import { adminApiFetch } from '@/lib/admin-api-client'

export type EventPickerOption = {
  id: string
  title: string
  status?: string
  startDate?: string
  location?: string
}

type EventPickerSelectProps = {
  value: string
  eventTitle?: string
  onChange: (eventId: string, eventTitle: string) => void
  className?: string
}

export function EventPickerSelect({
  value,
  eventTitle,
  onChange,
  className = '',
}: EventPickerSelectProps) {
  const [events, setEvents] = React.useState<EventPickerOption[]>([])
  const [search, setSearch] = React.useState('')
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const qs = search.trim() ? `?q=${encodeURIComponent(search.trim())}&limit=50` : '?limit=100'
      const json = await adminApiFetch<EventPickerOption[]>(`/api/admin/assets/events${qs}`)
      if (!cancelled && json.success && json.data) {
        setEvents(json.data)
      }
      if (!cancelled) setLoading(false)
    }
    const timer = setTimeout(load, search ? 250 : 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search])

  const selected = events.find((e) => e.id === value)

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-neutral-800">Link to event</label>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search events by name or location…"
        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
      />
      <select
        value={value}
        onChange={(e) => {
          const id = e.target.value
          const ev = events.find((item) => item.id === id)
          onChange(id, ev?.title || '')
        }}
        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white"
      >
        <option value="">— No linked event —</option>
        {value && eventTitle && !selected && (
          <option value={value}>{eventTitle} (saved)</option>
        )}
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.title}
            {ev.startDate ? ` · ${new Date(ev.startDate).toLocaleDateString()}` : ''}
            {ev.status ? ` (${ev.status})` : ''}
          </option>
        ))}
      </select>
      {loading && <p className="text-xs text-neutral-400">Loading events…</p>}
      {value && (
        <p className="text-xs text-neutral-500">
          Linked: {selected?.title || eventTitle || value}
        </p>
      )}
    </div>
  )
}
