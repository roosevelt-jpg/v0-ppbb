'use client'

export const dynamic = 'force-dynamic'

import {
  FILTER_PILL_ACTIVE,
  FILTER_PILL_INACTIVE,
  ACTION_ROW,
  BUTTON_ICON_COMPACT,
  BUTTON_ROW_COMPACT,
} from '@/lib/admin-design-system'
import React, { Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { format } from 'date-fns'
import { Plus, Trash2, Edit2, CheckCircle, AlertCircle, XCircle, Eye } from 'lucide-react'
import type { Event, EventStatus } from '@/lib/event-types'
import { subscribeToAllEvents, deleteEvent } from '@/lib/event-queries'
import { toEventDate, getEventLocationLabel } from '@/lib/event-utils'
import { EventBannerThumb } from '@/components/events/event-banner-thumb'

type TabType = 'all' | 'pending_approval' | 'draft' | 'published' | 'changes_requested' | 'rejected' | 'cancelled' | 'completed'

const TAB_OPTIONS: TabType[] = [
  'all',
  'pending_approval',
  'draft',
  'published',
  'changes_requested',
  'rejected',
  'cancelled',
  'completed',
]

function isValidTab(value: string | null): value is TabType {
  return !!value && TAB_OPTIONS.includes(value as TabType)
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <AdminPageLayout title="Events">
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">Loading events...</p>
          </div>
        </AdminPageLayout>
      }
    >
      <EventsPageContent />
    </Suspense>
  )
}

function EventsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [events, setEvents] = React.useState<Event[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<TabType>(() => {
    const tab = searchParams.get('tab')
    return isValidTab(tab) ? tab : 'all'
  })
  const [publishedFrom, setPublishedFrom] = React.useState('')
  const [publishedTo, setPublishedTo] = React.useState('')

  React.useEffect(() => {
    const tab = searchParams.get('tab')
    if (isValidTab(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  React.useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeToAllEvents((data) => {
      setEvents(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    router.replace(tab === 'all' ? '/admin/events' : `/admin/events?tab=${tab}`, { scroll: false })
  }

  const getEventsByStatus = (status: TabType): Event[] => {
    if (status === 'all') return events
    return events.filter((e) => e.status === status)
  }

  const sortPublishedUpcomingFirst = (list: Event[]): Event[] => {
    const now = Date.now()
    return [...list].sort((a, b) => {
      const aStart = toEventDate(a.startDate)?.getTime() ?? 0
      const bStart = toEventDate(b.startDate)?.getTime() ?? 0
      const aUpcoming = aStart >= now
      const bUpcoming = bStart >= now
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1
      if (aUpcoming && bUpcoming) return aStart - bStart
      return bStart - aStart
    })
  }

  const filteredEvents = React.useMemo(() => {
    let list = getEventsByStatus(activeTab)

    if (activeTab === 'published') {
      if (publishedFrom || publishedTo) {
        const fromMs = publishedFrom ? new Date(`${publishedFrom}T00:00:00`).getTime() : null
        const toMs = publishedTo ? new Date(`${publishedTo}T23:59:59`).getTime() : null
        list = list.filter((e) => {
          const pub =
            toEventDate(e.publishedAt)?.getTime() ??
            toEventDate(e.submittedAt)?.getTime() ??
            toEventDate(e.createdAt)?.getTime() ??
            0
          if (fromMs != null && pub < fromMs) return false
          if (toMs != null && pub > toMs) return false
          return true
        })
      }
      return sortPublishedUpcomingFirst(list)
    }

    return list
  }, [events, activeTab, publishedFrom, publishedTo])

  const pendingCount = events.filter((e) => e.status === 'pending_approval').length

  const submittedDisplayDate = (event: Event) => {
    return (
      toEventDate(event.submittedAt) ||
      toEventDate(event.publishedAt) ||
      toEventDate(event.createdAt)
    )
  }

  const locationDisplay = (event: Event) => {
    return getEventLocationLabel(event)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    try {
      await deleteEvent(id)
    } catch (error) {
      console.error('[v0] Error deleting event:', error)
      alert('Failed to delete event')
    }
  }

  const updateEventStatus = async (
    id: string,
    status: EventStatus,
    approvalNotes?: string
  ) => {
    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          approvalNotes: approvalNotes || null,
          approvedBy: 'admin',
        }),
      })
      const json = await res.json()
      if (!json.success) {
        alert(json.error || 'Failed to update event')
      }
    } catch (error) {
      console.error('[v0] Error updating event:', error)
      alert('Failed to update event')
    }
  }

  const handleApprove = async (id: string) => {
    if (!confirm('Approve and publish this event?')) return
    await updateEventStatus(id, 'published')
  }

  const handleReject = async (id: string) => {
    const notes = prompt('Rejection reason (optional):')
    if (notes === null) return
    await updateEventStatus(id, 'rejected', notes)
  }

  const handleRequestChanges = async (id: string) => {
    const notes = prompt('Describe the changes required:')
    if (!notes?.trim()) return
    await updateEventStatus(id, 'changes_requested', notes)
  }

  const getStatusBadgeColor = (status: EventStatus) => {
    switch (status) {
      case 'pending_approval':
        return 'bg-amber-100 text-amber-800'
      case 'changes_requested':
        return 'bg-orange-100 text-orange-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-red-50 text-red-600'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: EventStatus) => {
    switch (status) {
      case 'pending_approval':
        return <AlertCircle className="w-4 h-4" />
      case 'published':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title="Events">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading events...</p>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title="Events">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <h2 className="text-2xl font-bold text-black">Events</h2>
          <Link
            href="/admin/events/create"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 bg-black !text-white rounded-lg hover:bg-gray-900 transition-colors min-h-[40px]"
          >
            <Plus size={20} />
            Create Event
          </Link>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
          {(['all', 'pending_approval', 'draft', 'published', 'changes_requested', 'rejected', 'cancelled', 'completed'] as const).map((tab) => {
            const count = tab === 'all' ? events.length : tab === 'pending_approval' ? pendingCount : getEventsByStatus(tab).length
            const label = tab === 'all' ? 'All Events' 
              : tab === 'pending_approval' ? 'Pending Approval'
              : tab === 'changes_requested' ? 'Changes Requested'
              : tab.charAt(0).toUpperCase() + tab.slice(1)
            
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 rounded-lg ${
                  activeTab === tab ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE
                }`}
              >
                {tab === 'pending_approval' && pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full">
                    {pendingCount}
                  </span>
                )}
                {label} {count > 0 && `(${count})`}
              </button>
            )
          })}
        </div>

        {activeTab === 'published' && (
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
            <label className="text-sm text-gray-700">
              Published from
              <input
                type="date"
                value={publishedFrom}
                onChange={(e) => setPublishedFrom(e.target.value)}
                className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="text-sm text-gray-700">
              Published to
              <input
                type="date"
                value={publishedTo}
                onChange={(e) => setPublishedTo(e.target.value)}
                className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </label>
            {(publishedFrom || publishedTo) && (
              <button
                type="button"
                onClick={() => {
                  setPublishedFrom('')
                  setPublishedTo('')
                }}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Clear dates
              </button>
            )}
            <p className="text-xs text-gray-500 w-full sm:w-auto sm:ml-auto">
              Current &amp; upcoming events appear first
            </p>
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              {activeTab === 'pending_approval' 
                ? 'No events pending approval.' 
                : `No ${activeTab === 'all' ? '' : activeTab} events found.`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 min-w-0">
            <ul className="lg:hidden divide-y divide-gray-100">
              {filteredEvents.map((event) => (
                <li key={event.id} className="p-4 space-y-3">
                  <div className="flex gap-3 min-w-0">
                    <EventBannerThumb
                      event={event as never}
                      title={event.title}
                      size="sm"
                      rounded="rounded-md"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="font-semibold text-blue-600 hover:underline break-words"
                      >
                        {event.title}
                      </Link>
                      <p className="mt-1 text-xs text-gray-500">
                        {event.category || 'General'} ·{' '}
                        {event.createdByRole === 'business' ? 'Business' : 'Admin'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 break-words">{locationDisplay(event)}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {(() => {
                          const date = toEventDate(event.startDate)
                          return date ? format(date, 'MMM dd, yyyy') : '-'
                        })()}
                      </p>
                      <span
                        className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(event.status)}`}
                      >
                        {getStatusIcon(event.status)}
                        {event.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Link href={`/admin/events/${event.id}/preview`} className={BUTTON_ROW_COMPACT}>
                      <Eye /> Preview
                    </Link>
                    <Link href={`/admin/events/create?id=${event.id}`} className={BUTTON_ROW_COMPACT}>
                      <Edit2 /> Edit
                    </Link>
                    <Link href={`/admin/events/${event.id}/guests`} className={BUTTON_ROW_COMPACT}>
                      Attendees
                    </Link>
                    {event.status === 'pending_approval' && (
                      <>
                        <button type="button" onClick={() => handleApprove(event.id!)} className={BUTTON_ROW_COMPACT}>
                          Approve
                        </button>
                        <button type="button" onClick={() => handleRequestChanges(event.id!)} className={BUTTON_ROW_COMPACT}>
                          Changes
                        </button>
                        <button type="button" onClick={() => handleReject(event.id!)} className={BUTTON_ROW_COMPACT}>
                          Reject
                        </button>
                      </>
                    )}
                    {event.status === 'published' && (
                      <Link href={`/admin/events/${event.id}/revenue`} className={BUTTON_ROW_COMPACT}>
                        Revenue
                      </Link>
                    )}
                    <button type="button" onClick={() => handleDelete(event.id!)} className={BUTTON_ROW_COMPACT}>
                      <Trash2 /> Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden lg:block admin-table-scroll">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Event</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created By</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Submitted</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Revenue</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-3 min-w-0">
                        <EventBannerThumb
                          event={event as never}
                          title={event.title}
                          size="sm"
                          rounded="rounded-md"
                        />
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="text-blue-600 hover:underline line-clamp-2 min-w-0"
                        >
                          {event.title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{event.category || 'General'}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>{event.createdByRole === 'business' ? 'Business' : 'Admin'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 max-w-[200px]">
                      <span className="line-clamp-2" title={locationDisplay(event)}>
                        {locationDisplay(event)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {(() => {
                        const date = toEventDate(event.startDate)
                        return date ? format(date, 'MMM dd, yyyy') : '-'
                      })()}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {(() => {
                        const date = submittedDisplayDate(event)
                        return date ? format(date, 'MMM dd, yyyy') : '-'
                      })()}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusBadgeColor(event.status)}`}>
                        {getStatusIcon(event.status)}
                        {event.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {event.pricingType === 'free' ? 'Free' : `AED ${event.totalRevenue || 0}`}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <div className={ACTION_ROW}>
                        <Link
                          href={`/admin/events/${event.id}/preview`}
                          className={BUTTON_ICON_COMPACT}
                          title="Preview"
                        >
                          <Eye />
                        </Link>
                        <Link
                          href={`/admin/events/create?id=${event.id}`}
                          className={BUTTON_ROW_COMPACT}
                          title="Edit"
                        >
                          <Edit2 />
                          Edit
                        </Link>
                        <Link
                          href={`/admin/events/${event.id}/guests`}
                          className={BUTTON_ROW_COMPACT}
                          title="Attendees & Check-in"
                        >
                          Attendees
                        </Link>
                        {event.status === 'pending_approval' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(event.id!)}
                              className={BUTTON_ROW_COMPACT}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRequestChanges(event.id!)}
                              className={BUTTON_ROW_COMPACT}
                            >
                              Changes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(event.id!)}
                              className={BUTTON_ROW_COMPACT}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {event.status === 'published' && (
                          <Link
                            href={`/admin/events/${event.id}/revenue`}
                            className={BUTTON_ROW_COMPACT}
                            title="View Revenue"
                          >
                            Revenue
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(event.id!)}
                          className={BUTTON_ROW_COMPACT}
                          title="Delete"
                        >
                          <Trash2 />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
