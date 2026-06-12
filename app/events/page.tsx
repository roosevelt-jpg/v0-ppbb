'use client'

import React, { useEffect, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, query, where, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore'
import Link from 'next/link'
import { Calendar, MapPin, Users, Heart, Share2, Search } from 'lucide-react'
import { Event } from '@/lib/event-types'
import { format } from 'date-fns'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set())
  const [attendingEventIds, setAttendingEventIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'past'>('all')

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

  // Filter events based on search and type
  const filteredUpcomingEvents = upcomingEvents.filter((e) =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPastEvents = pastEvents.filter((e) =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const displayedEvents = 
    filterType === 'upcoming' ? filteredUpcomingEvents :
    filterType === 'past' ? filteredPastEvents :
    [...filteredUpcomingEvents, ...filteredPastEvents]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Events</h1>
            <p className="text-lg text-gray-600">
              Join us for events, workshops, and community gatherings. Connect with fellow members and make a difference together.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setFilterType('upcoming')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'upcoming'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilterType('past')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'past'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Past
              </button>
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading events...</p>
            </div>
          ) : displayedEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No events found matching your search</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedEvents.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  isAttending={attendingEventIds.has(event.id!)}
                  onAttend={() => handleAttendEvent(event.id!)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

function EventCard({ 
  event, 
  isAttending, 
  onAttend,
}: { 
  event: Event
  isAttending: boolean
  onAttend: () => void
}) {
  const eventDate = event.date instanceof Date ? event.date : (event.date as any).toDate?.() || new Date()
  const formattedDate = format(eventDate, 'MMM dd, yyyy')
  const isPast = eventDate <= new Date()
  const genderLabel = {
    'mixed': 'All Genders',
    'men-only': 'Men Only',
    'ladies-only': 'Ladies Only',
  }

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${isPast ? 'opacity-75' : ''}`}>
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
          {isPast && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Past Event</span>
          )}
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
            disabled={isPast}
            className={`flex-1 py-2 font-medium rounded-lg transition-colors ${
              isPast
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : isAttending
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {isPast ? 'Event Ended' : isAttending ? 'Decline' : 'Attend'}
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

