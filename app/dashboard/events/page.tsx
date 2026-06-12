'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, query, where, deleteDoc, doc, Timestamp } from 'firebase/firestore'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, MapPin, Users, Calendar, LogOut, Plus } from 'lucide-react'
import Link from 'next/link'
import { Event } from '@/lib/event-types'
import { format } from 'date-fns'

export default function MemberEventsPage() {
  const [attendingEvents, setAttendingEvents] = React.useState<Event[]>([])
  const [declinedEvents, setDeclinedEvents] = React.useState<Event[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false)
      return
    }

    // Fetch user's event attendance records
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'eventAttendance'),
        where('userId', '==', auth.currentUser.uid)
      ),
      async (snapshot) => {
        const attendanceRecords = snapshot.docs.map((doc) => ({
          ...doc.data(),
          docId: doc.id,
        }))

        // Fetch full event details for each attendance record
        const eventPromises = attendanceRecords.map(async (record) => {
          try {
            const eventDoc = await fetch(`/api/events/${record.eventId}`)
            if (eventDoc.ok) {
              const event = await eventDoc.json()
              return { ...event, attendanceDocId: record.docId, status: record.status }
            }
          } catch (err) {
            console.error('[v0] Error fetching event:', err)
          }
          return null
        })

        const events = await Promise.all(eventPromises)
        const validEvents = events.filter((e): e is any => e !== null)

        setAttendingEvents(validEvents.filter((e) => e.status === 'attending'))
        setDeclinedEvents(validEvents.filter((e) => e.status === 'declined'))
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleDeclineEvent = async (attendanceDocId: string) => {
    try {
      await deleteDoc(doc(db, 'eventAttendance', attendanceDocId))
    } catch (error) {
      console.error('[v0] Error declining event:', error)
      alert('Failed to decline event')
    }
  }

  const handleAddToCalendar = (event: Event) => {
    const eventDate = event.date instanceof Date ? event.date : (event.date as any).toDate?.() || new Date()
    const startDateTime = new Date(eventDate)
    const [startHour] = event.startTime.split(':')
    startDateTime.setHours(parseInt(startHour), 0, 0)

    const endDateTime = new Date(startDateTime)
    const [endHour] = event.endTime.split(':')
    endDateTime.setHours(parseInt(endHour), 0, 0)

    // Generate iCal format
    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Passive Blessings//Events//EN
BEGIN:VEVENT
UID:${event.id}@passiveblessings.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location.address}, ${event.location.city}
END:VEVENT
END:VCALENDAR`

    // Download iCal file
    const blob = new Blob([icalContent], { type: 'text/calendar' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.title}.ics`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <>
      <MemberHeader
        title="My Events"
        subtitle="Events you&apos;re attending and registered for"
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />
      
      <div className="p-8">
        {loading ? (
          <p className="text-neutral-600">Loading events...</p>
        ) : attendingEvents.length === 0 && declinedEvents.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-neutral-600 mb-4">You haven&apos;t registered for any events yet</p>
            <Link href="/events">
              <Button className="bg-neutral-900 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Browse Events
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Attending Events */}
            {attendingEvents.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Attending Events</h2>
                <div className="grid gap-4">
                  {attendingEvents.map((event: any) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onDecline={() => handleDeclineEvent(event.attendanceDocId)}
                      onAddToCalendar={() => handleAddToCalendar(event)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Declined Events */}
            {declinedEvents.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Declined Events</h2>
                <div className="grid gap-4">
                  {declinedEvents.map((event: any) => (
                    <div
                      key={event.id}
                      className="p-4 border border-gray-200 rounded-lg opacity-60"
                    >
                      <p className="text-neutral-600">
                        You declined: <strong>{event.title}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function EventCard({
  event,
  onDecline,
  onAddToCalendar,
}: {
  event: Event & { attendanceDocId: string }
  onDecline: () => void
  onAddToCalendar: () => void
}) {
  const eventDate = event.date instanceof Date ? event.date : (event.date as any).toDate?.() || new Date()
  const formattedDate = format(eventDate, 'MMM dd, yyyy')
  const genderLabel = {
    'mixed': 'All Genders',
    'men-only': 'Men Only',
    'ladies-only': 'Ladies Only',
  }

  return (
    <Card className="p-6">
      {event.bannerImageUrl && (
        <img
          src={event.bannerImageUrl}
          alt={event.title}
          className="w-full h-40 object-cover rounded-lg mb-4"
        />
      )}

      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold">{event.title}</h3>
          <div className="flex gap-2 mt-2">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {genderLabel[event.genderRestriction]}
            </span>
            {event.isPaid && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {event.currency} {event.price}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-neutral-600 mb-4">{event.description}</p>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-500" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-neutral-500" />
          <span>{event.startTime} - {event.endTime}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-neutral-500" />
          <span>{event.location.address}, {event.location.city}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-neutral-500" />
          <span>{event.attendees.length} attending</span>
        </div>
      </div>

      {event.dressCode && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-xs font-medium text-neutral-600">Dress Code: {event.dressCode}</p>
        </div>
      )}

      {event.logistics && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-xs font-medium text-neutral-600 mb-1">Logistics & Info:</p>
          <p className="text-xs text-neutral-600">{event.logistics}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={onAddToCalendar} variant="outline" className="flex-1">
          <Calendar className="w-4 h-4 mr-2" />
          Add to Calendar
        </Button>
        <Button onClick={onDecline} variant="outline" className="flex-1 text-red-600 border-red-300">
          <LogOut className="w-4 h-4 mr-2" />
          Decline
        </Button>
      </div>
    </Card>
  )
}
