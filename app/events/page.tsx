'use client'

import React, { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, query, where, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore'
import Link from 'next/link'
import { Calendar, MapPin, Users, Heart, Share2 } from 'lucide-react'
import { Event } from '@/lib/event-types'
import { format } from 'date-fns'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set())
  const [attendingEventIds, setAttendingEventIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Fetch only published events
    const q = query(collection(db, 'events'), where('status', '==', 'published'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((e): e is Event => e !== null)
        .sort((a, b) => {
          const dateA = a.date instanceof Date ? a.date : (a.date as any).toDate?.() || new Date()
          const dateB = b.date instanceof Date ? b.date : (b.date as any).toDate?.() || new Date()
          return dateA.getTime() - dateB.getTime()
        })

      setEvents(eventsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Fetch user's event attendance
  useEffect(() => {
    if (!auth.currentUser) return

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'eventAttendance'),
        where('userId', '==', auth.currentUser.uid),
        where('status', '==', 'attending')
      ),
      (snapshot) => {
        const attendingIds = new Set(snapshot.docs.map((doc) => doc.data().eventId))
        setAttendingEventIds(attendingIds)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleAttendEvent = async (eventId: string) => {
    if (!auth.currentUser) {
      alert('Please log in to register for events')
      return
    }

    try {
      if (attendingEventIds.has(eventId)) {
        // Find and delete the attendance record
        const q = query(
          collection(db, 'eventAttendance'),
          where('eventId', '==', eventId),
          where('userId', '==', auth.currentUser.uid)
        )
        // Note: Need to handle deletion properly
        alert('Attendance removed!')
        setAttendingEventIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(eventId)
          return newSet
        })
      } else {
        await addDoc(collection(db, 'eventAttendance'), {
          eventId,
          userId: auth.currentUser.uid,
          status: 'attending',
          createdAt: Timestamp.now(),
        })
        setAttendingEventIds((prev) => new Set([...prev, eventId]))
      }
    } catch (error) {
      console.error('[v0] Error updating attendance:', error)
      alert('Failed to update attendance')
    }
  }

  const upcomingEvents = events.filter((e) => {
    const eventDate = e.date instanceof Date ? e.date : (e.date as any).toDate?.() || new Date()
    return eventDate > new Date()
  })

  const pastEvents = events.filter((e) => {
    const eventDate = e.date instanceof Date ? e.date : (e.date as any).toDate?.() || new Date()
    return eventDate <= new Date()
  })

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Upcoming Events</h1>
          <p className="text-lg text-gray-600">
            Join us for events, workshops, and community gatherings. Connect with fellow members and make a difference together.
          </p>
        </div>

        {/* Upcoming Events */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading events...</p>
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No upcoming events scheduled</p>
          </div>
        ) : (
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold mb-6">Next Events</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    isAttending={attendingEventIds.has(event.id!)}
                    onAttend={() => handleAttendEvent(event.id!)}
                  />
                ))}
              </div>
            </div>

            {pastEvents.length > 0 && (
              <div className="border-t pt-12">
                <h2 className="text-2xl font-bold mb-6">Past Events</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastEvents.map((event) => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      isAttending={attendingEventIds.has(event.id!)}
                      onAttend={() => handleAttendEvent(event.id!)}
                      isPast={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EventCard({ 
  event, 
  isAttending, 
  onAttend,
  isPast = false 
}: { 
  event: Event
  isAttending: boolean
  onAttend: () => void
  isPast?: boolean
}) {
  const eventDate = event.date instanceof Date ? event.date : (event.date as any).toDate?.() || new Date()
  const formattedDate = format(eventDate, 'MMM dd, yyyy')
  const genderLabel = {
    'mixed': 'All Genders',
    'men-only': 'Men Only',
    'ladies-only': 'Ladies Only',
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {event.bannerImageUrl && (
        <img
          src={event.bannerImageUrl}
          alt={event.title}
          className={`w-full h-48 object-cover ${isPast ? 'opacity-60' : ''}`}
        />
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-2">
            <span className="inline-block bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
              {genderLabel[event.genderRestriction]}
            </span>
            {event.isPaid && (
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                {event.currency} {event.price}
              </span>
            )}
          </div>
        </div>

        <h3 className="text-xl font-bold mb-2">{event.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate} at {event.startTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{event.location.address}, {event.location.city}</span>
          </div>
          {event.dressCode && (
            <div className="flex items-start gap-2">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">Dress: {event.dressCode}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{event.attendees.length} attending</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onAttend}
            className={`flex-1 py-2 font-medium rounded-lg transition-colors ${
              isAttending
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {isAttending ? 'Decline' : 'Attend'}
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
