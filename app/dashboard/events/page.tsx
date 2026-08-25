'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import { Calendar, MapPin, Users, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react'
import type { Event } from '@/lib/event-types'
import type { User } from '@/lib/types'
import { isCharityVolunteerEvent } from '@/lib/charity-event'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardErrorState,
  DashboardEmptyState,
  DashboardTabButton,
} from '@/components/dashboard-states'
import {
  eventVisibleToUser,
  parseFirestoreDate,
} from '@/lib/member-dashboard'
import { getEventLocationLabel } from '@/lib/event-utils'
import { EventBannerThumb } from '@/components/events/event-banner-thumb'

function parseEventDate(value: unknown): Date | null {
  return parseFirestoreDate(value)
}

type BrowseEvent = Record<string, unknown> & { id: string }

type RegisteredEvent = Event & {
  registrationId?: string
  registrationStatus?: string
  checkedInAt?: Date | string | null
  attendanceConfirmedByMember?: boolean
}

export default function MyEventsPage() {
  const { user, loading: authLoading } = useAuth()
  const [browseEvents, setBrowseEvents] = React.useState<BrowseEvent[]>([])
  const [registeredEvents, setRegisteredEvents] = React.useState<RegisteredEvent[]>([])
  const [registeredIds, setRegisteredIds] = React.useState<Set<string>>(new Set())
  const [loadingBrowse, setLoadingBrowse] = React.useState(true)
  const [loadingRegistered, setLoadingRegistered] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [registeringId, setRegisteringId] = React.useState<string | null>(null)
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<'browse' | 'registered'>('browse')

  const loadRegistered = React.useCallback(async () => {
    if (!user?.id) return
    setLoadingRegistered(true)
    try {
      const res = await fetch(`/api/user/events?userId=${encodeURIComponent(user.id)}`)
      const json = await res.json()
      if (!json.success) {
        setRegisteredEvents([])
        setRegisteredIds(new Set())
        return
      }
      const raw = json.data
      const eventList = Array.isArray(raw) ? raw : raw ? [raw] : []
      const events = eventList.filter(Boolean) as RegisteredEvent[]
      setRegisteredEvents(events)
      setRegisteredIds(new Set(events.map((e) => e.id!).filter(Boolean)))
    } catch (err) {
      console.error('[v0] Error loading registered events:', err)
    } finally {
      setLoadingRegistered(false)
    }
  }, [user?.id])

  React.useEffect(() => {
    if (authLoading) return
    if (!user?.id) {
      setLoadingBrowse(false)
      setLoadingRegistered(false)
      return
    }

    loadRegistered()

    const member = user as User
    const now = new Date()

    const unsub = onSnapshot(
      query(collection(db, 'events'), where('status', '==', 'published')),
      (snap) => {
        const rows =
          snap?.docs?.map((d) => ({ id: d.id, ...d.data() } as BrowseEvent)) ?? []
        const filtered = rows
          .filter((e) => {
            const start = parseEventDate(e.startDate)
            return start && start >= now
          })
          .filter((e) => eventVisibleToUser(e, member.gender))
          .sort((a, b) => {
            const ad = parseEventDate(a.startDate)?.getTime() ?? 0
            const bd = parseEventDate(b.startDate)?.getTime() ?? 0
            return ad - bd
          })
        setBrowseEvents(filtered)
        setLoadingBrowse(false)
        setError(null)
      },
      (err) => {
        console.error('[v0] Events snapshot error:', err)
        setError('Failed to load events.')
        setLoadingBrowse(false)
      }
    )

    return () => unsub()
  }, [authLoading, user?.id, user, loadRegistered])

  const handleRegister = async (event: BrowseEvent) => {
    if (!user?.id) return
    setRegisteringId(event.id)
    try {
      const { auth } = await import('@/lib/firebase')
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          eventId: event.id,
          userId: user.id,
          userName: `${(user as User).firstName ?? ''} ${(user as User).lastName ?? ''}`.trim(),
          userEmail: (user as User).email,
          userGender: (user as User).gender,
          registrationType: event.pricingType === 'free' || !event.price ? 'free' : 'paid',
        }),
      })
      const json = await res.json()
      if (!json.success) {
        alert(json.error || 'Registration failed')
        return
      }
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl
        return
      }
      await loadRegistered()
      setActiveTab('registered')
    } catch (err) {
      console.error('[v0] Register error:', err)
      alert('Registration failed. Please try again.')
    } finally {
      setRegisteringId(null)
    }
  }

  const handleCancel = async (eventId: string) => {
    if (!confirm('Cancel registration for this event?')) return
    try {
      const res = await fetch(
        `/api/user/events/${eventId}?userId=${encodeURIComponent(user.id)}`,
        { method: 'DELETE' }
      )
      const json = await res.json()
      if (json.success) loadRegistered()
    } catch (err) {
      console.error('[v0] Error canceling event:', err)
    }
  }

  const handleConfirmAttendance = async (eventId: string) => {
    setConfirmingId(eventId)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) {
        alert('Sign in required')
        return
      }
      const res = await fetch(`/api/events/${eventId}/confirm-attendance`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(json.error || 'Could not confirm attendance')
        return
      }
      alert(json.message || 'Attendance confirmed')
      await loadRegistered()
    } catch (err) {
      console.error('[v0] Confirm attendance error:', err)
      alert('Could not confirm attendance')
    } finally {
      setConfirmingId(null)
    }
  }

  const loading = authLoading || (activeTab === 'browse' ? loadingBrowse : loadingRegistered)
  if (loading) return <DashboardSkeleton />
  if (error && activeTab === 'browse') return <DashboardErrorState message={error} />

  const now = new Date()
  const sortedRegistered = [...registeredEvents].sort((a, b) => {
    const ad = parseEventDate(a.startDate)?.getTime() ?? 0
    const bd = parseEventDate(b.startDate)?.getTime() ?? 0
    return bd - ad
  })
  const upcomingRegistered = sortedRegistered.filter((e) => {
    const d = parseEventDate(e.startDate)
    return d && d >= now
  })
  const pastRegistered = sortedRegistered.filter((e) => {
    const d = parseEventDate(e.startDate)
    return !d || d < now
  })
  const displayRegistered = [...upcomingRegistered, ...pastRegistered]

  return (
    <DashboardPageShell title="My Events" subtitle="Your upcoming and registered events">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <p className="text-sm text-neutral-500 dark:text-muted-foreground">
          {registeredIds.size} event{registeredIds.size !== 1 ? 's' : ''} registered
        </p>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 !bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Browse Public Events <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <DashboardTabButton active={activeTab === 'browse'} onClick={() => setActiveTab('browse')}>
          Upcoming Events
        </DashboardTabButton>
        <DashboardTabButton active={activeTab === 'registered'} onClick={() => setActiveTab('registered')}>
          Registered Events
        </DashboardTabButton>
      </div>

      {activeTab === 'browse' ? (
        browseEvents.length === 0 ? (
          <DashboardEmptyState
            icon={<Calendar className="w-12 h-12" />}
            title="No upcoming events"
            description="No upcoming events right now. Check back soon."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {browseEvents.map((event) => {
              const start = parseEventDate(event.startDate)
              const isRegistered = registeredIds.has(event.id)
              return (
                <Card key={event.id} className="border border-neutral-200 dark:border-border overflow-hidden p-0">
                  <EventBannerThumb
                    event={event}
                    title={String(event.title ?? 'Event')}
                    size="md"
                    rounded="rounded-none"
                  />
                  <div className="p-4 sm:p-5">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-foreground">{String(event.title ?? 'Event')}</h3>
                  {event.description ? (
                    <p className="text-sm text-neutral-500 dark:text-muted-foreground mt-1 line-clamp-2">{String(event.description)}</p>
                  ) : null}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm text-neutral-600 dark:text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {start ? format(start, 'MMM dd, yyyy') : 'Date TBA'}
                    </div>
                    <div className="flex items-start gap-2 min-w-0">
                      <MapPin size={14} className="shrink-0 mt-0.5" />
                      <span className="break-words min-w-0">
                        {getEventLocationLabel(event as never)}
                      </span>
                    </div>
                  </div>
                  {event.genderRestriction ? (
                    <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 capitalize">
                      {String(event.genderRestriction).replace(/-/g, ' ')}
                    </span>
                  ) : null}
                  <div className="mt-4">
                    {isRegistered ? (
                      <span className="text-sm font-semibold text-green-700">Registered ✓</span>
                    ) : (
                      <button
                        type="button"
                        disabled={registeringId === event.id}
                        onClick={() => handleRegister(event)}
                        className="!bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                      >
                        {registeringId === event.id ? 'Registering...' : 'Register / RSVP'}
                      </button>
                    )}
                  </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )
      ) : displayRegistered.length === 0 ? (
        <DashboardEmptyState
          icon={<Calendar className="w-12 h-12" />}
          title="No registered events"
          description="You haven't registered for any events yet."
          action={
            <button
              type="button"
              onClick={() => setActiveTab('browse')}
              className="!bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Browse Upcoming Events
            </button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {displayRegistered.map((event) => {
            const start = parseEventDate(event.startDate)
            const isPast = !start || start < now
            const isCharity = isCharityVolunteerEvent(event)
            const attended = Boolean(event.checkedInAt)
            const canCancel = !isPast && !attended
            return (
              <Card key={event.id} className="border border-neutral-200 dark:border-border overflow-hidden p-0">
                <div className="flex flex-col sm:flex-row">
                  <EventBannerThumb
                    event={event as never}
                    title={String(event.title ?? 'Event')}
                    size="md"
                    rounded="rounded-none"
                    className="sm:h-full sm:min-h-[140px] sm:w-44 sm:max-w-[11rem]"
                  />
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:justify-between gap-4 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/events/${event.id}`} className="no-underline">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-foreground hover:underline">
                          {event.title ?? 'Event'}
                        </h3>
                      </Link>
                      {isCharity ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                          Charity
                        </span>
                      ) : null}
                      {isPast ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-muted-foreground">
                          Past
                        </span>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-sm text-neutral-600 dark:text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {start ? format(start, 'MMM dd, yyyy') : 'Date TBA'}
                      </div>
                      <div className="flex items-start gap-2 min-w-0">
                        <MapPin size={14} className="shrink-0 mt-0.5" />
                        <span className="break-words min-w-0">
                          {getEventLocationLabel(event as never)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} />
                        {event.currentAttendees ?? 0} attending
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 self-start">
                    {isCharity ? (
                      attended ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 px-3 py-2">
                          <CheckCircle2 size={16} /> Hours credited
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={
                            confirmingId === event.id || event.registrationStatus !== 'confirmed'
                          }
                          onClick={() => event.id && void handleConfirmAttendance(event.id)}
                          className="!bg-black !text-white px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                        >
                          {confirmingId === event.id ? 'Confirming…' : 'Confirm attendance'}
                        </button>
                      )
                    ) : null}
                    {canCancel && event.id ? (
                      <button
                        type="button"
                        onClick={() => handleCancel(event.id!)}
                        className="!bg-black !text-white px-3 py-2 rounded-lg text-sm"
                        aria-label="Cancel registration"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </DashboardPageShell>
  )
}
