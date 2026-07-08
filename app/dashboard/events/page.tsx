'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import { Calendar, MapPin, Users, Trash2, ArrowRight } from 'lucide-react'
import type { Event } from '@/lib/event-types'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardErrorState,
  DashboardEmptyState,
  DashboardTabButton,
} from '@/components/dashboard-states'

function parseEventDate(value: unknown): Date | null {
  if (!value) return null
  try {
    if (typeof value === 'object' && value !== null && 'toDate' in value) {
      return (value as { toDate: () => Date }).toDate()
    }
    const d = new Date(value as string | number)
    return Number.isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

export default function MyEventsPage() {
  const { user, loading: authLoading } = useAuth()
  const [registeredEvents, setRegisteredEvents] = React.useState<Event[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<'upcoming' | 'past'>('upcoming')

  const loadEvents = React.useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/user/events?userId=${encodeURIComponent(user.id)}`)
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Failed to load events.')
        setRegisteredEvents([])
        return
      }
      const raw = json.data
      const eventList = Array.isArray(raw) ? raw : raw ? [raw] : []
      setRegisteredEvents(
        eventList.filter(Boolean).map((e: Event) => ({
          ...e,
          startDate: parseEventDate(e.startDate)?.toISOString() ?? e.startDate,
        }))
      )
    } catch (err) {
      console.error('[v0] Error loading events:', err)
      setError('Failed to load events.')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  React.useEffect(() => {
    if (authLoading) return
    if (!user?.id) {
      setLoading(false)
      return
    }
    loadEvents()
  }, [authLoading, user?.id, loadEvents])

  const now = new Date()
  const filteredEvents = registeredEvents.filter((event) => {
    const eventDate = parseEventDate(event.startDate)
    if (!eventDate) return activeTab === 'past'
    if (activeTab === 'upcoming') return eventDate >= now
    return eventDate < now
  })

  const handleCancel = async (eventId: string) => {
    if (!confirm('Cancel registration for this event?')) return
    try {
      const res = await fetch(`/api/user/events/${eventId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) loadEvents()
    } catch (err) {
      console.error('[v0] Error canceling event:', err)
    }
  }

  if (authLoading || loading) return <DashboardSkeleton />
  if (error) return <DashboardErrorState message={error} onRetry={loadEvents} />

  return (
    <DashboardPageShell
      title="My Events"
      subtitle="Your upcoming and registered events"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <p className="text-sm text-neutral-500">
          {registeredEvents.length} event{registeredEvents.length !== 1 ? 's' : ''} registered
        </p>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 !bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Browse Events <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <DashboardTabButton active={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')}>
          Upcoming Events
        </DashboardTabButton>
        <DashboardTabButton active={activeTab === 'past'} onClick={() => setActiveTab('past')}>
          Registered / Past
        </DashboardTabButton>
      </div>

      {filteredEvents.length === 0 ? (
        <DashboardEmptyState
          icon={<Calendar className="w-12 h-12" />}
          title={`No ${activeTab} events`}
          description={
            activeTab === 'upcoming'
              ? "You haven't registered for any upcoming events yet."
              : 'No past registered events to show.'
          }
          action={
            <Link
              href="/events"
              className="inline-flex items-center gap-2 !bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Browse Events <ArrowRight className="w-4 h-4" />
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map((event) => {
            const start = parseEventDate(event.startDate)
            return (
              <Card key={event.id} className="p-4 sm:p-5 border border-neutral-200">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/events/${event.id}`} className="no-underline">
                      <h3 className="text-lg font-semibold text-neutral-900 hover:underline">
                        {event.title ?? 'Event'}
                      </h3>
                    </Link>
                    {event.description ? (
                      <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{event.description}</p>
                    ) : null}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-sm text-neutral-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {start ? format(start, 'MMM dd, yyyy') : 'Date TBA'}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        {event.locationName || 'Location TBA'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} />
                        {event.currentAttendees ?? 0} attending
                      </div>
                    </div>
                  </div>
                  {activeTab === 'upcoming' && event.id ? (
                    <button
                      type="button"
                      onClick={() => handleCancel(event.id!)}
                      className="self-start !bg-red-600 !text-white px-3 py-2 rounded-lg text-sm"
                      aria-label="Cancel registration"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </DashboardPageShell>
  )
}
