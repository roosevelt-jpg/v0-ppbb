'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminTable } from '@/components/admin-table'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { EditBusinessModal } from '@/components/edit-business-modal'
import { formatDistanceToNow } from 'date-fns'

export default function BusinessesPage() {
  const [businesses, setBusinesses] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedBusiness, setSelectedBusiness] = React.useState<any>(null)
  const [editModalOpen, setEditModalOpen] = React.useState(false)

  React.useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const response = await fetch('/api/admin/businesses')
        if (!response.ok) throw new Error('Failed to fetch')
        const data = await response.json()
        if (data.success) {
          setBusinesses(data.data || [])
        }
      } catch (error) {
        console.error('[v0] Error fetching businesses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [])

  const columns = [
    {
      key: 'businessName',
      label: 'Business Name',
      width: '200px',
      render: (value: any) => <span style={{ fontWeight: 500, color: '#111111' }}>{value || 'N/A'}</span>,
    },
    {
      key: 'businessType',
      label: 'Type',
      width: '150px',
      render: (value: any) => <span style={{ color: '#888888', textTransform: 'capitalize' }}>{value || '-'}</span>,
    },
    {
      key: 'businessLocation',
      label: 'Location',
      width: '180px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value || '-'}</span>,
    },
    {
      key: 'businessPhone',
      label: 'Phone',
      width: '140px',
      render: (value: any) => <span style={{ color: '#888888', fontSize: '12px' }}>{value || '-'}</span>,
    },
    {
      key: 'hasMemberRole',
      label: 'Member Role',
      width: '120px',
      render: (value: any) => (
        <span
          style={{
            backgroundColor: value ? '#e8f5e9' : '#ffebee',
            color: value ? '#2e7d32' : '#c62828',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {value ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '110px',
      render: (value: any) => (
        <span
          style={{
            backgroundColor: value === 'active' ? '#e8f5e9' : '#fff3e0',
            color: value === 'active' ? '#2e7d32' : '#e65100',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
            textTransform: 'capitalize',
          }}
        >
          {value || 'active'}
        </span>
      ),
    },
    {
      key: 'dateJoined',
      label: 'Joined',
      width: '140px',
      render: (value: any) => {
        if (!value) return '-'
        const date = typeof value === 'string' ? new Date(value) : value
        return <span style={{ color: '#888888', fontSize: '12px' }}>{new Date(date).toLocaleDateString()}</span>
      },
    },
  ]

  return (
    <AdminPageLayout title="Businesses" subtitle="Manage and track businesses">
      <div className="space-y-6">
        <AdminTable
          title="All Businesses"
          columns={columns}
          data={businesses}
          loading={loading}
          searchPlaceholder="Search by business name, category, or location..."
          onEdit={(item) => {
            setSelectedBusiness(item)
            setEditModalOpen(true)
          }}
          onDelete={async (item) => {
            if (confirm('Are you sure you want to delete this business?')) {
              try {
                const { updateDocument } = await import('@/lib/admin-queries')
                await updateDocument('users', item.id, { active: false, updatedAt: new Date() })
              } catch (error) {
                console.error('[v0] Error deleting business:', error)
                alert('Failed to delete business')
              }
            }
          }}
        />

        {selectedBusiness && (
          <EditBusinessModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false)
              setSelectedBusiness(null)
            }}
            business={selectedBusiness}
          />
        )}
      </div>
    </AdminPageLayout>
  )
}
