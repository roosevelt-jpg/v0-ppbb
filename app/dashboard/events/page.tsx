'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { User } from '@/lib/types'
import Link from 'next/link'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function MemberEventsPage() {
  const [events, setEvents] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    const fetchEvents = async () => {
      const firebaseUser = auth.currentUser
      if (!firebaseUser) return

      try {
        // Fetch events user is registered for
        const eventsSnap = await getDocs(
          query(
            collection(db, 'events'),
            where('attendees', 'array-contains', firebaseUser.uid)
          )
        )

        setEvents(eventsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })))
      } catch (error) {
        console.error('[v0] Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  return (
    <>
      <MemberHeader
        title="My Events"
        subtitle="Events you&apos;re registered for"
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />
      
      <div className="p-8">
        {loading ? (
          <p className="text-muted-foreground">Loading events...</p>
        ) : events.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">You haven&apos;t registered for any events yet</p>
            <Link href="/events">
              <Button>Browse Events</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6">
            {events.map((event: any) => (
              <Card key={event.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">{event.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
                    <p className="text-sm mt-3">
                      <span className="font-medium">{event.date}</span> at {event.time}
                    </p>
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                  </div>
                  <Button variant="outline">View Details</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
