'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import { Calendar, MapPin, Users, Trash2, ArrowRight } from 'lucide-react'
import type { Event } from '@/lib/event-types'

export default function MyEventsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [registeredEvents, setRegisteredEvents] = React.useState<Event[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<'upcoming' | 'past'>('upcoming')

  React.useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadEvents()
  }, [user, activeTab])

  const loadEvents = async () => {
    try {
      const res = await fetch(`/api/user/events?userId=${user?.id}`)
      const json = await res.json()
      if (json.success) {
        const eventList = Array.isArray(json.data) ? json.data : [json.data]
        setRegisteredEvents(eventList)
      }
    } catch (err) {
      console.error('[v0] Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  const now = new Date()
  const filteredEvents = registeredEvents.filter(event => {
    const eventDate = new Date(event.startDate)
    if (activeTab === 'upcoming') return eventDate >= now
    return eventDate < now
  })

  const handleCancel = async (eventId: string) => {
    if (!confirm('Cancel registration for this event?')) return
    try {
      const res = await fetch(`/api/user/events/${eventId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        loadEvents()
      }
    } catch (err) {
      console.error('[v0] Error canceling event:', err)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">My Events</h1>
        <Card className="p-8 text-center text-gray-500">Loading your registered events...</Card>
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
          <button
            className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 inline-flex items-center gap-2"
          >
            Browse Events <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {(['upcoming', 'past'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === tab ? '#111111' : '#e4e1da',
              color: activeTab === tab ? '#ffffff' : '#111111',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 600 : 500,
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No {activeTab} events</h2>
          <p className="text-gray-500 mb-6">Browse upcoming events and register to get started</p>
          <Link href="/events">
            <button className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 inline-flex items-center gap-2">
              Browse Events <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredEvents.map((event) => (
            <Card
              key={event.id}
              style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <Link href={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111111', marginBottom: '8px', cursor: 'pointer' }}>
                      {event.title}
                    </h3>
                  </Link>
                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>{event.description}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666' }}>
                      <Calendar size={14} />
                      {format(new Date(event.startDate), 'MMM dd, yyyy')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666' }}>
                      <MapPin size={14} />
                      {event.locationName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666' }}>
                      <Users size={14} />
                      {event.currentAttendees} attending
                    </div>
                  </div>
                </div>
                {activeTab === 'upcoming' && (
                  <button
                    onClick={() => handleCancel(event.id!)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#ffebee',
                      color: '#c62828',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginLeft: '12px',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
