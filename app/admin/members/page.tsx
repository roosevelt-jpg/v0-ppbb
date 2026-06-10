'use client'

import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { AdminTable } from '@/components/admin-table'
import { EditMemberModal } from '@/components/edit-member-modal'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'

export default function MembersPage() {
  const [members, setMembers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedMember, setSelectedMember] = React.useState<any>(null)
  const [editModalOpen, setEditModalOpen] = React.useState(false)

  React.useEffect(() => {
    // Subscribe to real-time member updates
    const q = query(collection(db, 'users'), where('role', 'in', ['member', 'member+volunteer']))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const memberData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setMembers(memberData.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)))
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching members:', error)
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

  const handleEditMember = (member: any) => {
    setSelectedMember(member)
    setEditModalOpen(true)
  }

  const handleDeleteMember = (member: any) => {
    if (confirm(`Are you sure you want to delete ${member.name}?`)) {
      console.log('Delete member:', member)
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeader title="Members" subtitle="Manage member accounts and profile information" />
      <div className="px-8">
        <AdminTable
          title="All Members"
          columns={columns}
          data={members}
          loading={loading}
          searchPlaceholder="Search by name, email, or location..."
          onEdit={handleEditMember}
          onDelete={handleDeleteMember}
        />
      </div>

      {/* Edit Member Modal */}
      <EditMemberModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        member={selectedMember}
        onSuccess={() => {
          setEditModalOpen(false)
          setSelectedMember(null)
        }}
      />
    </div>
  )
}
