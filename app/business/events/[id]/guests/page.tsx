'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { EventGuestManager } from '@/components/events/event-guest-manager'

export default function BusinessEventGuestsPage() {
  const params = useParams()
  const eventId = params.id as string
  const [title, setTitle] = React.useState('')

  React.useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setTitle(j.data?.title || '')
      })
      .catch(() => {})
  }, [eventId])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <EventGuestManager
        eventId={eventId}
        eventTitle={title}
        backHref="/business/events"
      />
    </div>
  )
}
