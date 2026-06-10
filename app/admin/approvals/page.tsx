'use client'

import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { AdminTable } from '@/components/admin-table'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'

export default function ApprovalsPage() {
  const [pendingItems, setPendingItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Subscribe to pending charity cases
    const charityCasesUnsubscribe = onSnapshot(
      query(collection(db, 'charityRequests'), where('status', '==', 'pending')),
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          type: 'charity',
          ...doc.data(),
        }))
        setPendingItems((prev) => [...prev.filter((i) => i.type !== 'charity'), ...items])
        setLoading(false)
      }
    )

    return () => {
      charityCasesUnsubscribe()
    }
  }, [])

  const columns = [
    {
      key: 'title',
      label: 'Title',
      width: '250px',
    },
    {
      key: 'type',
      label: 'Type',
      width: '100px',
      render: (value: any) => (
        <span
          style={{
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            textTransform: 'capitalize',
          }}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'submittedBy',
      label: 'Submitted By',
      width: '200px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value || '-'}</span>,
    },
    {
      key: 'createdAt',
      label: 'Submitted',
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
      <AdminHeader title="Approvals" subtitle="Review and manage pending submissions" />
      <div className="px-8">
        <AdminTable
          title="Pending Approvals"
          columns={columns}
          data={pendingItems}
          loading={loading}
          searchPlaceholder="Search pending items..."
          onEdit={(item) => {
            console.log('Review item:', item)
          }}
          onDelete={(item) => {
            console.log('Reject item:', item)
          }}
        />
      </div>
    </div>
  )
}
