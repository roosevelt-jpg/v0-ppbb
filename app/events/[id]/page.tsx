'use client'

export const dynamic = 'force-dynamic'

import React, { Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { EventDetailView } from '@/components/events/event-detail-view'
import { auth } from '@/lib/firebase'
import type { Event } from '@/lib/event-types'

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
        if (json.checkoutUrl) {
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

  return (
    <EventDetailView
      event={{ ...event, id: eventId }}
      registering={registering}
      error={error}
      selectedTicketId={ticketTypeId}
      couponCode={couponCode}
      onTicketChange={setTicketTypeId}
      onCouponChange={setCouponCode}
      onRegister={handleRegister}
    />
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
