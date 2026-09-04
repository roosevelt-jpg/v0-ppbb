'use client'

export const dynamic = 'force-dynamic'

import React, { Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { EventDetailView } from '@/components/events/event-detail-view'
import { StripeCardForm } from '@/components/payments/stripe-card-form'
import { Card } from '@/components/ui/card'
import { auth } from '@/lib/firebase'
import type { Event } from '@/lib/event-types'
import { hasActiveMembership } from '@/lib/membership-access'
import { hasAdminAccess } from '@/lib/roles'

function EventDetailInner() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const eventId = params.id as string

  const [event, setEvent] = React.useState<Event | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [registering, setRegistering] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [ticketTypeId, setTicketTypeId] = React.useState('')
  const [couponCode, setCouponCode] = React.useState('')
  const [stripeCheckout, setStripeCheckout] = React.useState<{
    clientSecret: string
    publishableKey: string
    registrationId: string
    eventId: string
  } | null>(null)

  React.useEffect(() => {
    loadEvent()
  }, [eventId])

  React.useEffect(() => {
    if (searchParams.get('cancelled') === '1') {
      setError('Checkout was cancelled. You can try again when ready.')
    }
  }, [searchParams])

  const loadEvent = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}?publishedOnly=true`)
      const json = await res.json()
      if (json.success && json.data) {
        const data = json.data as Event
        setEvent(data)
        const first = Array.isArray(data.ticketTypes) && data.ticketTypes[0]
        if (first) setTicketTypeId(first.id)
      }
    } catch (err) {
      console.error('[v0] Error loading event:', err)
      setError('Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    const membersOnly = event?.allowNonMemberGuests !== true
    if (
      membersOnly &&
      !hasActiveMembership(user as unknown as Record<string, unknown>) &&
      !hasAdminAccess(user)
    ) {
      setError('This event is for members only. Join or renew your membership to register.')
      return
    }

    setRegistering(true)
    setError(null)

    try {
      const token = await auth.currentUser?.getIdToken()
      const selected = event?.ticketTypes?.find((t) => t.id === ticketTypeId)
      const price = selected?.price ?? event?.price ?? 0
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          eventId,
          userId: user.id,
          userName: user.displayName || user.email || '',
          userEmail: user.email || '',
          userGender: (user as any).gender || '',
          ticketTypeId: ticketTypeId || undefined,
          couponCode: couponCode || undefined,
          registrationType: price > 0 ? 'paid' : 'free',
          referralCode: searchParams.get('ref') || undefined,
        }),
      })

      const json = await res.json()
      if (json.success) {
        if (json.registrationId && json.registration) {
          sessionStorage.setItem(
            `event-reg-${json.registrationId}`,
            JSON.stringify({
              ...json.registration,
              id: json.registrationId,
              status: json.status,
              waitlistPosition: json.waitlistPosition,
              checkInCode: json.checkInCode || json.registration.checkInCode,
              qrToken: json.qrToken || json.registration.qrToken,
            })
          )
        }
        if (json.embedded && json.clientSecret && json.publishableKey) {
          setStripeCheckout({
            clientSecret: json.clientSecret,
            publishableKey: json.publishableKey,
            registrationId: json.registrationId,
            eventId,
          })
        } else if (json.checkoutUrl) {
          window.location.href = json.checkoutUrl
        } else {
          router.push(`/events/${eventId}/confirmation?registrationId=${json.registrationId}`)
        }
      } else {
        setError(json.error || 'Registration failed')
      }
    } catch (err) {
      console.error('[v0] Error registering:', err)
      setError('Failed to register for event')
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading event...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Event not found</p>
      </div>
    )
  }

  const membersOnly = event.allowNonMemberGuests !== true
  const canRegister =
    !user ||
    !membersOnly ||
    hasActiveMembership(user as unknown as Record<string, unknown>) ||
    hasAdminAccess(user)

  return (
    <>
      {stripeCheckout ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <h2 className="text-lg font-semibold mb-2">Pay for your ticket</h2>
            <p className="text-sm text-neutral-600 mb-4">Enter card details — you stay on Passive Blessings.</p>
            <StripeCardForm
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
                  setError(confirmJson.error || 'Payment confirmation failed')
                  return
                }
                setStripeCheckout(null)
                router.push(confirmJson.confirmationUrl || `/events/${eventId}/confirmation?registrationId=${stripeCheckout.registrationId}`)
              }}
              onError={(msg) => setError(msg)}
            />
            <button type="button" className="mt-3 text-xs underline text-neutral-600" onClick={() => setStripeCheckout(null)}>
              Cancel
            </button>
          </Card>
        </div>
      ) : null}
      <EventDetailView
      event={{ ...event, id: eventId }}
      registering={registering}
      error={error}
      selectedTicketId={ticketTypeId}
      couponCode={couponCode}
      onTicketChange={setTicketTypeId}
      onCouponChange={setCouponCode}
      onRegister={handleRegister}
      membersOnly={membersOnly}
      canRegister={canRegister}
      membershipHref={user ? '/dashboard/membership' : '/signup'}
    />
    </>
  )
}

export default function EventDetailPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-500">Loading event...</p>
          </div>
        }
      >
        <EventDetailInner />
      </Suspense>
      <Footer />
    </>
  )
}
