'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { EventDetailView } from '@/components/events/event-detail-view'
import type { Event } from '@/lib/event-types'

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const eventId = params.id as string

  const [event, setEvent] = React.useState<Event | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [registering, setRegistering] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    loadEvent()
  }, [eventId])

  const loadEvent = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}?publishedOnly=true`)
      const json = await res.json()
      if (json.success && json.data) {
        setEvent(json.data as Event)
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
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          userId: user.id,
          registrationType: event?.pricingType === 'free' ? 'free' : 'paid',
        }),
      })

      const json = await res.json()
      if (json.success) {
        if (event?.pricingType === 'paid_by_business' || event?.pricingType === 'paid_by_pb') {
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
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Loading event...</p>
        </div>
        <Footer />
      </>
    )
  }

  if (!event) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Event not found</p>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <EventDetailView
        event={event}
        registering={registering}
        error={error}
        onRegister={handleRegister}
      />
      <Footer />
    </>
  )
}
