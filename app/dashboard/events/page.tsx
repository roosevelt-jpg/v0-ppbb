'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, collection, getDocs, query, where, updateDoc, arrayUnion } from 'firebase/firestore'
import { User } from '@/lib/types'
import Link from 'next/link'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, QrCode, Clock, MapPin, Users } from 'lucide-react'

export default function MemberEventsPage() {
  const [events, setEvents] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [showQRScanner, setShowQRScanner] = React.useState<string | null>(null)
  const [userEmail, setUserEmail] = React.useState('')

  React.useEffect(() => {
    const fetchEvents = async () => {
      const firebaseUser = auth.currentUser
      if (!firebaseUser) return

      setUserEmail(firebaseUser.email || '')

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

  const handleQRCheckIn = async (eventId: string) => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) return

    try {
      await updateDoc(doc(db, 'events', eventId), {
        checkedIn: arrayUnion(firebaseUser.uid),
      })
      // Update local state
      setEvents(events.map(e => e.id === eventId ? {...e, checkedIn: [...(e.checkedIn || []), firebaseUser.uid]} : e))
      setShowQRScanner(null)
    } catch (error) {
      console.error('[v0] Error checking in:', error)
    }
  }

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
            {events.map((event: any) => {
              const isCheckedIn = event.checkedIn?.includes(auth.currentUser?.uid)
              const attendeeCount = event.attendees?.length || 0
              
              return (
                <Card key={event.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold">{event.title}</h3>
                        {isCheckedIn && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                            Checked In
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-muted-foreground" />
                          <span><strong>{event.date}</strong> at {event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-muted-foreground" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-muted-foreground" />
                          <span>{attendeeCount} attendees</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-col">
                      <Button variant="outline">View Details</Button>
                      {!isCheckedIn && (
                        <Button 
                          onClick={() => setShowQRScanner(event.id)}
                          className="flex items-center gap-2"
                        >
                          <QrCode size={16} />
                          Check In
                        </Button>
                      )}
                      {showQRScanner === event.id && (
                        <div className="mt-2 p-3 bg-blue-50 rounded">
                          <p className="text-xs text-muted-foreground mb-2">Tap to check in with QR code</p>
                          <Button 
                            size="sm"
                            onClick={() => handleQRCheckIn(event.id)}
                            className="w-full"
                          >
                            Confirm Check-In
                          </Button>
                          <Button 
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowQRScanner(null)}
                            className="w-full mt-2"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
