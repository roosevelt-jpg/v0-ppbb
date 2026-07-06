'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Card } from '@/components/ui/card'
import type { Event } from '@/lib/event-types'
import { format } from 'date-fns'
import { MapPin, Calendar, Users, DollarSign, Loader2 } from 'lucide-react'

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
      const res = await fetch(`/api/events?id=${eventId}`)
      const json = await res.json()
      if (json.success) {
        setEvent(Array.isArray(json.data) ? json.data[0] : json.data)
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
          // Redirect to payment/checkout
          window.location.href = json.checkoutUrl
        } else {
          // Redirect to confirmation
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
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        {event.bannerURL && (
          <div className="w-full h-96 relative overflow-hidden">
            <img src={event.bannerURL} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 py-12">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="col-span-2 space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-black mb-4">{event.title}</h1>
                <p className="text-gray-700 text-lg">{event.description}</p>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                  <Calendar className="text-gray-600" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-semibold">{format(new Date(event.startDate), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                  <MapPin className="text-gray-600" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-semibold">{event.locationName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                  <Users className="text-gray-600" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Attending</p>
                    <p className="font-semibold">{event.currentAttendees}/{event.maxAttendees || '∞'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                  <DollarSign className="text-gray-600" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-semibold">{event.pricingType === 'free' ? 'Free' : `AED ${event.price}`}</p>
                  </div>
                </div>
              </div>

              {/* Speakers */}
              {event.speakers && event.speakers.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold mb-6">Speakers</h2>
                  <div className="grid grid-cols-2 gap-6">
                    {event.speakers.map((speaker, idx) => (
                      <div key={idx}>
                        {speaker.photoURL && (
                          <div className="w-full h-40 rounded-lg overflow-hidden mb-3">
                            <img src={speaker.photoURL} alt={speaker.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <h3 className="font-semibold text-black">{speaker.name}</h3>
                        {speaker.title && <p className="text-sm text-gray-600">{speaker.title}</p>}
                        {speaker.bio && <p className="text-sm text-gray-700 mt-2">{speaker.bio}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agenda */}
              {event.agenda && event.agenda.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold mb-6">Agenda</h2>
                  <div className="space-y-4">
                    {event.agenda.map((item, idx) => (
                      <div key={idx} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                        <span className="font-mono font-bold text-gray-700 min-w-20">{item.time}</span>
                        <span className="text-gray-900">{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Registration */}
            <div>
              <Card className="bg-white border border-gray-200 p-8 sticky top-20">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Category</p>
                    <p className="font-semibold text-black">{event.category}</p>
                  </div>

                  {event.genderRestriction !== 'mixed' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700 font-medium">
                        {event.genderRestriction === 'ladies-only' ? 'Exclusively for Women' : 'Exclusively for Men'}
                      </p>
                    </div>
                  )}

                  {event.pricingType !== 'free' && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-black">AED {event.price}</p>
                      <p className="text-xs text-gray-600 mt-1">per ticket</p>
                    </div>
                  )}

                  <button
                    onClick={handleRegister}
                    disabled={registering || (event.maxAttendees ? event.currentAttendees >= event.maxAttendees : false)}
                    className="w-full py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {registering && <Loader2 size={16} className="animate-spin" />}
                    {event.maxAttendees && event.currentAttendees >= event.maxAttendees ? 'Event Full' : 'Register Now'}
                  </button>

                  <p className="text-xs text-gray-600 text-center">
                    {event.maxAttendees ? `${event.maxAttendees - event.currentAttendees} spots remaining` : 'No limit on attendees'}
                  </p>

                  <div className="pt-4 border-t border-gray-200 space-y-2 text-xs text-gray-600">
                    <p>📍 {event.locationAddress}</p>
                    <p>🕐 {format(new Date(event.startDate), 'MMM dd, yyyy HH:mm')}</p>
                    {event.endDate && (
                      <p>🕐 Ends {format(new Date(event.endDate), 'HH:mm')}</p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
