'use client'

import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { AdminTable } from '@/components/admin-table'
import { db } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'

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
        }))
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
  ]

  return (
    <div className="space-y-6">
      <AdminHeader title="Events" subtitle="Manage community events and track attendance" />
      <div className="px-8">
        <AdminTable
          title="All Events"
          columns={columns}
          data={events}
          loading={loading}
          searchPlaceholder="Search by event name or location..."
          onEdit={(item) => {
            console.log('Edit event:', item)
          }}
          onDelete={(item) => {
            console.log('Delete event:', item)
          }}
        />
      </div>
    </div>
  )
}
