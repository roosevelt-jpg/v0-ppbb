'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { AdminTable } from '@/components/admin-table'
import { EditCharityModal } from '@/components/edit-charity-modal'
import { db } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'

export default function CharityCasesPage() {
  const [cases, setCases] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedCase, setSelectedCase] = React.useState<any>(null)
  const [editModalOpen, setEditModalOpen] = React.useState(false)

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'charityCases'),
      (snapshot) => {
        const caseData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[]
        setCases(caseData.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)))
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching charity cases:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const columns = [
    {
      key: 'title',
      label: 'Case Title',
      width: '300px',
      render: (value: any) => <span style={{ fontWeight: 500, color: '#111111' }}>{value}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      width: '150px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value || '-'}</span>,
    },
    {
      key: 'targetAmount',
      label: 'Target (AED)',
      width: '150px',
      render: (value: any) => <span style={{ fontWeight: 600, color: '#111111' }}>{value || 0}</span>,
    },
    {
      key: 'collectedAmount',
      label: 'Collected (AED)',
      width: '150px',
      render: (value: any) => <span style={{ fontWeight: 600, color: '#2e7d32' }}>{value || 0}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '120px',
      render: (value: any) => (
        <span
          style={{
            backgroundColor: value === 'active' ? '#e8f5e9' : value === 'completed' ? '#f3e5f5' : '#fff3e0',
            color: value === 'active' ? '#2e7d32' : value === 'completed' ? '#6a1b9a' : '#e65100',
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
      <AdminHeader title="Charity Cases" subtitle="Manage community charity cases and fundraising campaigns" />
      <div className="px-8">
        <AdminTable
          title="All Charity Cases"
          columns={columns}
          data={cases}
          loading={loading}
          searchPlaceholder="Search by case title or category..."
        onEdit={(item) => {
          setSelectedCase(item)
          setEditModalOpen(true)
        }}
          onDelete={async (item) => {
            if (confirm('Are you sure you want to delete this charity request?')) {
              try {
                const { updateDocument } = await import('@/lib/admin-queries')
                await updateDocument('charityRequests', item.id, { status: 'archived', updatedAt: new Date() })
              } catch (error) {
                console.error('[v0] Error deleting charity:', error)
                alert('Failed to delete charity request')
              }
            }
          }}
        />
      </div>

      {selectedCase && (
        <EditCharityModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setSelectedCase(null)
          }}
          charityCase={selectedCase}
        />
      )}
    </div>
  )
}
