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
import { BUTTON_PRIMARY } from '@/lib/admin-design-system'

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
  contact: 'Contact',
  form_submission: 'Form',
}

export default function ApprovalsPage() {
  const [pendingItems, setPendingItems] = React.useState<ApprovalItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedItem, setSelectedItem] = React.useState<ApprovalItem | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [tab, setTab] = React.useState<'listings' | 'forms'>('forms')

  const FORM_TYPES = new Set([
    'partnership',
    'beneficiary',
    'donation',
    'contact',
    'form_submission',
  ])
  const LISTING_TYPES = new Set([
    'business',
    'offer',
    'job',
    'discount',
    'event',
    'vendor',
    'community',
    'group',
  ])

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

  const filteredItems = React.useMemo(() => {
    if (tab === 'forms') {
      return pendingItems.filter((i) => FORM_TYPES.has(i.type) || i.type === 'partnership')
    }
    return pendingItems.filter((i) => LISTING_TYPES.has(i.type) || !FORM_TYPES.has(i.type))
  }, [pendingItems, tab])

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
    <AdminPageLayout
      title="Approvals"
      subtitle="Two queues: form inquiries, and businesses / events / products"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('listings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] bg-black text-white hover:bg-neutral-800 ${
              tab === 'listings' ? 'ring-2 ring-offset-1 ring-black' : 'opacity-70'
            }`}
          >
            Businesses, events &amp; products
          </button>
          <button
            type="button"
            onClick={() => setTab('forms')}
            className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] bg-black text-white hover:bg-neutral-800 ${
              tab === 'forms' ? 'ring-2 ring-offset-1 ring-black' : 'opacity-70'
            }`}
          >
            Form inquiries
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-600">
            {loading ? 'Loading…' : `${filteredItems.length} item(s) in this queue`}
          </p>
          <button
            type="button"
            onClick={() => void loadApprovals()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] bg-black text-white hover:bg-neutral-800 disabled:opacity-50"
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
          title={tab === 'forms' ? 'Form inquiries' : 'Listings awaiting review'}
          columns={columns}
          data={filteredItems}
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
                className={BUTTON_PRIMARY}
              >
                Close
              </button>
              {selectedItem?.href ? (
                <Link href={selectedItem.href} className={BUTTON_PRIMARY}>
                  Open full page
                </Link>
              ) : null}
              <button
                onClick={() => selectedItem && void runAction(selectedItem, 'reject')}
                disabled={actionLoading || !selectedItem}
                className={BUTTON_PRIMARY}
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
