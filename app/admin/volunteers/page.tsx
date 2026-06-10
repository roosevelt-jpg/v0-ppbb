'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { AdminTable } from '@/components/admin-table'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Subscribe to real-time volunteer updates
    const q = query(collection(db, 'users'), where('role', 'in', ['volunteer', 'member+volunteer']))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const volunteerData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[]
        setVolunteers(volunteerData.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)))
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching volunteers:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const columns = [
    {
      key: 'name',
      label: 'Name',
      width: '200px',
    },
    {
      key: 'email',
      label: 'Email',
      width: '250px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value}</span>,
    },
    {
      key: 'location',
      label: 'Location',
      width: '150px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value || '-'}</span>,
    },
    {
      key: 'volunteerHours',
      label: 'Hours',
      width: '100px',
      render: (value: any) => <span style={{ fontWeight: 600, color: '#111111' }}>{value || 0}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '100px',
      render: (value: any) => (
        <span
          style={{
            backgroundColor: value === 'active' ? '#e8f5e9' : '#fff3e0',
            color: value === 'active' ? '#2e7d32' : '#e65100',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {value || 'active'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
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
      <AdminHeader title="Volunteers" subtitle="Manage volunteer profiles and track volunteer hours" />
      <div className="px-8">
        <AdminTable
          title="All Volunteers"
          columns={columns}
          data={volunteers}
          loading={loading}
          searchPlaceholder="Search by name, email, or location..."
          onEdit={(item) => {
            // TODO: Open volunteer detail modal
            console.log('Edit volunteer:', item)
          }}
          onDelete={(item) => {
            // TODO: Open delete confirmation
            console.log('Delete volunteer:', item)
          }}
        />
      </div>
    </div>
  )
}
