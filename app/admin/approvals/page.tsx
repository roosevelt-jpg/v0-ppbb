'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { AdminTable } from '@/components/admin-table'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Dialog } from '@/components/dialog'
import { adminApiFetch } from '@/lib/admin-api-client'
import type { ApprovalItem } from '@/lib/admin-approvals-server'
import { Check, X, ExternalLink, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { BUTTON_PRIMARY, BUTTON_DANGER, BUTTON_SECONDARY } from '@/lib/admin-design-system'

const TYPE_LABELS: Record<string, string> = {
  beneficiary: 'Beneficiary',
  vendor: 'Vendor',
  business: 'Business',
  offer: 'Offer',
  job: 'Job',
  discount: 'Discount',
  event: 'Event',
  donation: 'Donation',
  community: 'Community',
  group: 'Group',
  partnership: 'Partnership',
}

export default function ApprovalsPage() {
  const [pendingItems, setPendingItems] = React.useState<ApprovalItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedItem, setSelectedItem] = React.useState<ApprovalItem | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState(false)

  const loadApprovals = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApiFetch<ApprovalItem[]>('/api/admin/approvals')
      if (!res.success) {
        setError(res.error || 'Failed to load approvals')
        setPendingItems([])
        return
      }
      setPendingItems(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals')
      setPendingItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadApprovals()
  }, [loadApprovals])

  const runAction = async (item: ApprovalItem, action: 'approve' | 'reject') => {
    if (item.type === 'vendor' && action === 'approve') {
      window.location.href = item.href
      return
    }

    setActionLoading(true)
    try {
      const res = await adminApiFetch('/api/admin/approvals', {
        method: 'PATCH',
        body: JSON.stringify({
          type: item.type,
          id: item.id,
          action,
          communityId: item.communityId,
        }),
      })
      if (!res.success) {
        alert(res.error || 'Action failed')
        return
      }
      setDetailsOpen(false)
      setSelectedItem(null)
      await loadApprovals()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
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
      width: '120px',
      render: (value: string) => (
        <span
          style={{
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
          }}
        >
          {TYPE_LABELS[value] || value}
        </span>
      ),
    },
    {
      key: 'submittedBy',
      label: 'Submitted By',
      width: '200px',
      render: (value: string) => <span style={{ color: '#888888' }}>{value || '—'}</span>,
    },
    {
      key: 'createdAt',
      label: 'Submitted',
      width: '150px',
      render: (value: string | null) => {
        if (!value) return '—'
        const date = new Date(value)
        return (
          <span style={{ color: '#888888' }}>
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
        )
      },
    },
    {
      key: 'href',
      label: '',
      width: '80px',
      render: (_: string, row: ApprovalItem) => (
        <Link
          href={row.href}
          className="inline-flex items-center gap-1 text-xs text-neutral-700 underline"
        >
          Open <ExternalLink className="w-3 h-3" />
        </Link>
      ),
    },
  ]

  return (
    <AdminPageLayout title="Approvals" subtitle="Review and approve pending items across the platform">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-600">
            {loading ? 'Loading…' : `${pendingItems.length} item(s) awaiting review`}
          </p>
          <button
            type="button"
            onClick={() => void loadApprovals()}
            disabled={loading}
            className={`${BUTTON_SECONDARY} inline-flex items-center gap-2`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <AdminTable
          title="Pending Approvals"
          columns={columns}
          data={pendingItems}
          loading={loading}
          searchPlaceholder="Search pending items..."
          onEdit={(item) => {
            setSelectedItem(item as ApprovalItem)
            setDetailsOpen(true)
          }}
        />

        <Dialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          title={selectedItem ? `Review ${TYPE_LABELS[selectedItem.type] || selectedItem.type}` : 'Review'}
          description={selectedItem?.title}
          footer={
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                disabled={actionLoading}
                className={BUTTON_SECONDARY}
              >
                Close
              </button>
              {selectedItem?.href ? (
                <Link href={selectedItem.href} className={BUTTON_SECONDARY}>
                  Open full page
                </Link>
              ) : null}
              <button
                onClick={() => selectedItem && void runAction(selectedItem, 'reject')}
                disabled={actionLoading || !selectedItem}
                className={BUTTON_DANGER}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </button>
              <button
                onClick={() => selectedItem && void runAction(selectedItem, 'approve')}
                disabled={actionLoading || !selectedItem}
                className={BUTTON_PRIMARY}
              >
                <Check className="h-4 w-4 mr-2" />
                {actionLoading
                  ? 'Processing…'
                  : selectedItem?.type === 'vendor'
                    ? 'Open to approve'
                    : 'Approve'}
              </button>
            </div>
          }
        >
          {selectedItem ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-neutral-900">Description</h3>
                <p className="text-neutral-600">
                  {selectedItem.description || 'No description provided'}
                </p>
              </div>

              {selectedItem.amount != null && (
                <div>
                  <h3 className="font-semibold mb-2 text-neutral-900">Amount</h3>
                  <p className="text-neutral-900">AED {selectedItem.amount.toLocaleString()}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2 text-neutral-900">Status</h3>
                <p className="text-orange-600 font-medium">Pending review</p>
              </div>
            </div>
          ) : null}
        </Dialog>
      </div>
    </AdminPageLayout>
  )
}
