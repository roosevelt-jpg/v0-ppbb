'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { format } from 'date-fns'
import { Plus, Trash2, Edit2, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import type { Event, EventStatus } from '@/lib/event-types'
import { subscribeToAllEvents, deleteEvent, updateEvent } from '@/lib/event-queries'

type TabType = 'all' | 'pending_approval' | 'draft' | 'published' | 'changes_requested' | 'rejected' | 'cancelled' | 'completed'

export default function EventsPage() {
  const [events, setEvents] = React.useState<Event[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<TabType>('pending_approval')

  React.useEffect(() => {
    setLoading(true)
    const status = activeTab === 'all' ? undefined : (activeTab as EventStatus)
    const unsubscribe = subscribeToAllEvents(
      (data) => {
        setEvents(data)
        setLoading(false)
      },
      { status }
    )
    return () => unsubscribe()
  }, [activeTab])

  const getEventsByStatus = (status: TabType): Event[] => {
    if (status === 'all') return events
    return events.filter(e => e.status === status)
  }

  const filteredEvents = getEventsByStatus(activeTab)
  const pendingCount = events.filter(e => e.status === 'pending_approval').length

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    try {
      await deleteEvent(id)
    } catch (error) {
      console.error('[v0] Error deleting event:', error)
      alert('Failed to delete event')
    }
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
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black">Events</h2>
          <Link
            href="/admin/events/create"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
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
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab
                    ? 'bg-black text-white border-b-2 border-black'
                    : 'text-gray-600 hover:text-gray-900'
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

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              {activeTab === 'pending_approval' 
                ? 'No events pending approval.' 
                : `No ${activeTab === 'all' ? '' : activeTab} events found.`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created By</th>
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
                      <Link href={`/admin/events/${event.id}`} className="text-blue-600 hover:underline">
                        {event.title}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{event.category || 'General'}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>{event.createdByRole === 'business' ? 'Business' : 'Admin'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {format(new Date(event.startDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {event.submittedAt ? format(new Date(event.submittedAt), 'MMM dd, yyyy') : '-'}
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
                    <td className="px-6 py-3 text-sm space-x-2 flex">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-medium"
                        title="View/Edit"
                      >
                        View
                      </Link>
                      {event.status === 'published' && (
                        <Link
                          href={`/admin/events/${event.id}/revenue`}
                          className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded text-blue-700 font-medium"
                          title="View Revenue"
                        >
                          Revenue
                        </Link>
                      )}
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded text-red-700 font-medium"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
