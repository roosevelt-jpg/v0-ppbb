'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminTable } from '@/components/admin-table'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { AdminUserCell } from '@/components/admin-user-cell'
import { formatUserPhoneDisplay } from '@/lib/user-profile'
import { EditVolunteerModal } from '@/components/edit-volunteer-modal'
import { AdminUserProfileModal, AdminViewProfileButton } from '@/components/admin-user-profile-modal'
import { profileFromVolunteer } from '@/lib/admin-profile-view'
import type { AdminProfileViewData } from '@/lib/admin-profile-view'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { deleteDocument } from '@/lib/admin-queries'
import { useAdminAudit } from '@/lib/use-admin-audit'

export default function VolunteersPage() {
  const audit = useAdminAudit()
  const [volunteers, setVolunteers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedVolunteer, setSelectedVolunteer] = React.useState<any>(null)
  const [editModalOpen, setEditModalOpen] = React.useState(false)
  const [profileOpen, setProfileOpen] = React.useState(false)
  const [activeProfile, setActiveProfile] = React.useState<AdminProfileViewData | null>(null)

  const openProfile = (volunteer: Record<string, unknown>) => {
    setActiveProfile(profileFromVolunteer(volunteer))
    setProfileOpen(true)
  }

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
        <span style={{ color: 'var(--muted-foreground)' }}>{String(value || '—')}</span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      width: '150px',
      render: (_: unknown, row: Record<string, unknown>) => (
        <span style={{ color: 'var(--muted-foreground)' }}>{formatUserPhoneDisplay(row as Parameters<typeof formatUserPhoneDisplay>[0])}</span>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      width: '150px',
      render: (value: any) => <span style={{ color: 'var(--muted-foreground)' }}>{value || '-'}</span>,
    },
    {
      key: 'volunteeredHours',
      label: 'Hours',
      width: '100px',
      render: (value: any) => <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{value || 0}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '100px',
      render: (value: any) => (
        <span
          className={
            value === 'active'
              ? 'bg-secondary text-secondary-foreground'
              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
          }
          style={{
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
        return <span style={{ color: 'var(--muted-foreground)' }}>{formatDistanceToNow(date, { addSuffix: true })}</span>
      },
    },
    {
      key: 'profile',
      label: 'Profile',
      width: '130px',
      render: (_: unknown, row: Record<string, unknown>) => (
        <AdminViewProfileButton compact onClick={() => openProfile(row)} />
      ),
    },
  ]

  const handleEditVolunteer = (volunteer: any) => {
    setSelectedVolunteer(volunteer)
    setEditModalOpen(true)
  }

  const handleDeleteVolunteer = async (volunteer: any) => {
    if (!confirm(`Are you sure you want to delete ${volunteer.firstName || 'this volunteer'}?`)) return

    const result = await deleteDocument('users', volunteer.id)
    if (!result.success) {
      alert('Failed to delete volunteer. Please try again.')
      return
    }
    audit({
      actionType: 'delete',
      action: `Deleted volunteer: ${volunteer.id}`,
      entityType: 'member',
      entityId: volunteer.id,
      status: 'success',
    })
  }

  return (
    <AdminPageLayout
      title="Volunteers"
      subtitle="Individual members who volunteer or join the PB team"
    >
      <div className="space-y-6">
        <AdminTable
          title="All Volunteers"
          columns={columns}
          data={volunteers}
          loading={loading}
          searchPlaceholder="Search by name, email, or location..."
          onEdit={handleEditVolunteer}
          onDelete={(volunteer) => void handleDeleteVolunteer(volunteer)}
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

        <AdminUserProfileModal
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          profile={activeProfile}
          editLabel="Edit volunteer"
          onEdit={
            activeProfile
              ? () => {
                  const match = volunteers.find((v) => v.id === activeProfile.id)
                  if (match) {
                    handleEditVolunteer(match)
                    setProfileOpen(false)
                  }
                }
              : undefined
          }
        />
      </div>
    </AdminPageLayout>
  )
}
