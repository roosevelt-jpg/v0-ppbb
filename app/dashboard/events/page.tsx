'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import { Calendar, MapPin, Users, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react'
import type { Event } from '@/lib/event-types'
import type { User } from '@/lib/types'
import { isCharityVolunteerEvent } from '@/lib/charity-event'
import { StripeCardForm } from '@/components/payments/stripe-card-form'
import { TicketAmountDue } from '@/components/events/ticket-amount-due'
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
import { dedupeUpcomingEventsBySeries, getEventLocationLabel } from '@/lib/event-utils'
import { EventBannerThumb } from '@/components/events/event-banner-thumb'
import { eventDoorScanUrl } from '@/lib/event-check-in-link'

function parseEventDate(value: unknown): Date | null {
  return parseFirestoreDate(value)
}

type BrowseEvent = Record<string, unknown> & {
  id: string
  recurringSeriesBadge?: string
}

type RegisteredEvent = Event & {
  registrationId?: string
  registrationStatus?: string
  paymentStatus?: string | null
  checkedInAt?: Date | string | null
  attendanceConfirmedByMember?: boolean
  checkInCode?: string | null
  qrToken?: string | null
}

function isAwaitingPayment(event: Pick<RegisteredEvent, 'registrationStatus' | 'paymentStatus'>) {
  return (
    event.registrationStatus === 'pending_payment' ||
    event.paymentStatus === 'pending'
  )
}

function isFullyRegistered(event: Pick<RegisteredEvent, 'registrationStatus' | 'paymentStatus'>) {
  if (isAwaitingPayment(event)) return false
  const status = String(event.registrationStatus || '')
  return status === 'confirmed' || status === 'pending' || status === 'waitlisted'
}

