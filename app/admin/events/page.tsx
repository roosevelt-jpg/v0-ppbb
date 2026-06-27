'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { formatDistanceToNow, format } from 'date-fns'
import { Plus, Trash2, Eye, Edit2 } from 'lucide-react'

export default function EventsPage() {
  const [events, setEvents] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const res = await fetch('/api/events?status=draft', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        setEvents(json.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      }
    } catch (error) {
      console.error('[v0] Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      const res = await fetch(`/api/events?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setEvents(events.filter(e => e.id !== id))
      }
    } catch (error) {
      console.error('[v0] Error deleting event:', error)
    }
  }

  const handlePublish = async (id: string) => {
    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'published' }),
      })
      const json = await res.json()
      if (json.success) {
        loadEvents()
      }
    } catch (error) {
      console.error('[v0] Error publishing event:', error)
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
          <h2 className="text-2xl font-bold text-black">All Events (Draft)</h2>
          <Link
            href="/admin/events/create"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            <Plus size={20} />
            Create Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No events found. Create your first event!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {events.map((event: any) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{event.title}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{format(new Date(event.date), 'MMM dd, yyyy')}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{event.location?.address || '-'}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">Draft</span>
                    </td>
                    <td className="px-6 py-3 text-sm space-x-2 flex">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </Link>
                      <button
                        onClick={() => handlePublish(event.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Publish"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={16} />
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
