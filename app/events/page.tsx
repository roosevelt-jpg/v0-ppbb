'use client'

import React, { useEffect, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import Link from 'next/link'
import { Calendar, MapPin, Users, Heart, Download, Filter } from 'lucide-react'
import { format } from 'date-fns'

interface Event {
  id: string
  title: string
  description: string
  date: string
  startTime?: string
  endTime?: string
  location?: { address: string; city: string }
  bannerImageUrl?: string
  isPaid?: boolean
  price?: number
  currency?: string
  maxAttendees?: number
  status: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'past'>('all')

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const res = await fetch('/api/events?status=published', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        const sorted = json.data.sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        setEvents(sorted)
      }
    } catch (error) {
      console.error('[v0] Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadToCalendar = (event: Event) => {
    const startDate = new Date(event.date)
    if (event.startTime) {
      const [hours, minutes] = event.startTime.split(':')
      startDate.setHours(parseInt(hours), parseInt(minutes))
    }

    const endDate = new Date(startDate)
    if (event.endTime) {
      const [hours, minutes] = event.endTime.split(':')
      endDate.setHours(parseInt(hours), parseInt(minutes))
    } else {
      endDate.setHours(startDate.getHours() + 2)
    }

    // ICS format for calendar export
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Passive Blessings//Events//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@passiveblessings.ae`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description?.replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location?.address || 'TBA'}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.title.replace(/\s+/g, '_')}.ics`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (filterType === 'upcoming') return eventDate >= today
    if (filterType === 'past') return eventDate < today
    return true
  })

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Events & Workshops</h1>
          <p className="text-gray-300 text-lg">Join our community events and make a meaningful impact</p>
        </div>
      </section>

      {/* Filter */}
      <section className="border-b border-gray-200 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-gray-600" />
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilterType('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'upcoming'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilterType('past')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'past'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Past Events
            </button>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No events found for this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(event => (
                <div key={event.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image */}
                  {event.bannerImageUrl && (
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={event.bannerImageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-black mb-2 line-clamp-2">{event.title}</h3>

                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-black" />
                        <span>{format(new Date(event.date), 'MMM dd, yyyy')}</span>
                      </div>

                      {event.startTime && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">⏰</span>
                          <span>
                            {event.startTime}
                            {event.endTime && ` - ${event.endTime}`}
                          </span>
                        </div>
                      )}

                      {event.location?.address && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-black" />
                          <span>{event.location.address}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{event.description}</p>

                    {/* Price & Capacity */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        {event.isPaid ? (
                          <span className="font-bold text-black">
                            {event.currency} {event.price}
                          </span>
                        ) : (
                          <span className="text-green-600 font-medium">Free</span>
                        )}
                      </div>
                      {event.maxAttendees && (
                        <div className="flex items-center gap-1 text-gray-600 text-sm">
                          <Users size={14} />
                          <span>Max {event.maxAttendees}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadToCalendar(event)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
                      >
                        <Download size={16} />
                        Add to Calendar
                      </button>
                      <button className="flex items-center justify-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Heart size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
