'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { AdminTable } from '@/components/admin-table'
import { db } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'

export default function SponsorsPage() {
  const [sponsors, setSponsors] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'sponsors'),
      (snapshot) => {
        const sponsorData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[]
        setSponsors(sponsorData.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)))
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching sponsors:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const columns = [
    {
      key: 'name',
      label: 'Sponsor Name',
      width: '250px',
      render: (value: any) => <span style={{ fontWeight: 500, color: '#111111' }}>{value}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      width: '150px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value || '-'}</span>,
    },
    {
      key: 'contactPerson',
      label: 'Contact Person',
      width: '200px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value || '-'}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      width: '200px',
      render: (value: any) => <span style={{ color: '#888888', fontSize: '12px' }}>{value || '-'}</span>,
    },
    {
      key: 'sponsorshipLevel',
      label: 'Level',
      width: '120px',
      render: (value: any) => {
        const levelColors: any = {
          gold: '#FFD700',
          silver: '#C0C0C0',
          bronze: '#CD7F32',
          standard: '#888888',
        }
        return (
          <span
            style={{
              backgroundColor: `${levelColors[value] || '#888888'}20`,
              color: levelColors[value] || '#888888',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {value || 'standard'}
          </span>
        )
      },
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
      <AdminHeader title="Sponsors" subtitle="Manage corporate sponsors and sponsorship partnerships" />
      <div className="px-8">
        <AdminTable
          title="All Sponsors"
          columns={columns}
          data={sponsors}
          loading={loading}
          searchPlaceholder="Search by sponsor name, category, or contact..."
          onEdit={(item) => {
            console.log('Edit sponsor:', item)
          }}
          onDelete={async (item) => {
            if (confirm('Are you sure you want to delete this sponsor?')) {
              try {
                const { updateDocument } = await import('@/lib/admin-queries')
                await updateDocument('sponsors', item.id, { status: 'inactive', updatedAt: new Date() })
              } catch (error) {
                console.error('[v0] Error deleting sponsor:', error)
                alert('Failed to delete sponsor')
              }
            }
          }}
        />
      </div>
    </div>
  )
}
