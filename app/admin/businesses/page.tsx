'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { AdminTable } from '@/components/admin-table'
import { db } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'

export default function BusinessesPage() {
  const [businesses, setBusinesses] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'businesses'),
      (snapshot) => {
        const businessData: any[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setBusinesses(businessData)
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching businesses:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const columns = [
    {
      key: 'name',
      label: 'Business Name',
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
      key: 'location',
      label: 'Location',
      width: '200px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value || '-'}</span>,
    },
    {
      key: 'phone',
      label: 'Phone',
      width: '150px',
      render: (value: any) => <span style={{ color: '#888888', fontSize: '12px' }}>{value || '-'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '120px',
      render: (value: any) => (
        <span
          style={{
            backgroundColor: value === 'active' ? '#e8f5e9' : value === 'verified' ? '#e3f2fd' : '#fff3e0',
            color: value === 'active' ? '#2e7d32' : value === 'verified' ? '#1565c0' : '#e65100',
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
      key: 'createdAt',
      label: 'Listed',
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
      <AdminHeader title="Businesses" subtitle="Manage registered businesses and merchant partners" />
      <div className="px-8">
        <AdminTable
          title="All Businesses"
          columns={columns}
          data={businesses}
          loading={loading}
          searchPlaceholder="Search by business name, category, or location..."
          onEdit={(item) => {
            console.log('Edit business:', item)
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
      </div>
    </div>
  )
}
