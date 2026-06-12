'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import Link from 'next/link'
import { AdminTable } from '@/components/admin-table'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { formatDistanceToNow, format } from 'date-fns'
import { Plus } from 'lucide-react'
import { BUTTON_PRIMARY } from '@/lib/admin-design-system'

export default function EventsPage() {
  const [events, setEvents] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'events'),
      (snapshot) => {
        const eventData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[]
        setEvents(eventData.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)))
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching events:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const columns = [
    {
      key: 'title',
      label: 'Event Title',
      width: '250px',
      render: (value: any) => <span style={{ fontWeight: 500, color: '#111111' }}>{value}</span>,
    },
    {
      key: 'location',
      label: 'Location',
      width: '200px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value?.address || '-'}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      width: '150px',
      render: (value: any) => {
        if (!value) return '-'
        const date = value.toDate ? value.toDate() : new Date(value)
        return <span style={{ color: '#888888' }}>{format(date, 'MMM dd, yyyy')}</span>
      },
    },
    {
      key: 'status',
      label: 'Status',
      width: '120px',
      render: (value: any) => {
        const statusColors: any = {
          draft: '#e3f2fd',
          published: '#e8f5e9',
          completed: '#f3e5f5',
          cancelled: '#ffebee',
        }
        const statusTextColors: any = {
          draft: '#1565c0',
          published: '#2e7d32',
          completed: '#6a1b9a',
          cancelled: '#c62828',
        }
        return (
          <span
            style={{
              backgroundColor: statusColors[value] || '#f7f6f2',
              color: statusTextColors[value] || '#111111',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              textTransform: 'capitalize',
            }}
          >
            {value || 'draft'}
          </span>
        )
      },
    },
    {
      key: 'attendees',
      label: 'Attendees',
      width: '100px',
      render: (value: any) => <span style={{ fontWeight: 600, color: '#111111' }}>{value?.length || 0}</span>,
    },
  ]

  const handleDelete = async (event: any) => {
    if (confirm(`Delete event "${event.title}"? This cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'events', event.id))
        alert('Event deleted successfully!')
      } catch (error) {
        console.error('[v0] Error deleting event:', error)
        alert('Failed to delete event')
      }
    }
  }

  return (
    <AdminPageLayout title="Events" subtitle="Create and manage events">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Link href="/admin/events/create">
            <button className={`${BUTTON_PRIMARY} flex items-center gap-2`}>
              <Plus className="w-4 h-4" />
              Create Event
            </button>
          </Link>
        </div>

        <AdminTable
          title="All Events"
          columns={columns}
          data={events}
          loading={loading}
          searchPlaceholder="Search by event name or location..."
          onEdit={(event) => {
            window.location.href = `/admin/events/${event.id}`
          }}
          onDelete={handleDelete}
        />
      </div>
    </AdminPageLayout>
  )
}
