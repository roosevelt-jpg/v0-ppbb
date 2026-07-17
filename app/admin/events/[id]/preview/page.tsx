'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { EventDetailView } from '@/components/events/event-detail-view'
import type { Event } from '@/lib/event-types'
import { ChevronLeft } from 'lucide-react'

export default function AdminEventPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const [event, setEvent] = React.useState<Event | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`)
        const json = await res.json()
        if (json.success && json.data) {
          setEvent(json.data as Event)
        }
      } catch (error) {
        console.error('[v0] Preview load error:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [eventId])

  if (loading) {
    return (
      <AdminPageLayout title="Event Preview">
        <div className="py-12 text-center text-gray-500">Loading preview...</div>
      </AdminPageLayout>
    )
  }

  if (!event) {
    return (
      <AdminPageLayout title="Event Preview">
        <div className="py-12 text-center text-gray-500">Event not found</div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title="Event Preview">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/events')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft size={20} />
            Back to Events
          </button>
          <Link
            href={`/admin/events/create?id=${eventId}`}
            className="h-7 min-h-0 px-4 py-2 bg-white text-black border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 inline-flex items-center"
          >
            Edit Event
          </Link>
          <Link
            href={`/events/${eventId}`}
            target="_blank"
            className="h-7 min-h-0 px-4 py-2 bg-black !text-white rounded-lg text-sm font-medium hover:bg-gray-900 inline-flex items-center"
          >
            Open Public Page
          </Link>
        </div>
        <EventDetailView event={event} previewMode />
      </div>
    </AdminPageLayout>
  )
}
