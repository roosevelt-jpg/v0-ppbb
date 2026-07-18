'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import type { Event } from '@/lib/event-types'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import { getEventLocationLabel } from '@/lib/event-utils'
import { EventBannerThumb } from '@/components/events/event-banner-thumb'

export default function BusinessEventsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [events, setEvents] = React.useState<Event[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<
    'draft' | 'pending_approval' | 'changes_requested' | 'published' | 'rejected'
  >('draft')

  React.useEffect(() => {
    if (!user || !hasBusinessAccess(user)) {
      router.push('/login')
      return
    }
    loadEvents()
  }, [user, activeTab])

  const loadEvents = async () => {
    try {
      const res = await fetch(`/api/events?createdBy=${user?.id}&status=${activeTab}`)
      const json = await res.json()
      if (json.success) {
        setEvents(Array.isArray(json.data) ? json.data : [])
      }
    } catch (err) {
      console.error('[v0] Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return
    try {
      const res = await fetch(`/api/events?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        loadEvents()
      }
    } catch (err) {
      console.error('[v0] Error deleting event:', err)
    }
  }

  return (
    <div className="min-h-full bg-[#fafafa]">
      <div className="px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-[#111] sm:text-3xl">Your Events</h1>
          <Link
            href="/business/events/new"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-[#111] px-4 py-2 text-sm font-semibold text-white no-underline sm:min-h-0"
          >
            <Plus size={18} />
            Create Event
          </Link>
        </div>

        <div className="mb-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {(['draft', 'pending_approval', 'changes_requested', 'published', 'rejected'] as const).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                data-dashboard-control
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-[#111] text-white'
                    : 'border border-[#e4e1da] bg-white text-[#111] hover:bg-neutral-50'
                }`}
              >
                {tab === 'draft'
                  ? 'Drafts'
                  : tab === 'pending_approval'
                    ? 'Pending Approval'
                    : tab === 'changes_requested'
                      ? 'Changes Requested'
                      : tab === 'published'
                        ? 'Published'
                        : 'Rejected'}
              </button>
            )
          )}
        </div>

        {loading ? (
          <div className="text-center text-neutral-500">Loading...</div>
        ) : events.length === 0 ? (
          <Card className="border-[#e4e1da] bg-white p-8 text-center sm:p-12">
            <p className="mb-4 text-neutral-500">No events yet</p>
            <Link
              href="/business/events/new"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#111] px-4 py-2 text-sm font-semibold text-white no-underline"
            >
              Create Your First Event
            </Link>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {events.map((event) => (
              <Card
                key={event.id}
                className="overflow-hidden border-[#e4e1da] bg-white p-0"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="h-36 w-full shrink-0 sm:h-auto sm:w-36 sm:min-h-[100px]">
                    <EventBannerThumb
                      event={event as never}
                      title={event.title}
                      size="md"
                      rounded="rounded-none"
                      className="!h-full !min-h-[100px] !w-full"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-base font-semibold text-[#111]">{event.title}</h3>
                      <p className="mt-1 text-sm text-neutral-500">
                        {format(new Date(event.startDate), 'MMM dd, yyyy')} • {event.category}
                      </p>
                      <p className="mt-1 break-words text-xs text-neutral-600">
                        {getEventLocationLabel(event as never)}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-wide text-neutral-400">
                        {event.status.replace(/_/g, ' ')}
                      </p>
                      {event.status === 'changes_requested' && event.approvalNotes && (
                        <p className="mt-2 break-words rounded-md bg-amber-50 p-2 text-sm text-orange-800">
                          {event.approvalNotes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/business/events/new?id=${event.id}`)}
                        className="inline-flex min-h-[40px] items-center gap-1 rounded-md bg-[#111] px-3 py-2 text-white"
                        title="Edit / Resubmit"
                      >
                        <Edit2 size={16} />
                        <span className="text-xs font-semibold sm:hidden">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(`/business/events/${event.id}/guests`)}
                        className="inline-flex min-h-[40px] items-center rounded-md bg-neutral-700 px-3 py-2 text-xs font-semibold text-white"
                        title="Attendees & Check-in"
                      >
                        Attendees
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(event.id!)}
                        className="inline-flex min-h-[40px] items-center gap-1 rounded-md bg-red-700 px-3 py-2 text-white"
                      >
                        <Trash2 size={16} />
                        <span className="text-xs font-semibold sm:hidden">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
