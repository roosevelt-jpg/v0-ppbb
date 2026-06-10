'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { AdminTable } from '@/components/admin-table'
import { EditDonationModal } from '@/components/edit-donation-modal'
import { db } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'

export default function DonationsPage() {
  const [donations, setDonations] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedDonation, setSelectedDonation] = React.useState<any>(null)
  const [editModalOpen, setEditModalOpen] = React.useState(false)

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'donations'),
      (snapshot) => {
        const donationData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[]
        setDonations(donationData.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)))
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching donations:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const columns = [
    {
      key: 'donorName',
      label: 'Donor',
      width: '200px',
      render: (value: any) => <span style={{ fontWeight: 500, color: '#111111' }}>{value || 'Anonymous'}</span>,
    },
    {
      key: 'amount',
      label: 'Amount (AED)',
      width: '150px',
      render: (value: any) => <span style={{ fontWeight: 600, color: '#2e7d32' }}>{value || 0}</span>,
    },
    {
      key: 'type',
      label: 'Type',
      width: '120px',
      render: (value: any) => (
        <span style={{ color: '#888888', textTransform: 'capitalize' }}>
          {value || 'monetary'}
        </span>
      ),
    },
    {
      key: 'targetCase',
      label: 'Target Case',
      width: '200px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value || 'General'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '120px',
      render: (value: any) => (
        <span
          style={{
            backgroundColor: value === 'completed' ? '#e8f5e9' : value === 'pending' ? '#fff3e0' : '#ffebee',
            color: value === 'completed' ? '#2e7d32' : value === 'pending' ? '#e65100' : '#c62828',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {value || 'pending'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      width: '150px',
      render: (value: any) => {
        if (!value) return '-'
        const date = value.toDate ? value.toDate() : new Date(value)
        return <span style={{ color: '#888888' }}>{formatDistanceToNow(date, { addSuffix: true })}</span>
      },
    },
  ]

  const totalDonations = donations.reduce((sum, d) => sum + (d.amount || 0), 0)

  return (
    <div className="space-y-6">
      <AdminHeader title="Donations" subtitle="Track all donations and monetary contributions" />
      <div className="px-8">
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#f7f6f2', borderLeft: '4px solid #2e7d32' }}>
          <p style={{ color: '#888888', fontSize: '14px' }}>Total Donations</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#111111' }}>AED {totalDonations.toLocaleString()}</p>
        </div>

        <AdminTable
          title="All Donations"
          columns={columns}
          data={donations}
          loading={loading}
          searchPlaceholder="Search by donor name or case..."
          onEdit={(donation) => {
            setSelectedDonation(donation)
            setEditModalOpen(true)
          }}
          onDelete={async (item) => {
            if (confirm('Are you sure you want to delete this donation record?')) {
              try {
                const { updateDocument } = await import('@/lib/admin-queries')
                await updateDocument('donations', item.id, { status: 'cancelled', updatedAt: new Date() })
              } catch (error) {
                console.error('[v0] Error deleting donation:', error)
                alert('Failed to delete donation')
              }
            }
          }}
        />
      </div>

      {/* Edit Donation Modal */}
      <EditDonationModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        donation={selectedDonation}
        onSuccess={() => {
          setEditModalOpen(false)
          setSelectedDonation(null)
        }}
      />
    </div>
  )
}