function CheckInQr({ event }: { event: RegisteredEvent }) {
  const token = event.qrToken || event.checkInCode || ''
  if (!token) {
    return (
      <p className="px-4 pb-4 text-sm text-neutral-600">
        Your check-in code is on the way. Refresh this page in a moment.
      </p>
    )
  }
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(eventDoorScanUrl(token))}`
  return (
    <div className="px-4 pb-5 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrUrl} alt="Check-in QR code" className="mx-auto h-[220px] w-[220px] rounded-lg border border-neutral-200 bg-white" />
      {event.checkInCode ? (
        <p className="mt-2 font-mono text-lg tracking-widest text-neutral-900">{event.checkInCode}</p>
      ) : null}
      <p className="mt-1 text-xs text-neutral-500">Show this at the distribution. Your volunteer hours are already added.</p>
    </div>
  )
}

export default function MyEventsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [browseEvents, setBrowseEvents] = React.useState<BrowseEvent[]>([])
  const [registeredEvents, setRegisteredEvents] = React.useState<RegisteredEvent[]>([])
  const [registrationByEventId, setRegistrationByEventId] = React.useState<
    Record<string, Pick<RegisteredEvent, 'registrationId' | 'registrationStatus' | 'paymentStatus'>>
  >({})
  const [loadingBrowse, setLoadingBrowse] = React.useState(true)
  const [loadingRegistered, setLoadingRegistered] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [registeringId, setRegisteringId] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<'browse' | 'registered'>('browse')
  const [openQrEventId, setOpenQrEventId] = React.useState<string | null>(null)
  const intentStarted = React.useRef(false)
  const [payCoupon, setPayCoupon] = React.useState('')
  const [stripeCheckout, setStripeCheckout] = React.useState<{
    clientSecret: string
    publishableKey: string
    registrationId: string
    eventId: string
    amount?: number
    currency?: string
  } | null>(null)

  const loadRegistered = React.useCallback(async () => {
    if (!user?.id) return
    setLoadingRegistered(true)
    try {
      const res = await fetch(`/api/user/events?userId=${encodeURIComponent(user.id)}`)
      const json = await res.json()
      if (!json.success) {
        setRegisteredEvents([])
        setRegistrationByEventId({})
        return
      }
      const raw = json.data
      const eventList = Array.isArray(raw) ? raw : raw ? [raw] : []
      const events = eventList.filter(Boolean) as RegisteredEvent[]
      setRegisteredEvents(events)
      const map: Record<
        string,
        Pick<RegisteredEvent, 'registrationId' | 'registrationStatus' | 'paymentStatus'>
      > = {}
      for (const e of events) {
        if (!e.id) continue
        map[e.id] = {
          registrationId: e.registrationId,
          registrationStatus: e.registrationStatus,
          paymentStatus: e.paymentStatus,
        }
      }
      setRegistrationByEventId(map)
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
        const deduped = dedupeUpcomingEventsBySeries(
          filtered,
          (e) => parseEventDate(e.startDate),
          (e) => getEventLocationLabel(e as never)
        )
        setBrowseEvents(deduped)
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

  const handleRegister = async (event: BrowseEvent, couponOverride?: string) => {
    if (!user?.id) {
      alert('Please sign in to register for this event.')
      const returnUrl = encodeURIComponent('/dashboard/events')
      window.location.href = `/login?returnUrl=${returnUrl}`
      return
    }
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
          couponCode: (couponOverride ?? payCoupon).trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        alert(json.error || 'Registration failed')
        return
      }
      if (json.embedded && json.clientSecret && json.publishableKey) {
        setStripeCheckout({
          clientSecret: json.clientSecret,
          publishableKey: json.publishableKey,
          registrationId: json.registrationId,
          eventId: event.id,
          amount: typeof json.amount === 'number' ? json.amount : Number(event.price) || undefined,
          currency: json.currency || event.currency || 'AED',
        })
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

  React.useEffect(() => {
    if (authLoading) return
    const params = new URLSearchParams(window.location.search)
    const intent = params.get('intent')
    const eventId = params.get('eventId')
    if (params.get('tab') === 'registered') setActiveTab('registered')
    if (!intent || !eventId) return
    if (!user?.id) {
      router.replace(
        `/login?returnUrl=${encodeURIComponent(`/dashboard/events?${params.toString()}`)}`
      )
      return
    }
    if (intentStarted.current) return
    intentStarted.current = true
    setActiveTab('registered')
    void (async () => {
      try {
        const token = await auth.currentUser?.getIdToken()
        const res = await fetch('/api/events/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            eventId,
            userId: user.id,
            userName: `${(user as User).firstName ?? ''} ${(user as User).lastName ?? ''}`.trim(),
            userEmail: (user as User).email,
            userGender: (user as User).gender,
            registrationType: 'free',
          }),
        })
        const json = await res.json()
        if (json.embedded && json.clientSecret && json.publishableKey) {
          setStripeCheckout({
            clientSecret: json.clientSecret,
            publishableKey: json.publishableKey,
            registrationId: json.registrationId,
            eventId,
            amount: typeof json.amount === 'number' ? json.amount : undefined,
            currency: json.currency,
          })
        } else if (json.checkoutUrl) {
          window.location.href = json.checkoutUrl
          return
        } else if (!json.success && !json.registrationId) {
          setError(json.error || 'Registration failed')
        }
        await loadRegistered()
        if (intent === 'checkin') setOpenQrEventId(eventId)
        router.replace('/dashboard/events?tab=registered')
      } catch (err) {
        console.error('[v0] Intent register error:', err)
        setError('Registration failed. Please try again.')
      }
    })()
  }, [authLoading, user, loadRegistered, router])

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
      {stripeCheckout ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <h2 className="text-lg font-semibold mb-2">Pay for your ticket</h2>
            <p className="text-sm text-neutral-600 mb-4">Pay with Apple Pay, Google Pay, or card to complete registration.</p>
            <TicketAmountDue amount={stripeCheckout.amount} currency={stripeCheckout.currency} />
            <div className="mb-3">
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Coupon / unlock code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={payCoupon}
                  onChange={(e) => setPayCoupon(e.target.value)}
                  placeholder="Optional"
                  className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg"
                />
                <button
                  type="button"
                  disabled={registeringId === stripeCheckout.eventId}
                  onClick={() => {
                    const ev =
                      browseEvents.find((e) => e.id === stripeCheckout.eventId) ||
                      (registeredEvents.find((e) => e.id === stripeCheckout.eventId) as BrowseEvent | undefined)
                    if (ev) void handleRegister(ev, payCoupon)
                  }}
                  className="px-3 py-2 text-xs font-semibold border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
            <StripeCardForm
              key={stripeCheckout.clientSecret}
              publishableKey={stripeCheckout.publishableKey}
              clientSecret={stripeCheckout.clientSecret}
              submitLabel="Pay & register"
              onSuccess={async (paymentIntentId) => {
                const res = await fetch('/api/payments/confirm', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'event_ticket',
                    paymentIntentId,
                    registrationId: stripeCheckout.registrationId,
                  }),
                })
                const confirmJson = await res.json()
                if (!res.ok || !confirmJson.success) {
                  alert(confirmJson.error || 'Payment confirmation failed')
                  return
                }
                setStripeCheckout(null)
                setPayCoupon('')
                await loadRegistered()
                setActiveTab('registered')
              }}
            />
            <button
              type="button"
              className="mt-3 text-xs underline text-neutral-600"
              onClick={() => setStripeCheckout(null)}
            >
              Cancel
            </button>
          </Card>
        </div>
      ) : null}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <p className="text-sm text-neutral-500 dark:text-muted-foreground">
          {registeredEvents.length} event{registeredEvents.length !== 1 ? 's' : ''} registered
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
              const reg = registrationByEventId[event.id]
              const awaiting = reg ? isAwaitingPayment(reg) : false
              const fullyRegistered = reg ? isFullyRegistered(reg) : false
              return (
                <Card key={event.id} className="border border-neutral-200 dark:border-border overflow-hidden p-0">
                  <Link href={`/events/${event.id}`} className="block no-underline">
                    <EventBannerThumb
                      event={event}
                      title={String(event.title ?? 'Event')}
                      size="md"
                      rounded="rounded-none"
                    />
                  </Link>
                  <div className="p-4 sm:p-5">
                  <Link href={`/events/${event.id}`} className="no-underline">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-foreground hover:underline">
                      {String(event.title ?? 'Event')}
                    </h3>
                  </Link>
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
                  <div className="flex flex-wrap gap-2 mt-2">
                    {event.genderRestriction ? (
                      <span className="inline-block text-xs px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 capitalize">
                        {String(event.genderRestriction).replace(/-/g, ' ')}
                      </span>
                    ) : null}
                    {event.recurringSeriesBadge ? (
                      <span className="inline-block text-xs px-2 py-1 rounded bg-blue-50 text-blue-800">
                        {event.recurringSeriesBadge}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {awaiting ? (
                      <button
                        type="button"
                        disabled={registeringId === event.id}
                        onClick={() => void handleRegister(event)}
                        className="!bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                      >
                        {registeringId === event.id ? 'Opening payment…' : 'Complete payment'}
                      </button>
                    ) : fullyRegistered ? (
                      <span className="text-sm font-semibold text-green-700">
                        {reg?.registrationStatus === 'waitlisted'
                          ? 'Waitlisted'
                          : reg?.registrationStatus === 'pending'
                            ? 'Pending approval'
                            : 'Registered ✓'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={registeringId === event.id}
                        onClick={() => void handleRegister(event)}
                        className="!bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                      >
                        {registeringId === event.id ? 'Registering...' : 'Register / RSVP'}
                      </button>
                    )}
                    <Link
                      href={`/events/${event.id}`}
                      className="text-sm font-medium text-neutral-700 underline underline-offset-2"
                    >
                      View details
                    </Link>
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
                      {isAwaitingPayment(event) ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                          Awaiting payment
                        </span>
                      ) : event.registrationStatus === 'waitlisted' ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                          Waitlisted
                        </span>
                      ) : event.registrationStatus === 'pending' ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          Pending approval
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-800">
                          Registered
                        </span>
                      )}
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
                    {event.registrationId &&
                    event.registrationStatus !== 'waitlisted' &&
                    event.registrationStatus !== 'pending' &&
                    !isAwaitingPayment(event) ? (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenQrEventId((current) => (current === event.id ? null : event.id || null))
                        }
                        className="inline-flex items-center justify-center min-h-[44px] !bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold"
                      >
                        {openQrEventId === event.id ? 'Hide QR code' : 'Check in'}
                      </button>
                    ) : null}
                    {isAwaitingPayment(event) && event.id ? (
                      <button
                        type="button"
                        disabled={registeringId === event.id}
                        onClick={() => void handleRegister(event as unknown as BrowseEvent)}
                        className="!bg-black !text-white px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                      >
                        {registeringId === event.id ? 'Opening…' : 'Complete payment'}
                      </button>
                    ) : null}
                    {isCharity && event.registrationStatus === 'confirmed' ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 px-3 py-2">
                        <CheckCircle2 size={16} /> Hours added
                      </span>
                    ) : null}
                    {canCancel && event.id ? (
                      <button
                        type="button"
                        onClick={() => handleCancel(event.id!)}
                        className="inline-flex items-center gap-2 !bg-black !text-white px-3 py-2 rounded-lg text-sm"
                        aria-label="Cancel registration"
                      >
                        <Trash2 size={16} />
                        Cancel registration
                      </button>
                    ) : null}
                  </div>
                  </div>
                </div>
                {openQrEventId === event.id ? (
                  <CheckInQr event={event} />
                ) : null}
              </Card>
            )
          })}
        </div>
      )}
    </DashboardPageShell>
  )
}
