'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminTable } from '@/components/admin-table'
import { EditEventModal } from '@/components/edit-event-modal'
import { db } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'

export default function EventsPage() {
  const [events, setEvents] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null)
  const [editModalOpen, setEditModalOpen] = React.useState(false)

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
      key: 'name',
      label: 'Event Name',
      width: '250px',
      render: (value: any) => <span style={{ fontWeight: 500, color: '#111111' }}>{value}</span>,
    },
    {
      key: 'location',
      label: 'Location',
      width: '200px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value || '-'}</span>,
    },
    {
      key: 'attendees',
      label: 'Attendees',
      width: '100px',
      render: (value: any) => <span style={{ fontWeight: 600, color: '#111111' }}>{value || 0}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '120px',
      render: (value: any) => {
        const statusColors: any = {
          upcoming: '#e3f2fd',
          ongoing: '#e8f5e9',
          completed: '#f3e5f5',
          cancelled: '#ffebee',
        }
        const statusTextColors: any = {
          upcoming: '#1565c0',
          ongoing: '#2e7d32',
          completed: '#6a1b9a',
          cancelled: '#c62828',
        }
        return (
          <span
            style={{
              backgroundColor: statusColors[value] || '#f7f6f2',
              color: statusTextColors[value] || '#111111',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {value || 'upcoming'}
          </span>
        )
      },
    },
    {
      key: 'createdAt',
      label: 'Created',
      width: '150px',
      render: (value: any) => {
        if (!value) return '-'
        const date = value.toDate ? value.toDate() : new Date(value)
        return <span style={{ color: '#888888' }}>{formatDistanceToNow(date, { addSuffix: true })}</span>
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      render: (_: any, row: any) => (
        <a
          href={`/admin/events/${row.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: '#0066cc',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
          }}
          className="hover:underline"
        >
          View Details →
        </a>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="px-8">
        <AdminTable
          title="All Events"
          columns={columns}
          data={events}
          loading={loading}
          searchPlaceholder="Search by event name or location..."
          onEdit={(event) => {
            setSelectedEvent(event)
            setEditModalOpen(true)
          }}
          onDelete={async (item) => {
            if (confirm('Are you sure you want to delete this event?')) {
              try {
                const { updateDocument } = await import('@/lib/admin-queries')
                await updateDocument('events', item.id, { status: 'cancelled', updatedAt: new Date() })
              } catch (error) {
                console.error('[v0] Error deleting event:', error)
                alert('Failed to delete event')
              }
            }
          }}
        />
      </div>

      {/* Edit Event Modal */}
      <EditEventModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        event={selectedEvent}
        onSuccess={() => {
          setEditModalOpen(false)
          setSelectedEvent(null)
        }}
      />
    </div>
  )
}
