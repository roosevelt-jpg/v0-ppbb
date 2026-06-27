'use client'

import React from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar, MapPin, Users, Clock, ArrowRight } from 'lucide-react'

interface Event {
  id: string
  title: string
  description: string
  date: Timestamp
  time?: string
  endTime?: string
  location: string
  imageUrl?: string
  capacity?: number
  registered?: number
  attendees: string[]
  eventType?: string
  status?: string
}

export default function MyEventsPage() {
  const [registeredEvents, setRegisteredEvents] = React.useState<Event[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    console.log('[v0] Setting up realtime listener for user events, userId:', firebaseUser.uid)

    // Realtime listener for events where this user is an attendee
    const q = query(
      collection(db, 'events'),
      where('attendees', 'array-contains', firebaseUser.uid)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const events = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Event))
          
          // Sort by date (upcoming first)
          events.sort((a, b) => {
            const aDate = a.date?.toDate?.() || new Date(0)
            const bDate = b.date?.toDate?.() || new Date(0)
            return aDate.getTime() - bDate.getTime()
          })

          console.log('[v0] Loaded registered events:', events.length)
          setRegisteredEvents(events)
          setError(null)
        } catch (err) {
          console.error('[v0] Error processing events:', err)
          setError('Failed to process events data')
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        console.error('[v0] Firestore error fetching events:', err)
        setError(err.message || 'Failed to load events')
        setLoading(false)
      }
    )

    return () => {
      console.log('[v0] Cleaning up events listener')
      unsubscribe()
    }
  }, [])

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'Date TBA'
    try {
      const date = timestamp.toDate?.() || new Date(timestamp as any)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return 'Invalid date'
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">My Events</h1>
        <Card className="p-8 text-center text-gray-500">
          <div className="animate-pulse">Loading your registered events...</div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">My Events</h1>
        <Card className="p-8 border-red-200 bg-red-50">
          <p className="text-red-700 font-semibold">Error loading events</p>
          <p className="text-red-600 text-sm mt-2">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Events</h1>
          <p className="text-gray-600 mt-2">
            {registeredEvents.length} event{registeredEvents.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <Link href="/events">
          <Button>Browse All Events</Button>
        </Link>
      </div>

      {registeredEvents.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No events registered yet</h2>
          <p className="text-gray-500 mb-6">Browse upcoming events and register to get started</p>
          <Link href="/events">
            <Button className="inline-flex items-center gap-2">
              Browse Events <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          {registeredEvents.map((event) => {
            const eventDate = event.date?.toDate?.() || new Date()
            const isUpcoming = eventDate > new Date()

            return (
              <Card
                key={event.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-6 p-6">
                  {/* Event Image or Icon */}
                  {event.imageUrl ? (
                    <div
                      className="w-32 h-32 rounded-lg bg-gray-200 flex-shrink-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${event.imageUrl})` }}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                  )}

                  {/* Event Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                        {event.eventType && (
                          <p className="text-sm text-gray-500 mt-1 capitalize">{event.eventType}</p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isUpcoming
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {isUpcoming ? 'Upcoming' : 'Past'}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    {/* Event Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      {event.time && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{event.time}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2 col-span-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.capacity && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>
                            {event.attendees?.length || 0} / {event.capacity} attendees
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Link href={`/events/${event.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
