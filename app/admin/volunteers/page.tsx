'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminTable } from '@/components/admin-table'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { AdminUserCell } from '@/components/admin-user-cell'
import { formatUserPhoneDisplay } from '@/lib/user-profile'
import { EditVolunteerModal } from '@/components/edit-volunteer-modal'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedVolunteer, setSelectedVolunteer] = React.useState<any>(null)
  const [editModalOpen, setEditModalOpen] = React.useState(false)

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
      label: 'Volunteer',
      width: '240px',
      render: (_: unknown, row: Record<string, unknown>) => (
        <AdminUserCell user={row as Parameters<typeof AdminUserCell>[0]['user']} hideSubtitle />
      ),
    },
    {
      key: 'email',
      label: 'Email',
      width: '220px',
      render: (value: unknown) => (
        <span style={{ color: '#888888' }}>{String(value || '—')}</span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      width: '150px',
      render: (_: unknown, row: Record<string, unknown>) => (
        <span style={{ color: '#888888' }}>{formatUserPhoneDisplay(row as Parameters<typeof formatUserPhoneDisplay>[0])}</span>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      width: '150px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value || '-'}</span>,
    },
    {
      key: 'volunteeredHours',
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
    {
      key: 'details',
      label: 'Details',
      width: '120px',
      render: (_: any, row: any) => (
        <a
          href={`/admin/volunteers/${row.id}`}
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

  const handleEditVolunteer = (volunteer: any) => {
    setSelectedVolunteer(volunteer)
    setEditModalOpen(true)
  }

  return (
    <AdminPageLayout title="Volunteers" subtitle="Manage and track volunteers">
      <div className="space-y-6">
        <AdminTable
          title="All Volunteers"
          columns={columns}
          data={volunteers}
          loading={loading}
          searchPlaceholder="Search by name, email, or location..."
          onEdit={handleEditVolunteer}
          onDelete={(volunteer) => {
            if (confirm(`Are you sure you want to delete ${volunteer.firstName}?`)) {
              console.log('Delete volunteer:', volunteer)
            }
          }}
        />

        {/* Edit Volunteer Modal */}
        <EditVolunteerModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          volunteer={selectedVolunteer}
          onSuccess={() => {
            setEditModalOpen(false)
            setSelectedVolunteer(null)
          }}
        />
      </div>
    </AdminPageLayout>
  )
}
