'use client'

import React, { useEffect, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import EventCard from '@/components/event-card'
import { Filter, Calendar, MapPin, Users } from 'lucide-react'
import type { Event } from '@/lib/types'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'past'>('upcoming')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const res = await fetch('/api/events?status=published', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        const sorted = (json.data || []).sort((a: any, b: any) => 
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

  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Date filter
    if (filterType === 'upcoming' && eventDate < today) return false
    if (filterType === 'past' && eventDate >= today) return false

    // Gender filter
    if (genderFilter !== 'all' && event.genderRestriction !== genderFilter) return false

    // Tag filter
    if (tagFilter !== 'all' && !event.tags?.includes(tagFilter as any)) return false

    return true
  })

  const allTags = Array.from(new Set(events.flatMap(e => e.tags || [])))
  const upcomingCount = events.filter(e => new Date(e.date) >= new Date()).length
  const totalEvents = events.length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-r from-black to-gray-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Events & Workshops</h1>
          <p className="text-gray-300 text-lg mb-2">Join our community events and make a meaningful impact</p>
          <div className="flex gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>{upcomingCount} upcoming events</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={18} />
              <span>{totalEvents} total events</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-4">
            {/* Date Filter */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Filter size={16} />
                When
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'upcoming', 'past'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                      filterType === type
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Users size={16} />
                Audience
              </label>
              <div className="flex gap-2 flex-wrap">
                {([
                  { value: 'all', label: 'All Events' },
                  { value: 'mixed', label: 'Everyone Welcome' },
                  { value: 'ladies-only', label: 'Ladies Only' },
                  { value: 'men-only', label: 'Men Only' },
                ] as const).map(option => (
                  <button
                    key={option.value}
                    onClick={() => setGenderFilter(option.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      genderFilter === option.value
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  Tags
                </label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setTagFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      tagFilter === 'all'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Tags
                  </button>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setTagFilter(tag)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                        tagFilter === tag
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600">Try adjusting your filters or check back soon</p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-sm text-gray-600">
                Showing {filteredEvents.length} of {events.length} events
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map(event => (
                  <EventCard key={event.id} event={event} showActions={true} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
