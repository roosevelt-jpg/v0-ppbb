'use client'

export const dynamic = 'force-dynamic'
import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { AdminTable } from '@/components/admin-table'
import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { updateDocument } from '@/lib/admin-queries'
import { Check, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function ApprovalsPage() {
  const [pendingItems, setPendingItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    // Subscribe to pending charity cases
    const charityCasesUnsubscribe = onSnapshot(
      query(collection(db, 'charityRequests'), where('status', '==', 'pending')),
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          type: 'charity',
          collection: 'charityRequests',
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

  const handleApprove = async () => {
    if (!selectedItem) return

    setActionLoading(true)
    try {
      await updateDocument(selectedItem.collection, selectedItem.id, {
        status: 'approved',
        approvedAt: new Date(),
      })
      setDetailsOpen(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('[v0] Error approving item:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedItem) return

    setActionLoading(true)
    try {
      await updateDocument(selectedItem.collection, selectedItem.id, {
        status: 'rejected',
        rejectedAt: new Date(),
      })
      setDetailsOpen(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('[v0] Error rejecting item:', error)
    } finally {
      setActionLoading(false)
    }
  }

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
      <div className="px-8">
        <AdminTable
          title="Pending Approvals"
          columns={columns}
          data={pendingItems}
          loading={loading}
          searchPlaceholder="Search pending items..."
          onEdit={(item) => {
            setSelectedItem(item)
            setDetailsOpen(true)
          }}
        />
      </div>

      {/* Approval Dialog */}
      <Dialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={`Review ${selectedItem?.type}`}
        description={selectedItem?.title}
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              onClick={() => setDetailsOpen(false)}
              disabled={actionLoading}
              style={{ color: '#888888' }}
            >
              Close
            </Button>
            <Button
              onClick={handleReject}
              disabled={actionLoading}
              style={{
                backgroundColor: '#ffebee',
                color: '#c62828',
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
              style={{
                backgroundColor: '#111111',
                color: '#f7f6f2',
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              {actionLoading ? 'Approving...' : 'Approve'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2" style={{ color: '#111111' }}>
              Description
            </h3>
            <p style={{ color: '#888888' }}>{selectedItem?.description || 'No description provided'}</p>
          </div>

          {selectedItem?.amount && (
            <div>
              <h3 className="font-semibold mb-2" style={{ color: '#111111' }}>
                Amount
              </h3>
              <p style={{ color: '#111111' }}>
                AED {selectedItem.amount.toLocaleString()}
              </p>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2" style={{ color: '#111111' }}>
              Status
            </h3>
            <p style={{ color: '#f57c00', fontWeight: '500' }}>Pending Review</p>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
