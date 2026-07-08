'use client'

export const dynamic = 'force-dynamic'
import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { AdminTable } from '@/components/admin-table'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { updateDocument } from '@/lib/admin-queries'
import { useAuth } from '@/lib/auth-context'
import { getUserDisplayName } from '@/lib/user-profile'
import { Check, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { BUTTON_PRIMARY, BUTTON_DANGER } from '@/lib/admin-design-system'

export default function ApprovalsPage() {
  const { user } = useAuth()
  const [pendingItems, setPendingItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
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
      },
      (error) => {
        console.error('[v0] Error fetching approvals:', error)
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
      await updateDocument(
        selectedItem.collection,
        selectedItem.id,
        {
          status: 'approved',
          approvedAt: new Date(),
        },
        user
          ? {
              adminId: user.id,
              adminEmail: user.email,
              adminName: getUserDisplayName(user),
              adminRole: user.role,
              actionType: 'approve',
              action: `Approved ${selectedItem.type}: ${selectedItem.title || selectedItem.id}`,
              entityType: selectedItem.type || 'other',
              entityId: selectedItem.id,
              entityName: selectedItem.title || selectedItem.id,
            }
          : undefined
      )
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
      await updateDocument(
        selectedItem.collection,
        selectedItem.id,
        {
          status: 'rejected',
          rejectedAt: new Date(),
        },
        user
          ? {
              adminId: user.id,
              adminEmail: user.email,
              adminName: getUserDisplayName(user),
              adminRole: user.role,
              actionType: 'reject',
              action: `Rejected ${selectedItem.type}: ${selectedItem.title || selectedItem.id}`,
              entityType: selectedItem.type || 'other',
              entityId: selectedItem.id,
              entityName: selectedItem.title || selectedItem.id,
            }
          : undefined
      )
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
    <AdminPageLayout title="Approvals" subtitle="Review and approve pending items">
      <div className="space-y-6">
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
                className="text-neutral-600 hover:text-neutral-900"
              >
                Close
              </Button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className={BUTTON_DANGER}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className={BUTTON_PRIMARY}
              >
                <Check className="h-4 w-4 mr-2" />
                {actionLoading ? 'Approving...' : 'Approve'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 text-neutral-900">Description</h3>
              <p className="text-neutral-600">{selectedItem?.description || 'No description provided'}</p>
            </div>

            {selectedItem?.amount && (
              <div>
                <h3 className="font-semibold mb-2 text-neutral-900">Amount</h3>
                <p className="text-neutral-900">AED {selectedItem.amount.toLocaleString()}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2 text-neutral-900">Status</h3>
              <p className="text-orange-600 font-medium">Pending Review</p>
            </div>
          </div>
        </Dialog>
      </div>
    </AdminPageLayout>
  )
}
