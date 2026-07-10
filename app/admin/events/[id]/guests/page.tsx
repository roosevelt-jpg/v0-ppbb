'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { EventGuestManager } from '@/components/events/event-guest-manager'

export default function AdminEventGuestsPage() {
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
    <AdminPageLayout title="Event Guests">
      <EventGuestManager
        eventId={eventId}
        eventTitle={title}
        backHref={`/admin/events/${eventId}`}
      />
    </AdminPageLayout>
  )
}
