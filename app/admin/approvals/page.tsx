'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { AdminTable } from '@/components/admin-table'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Dialog } from '@/components/dialog'
import { adminApiFetch } from '@/lib/admin-api-client'
import type { ApprovalItem } from '@/lib/admin-approvals-server'
import { Check, X, ExternalLink, RefreshCw, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { BUTTON_OUTLINE, BUTTON_PRIMARY, FILTER_PILL_ACTIVE, FILTER_PILL_INACTIVE } from '@/lib/admin-design-system'

/** Display labels — Approvals only shows form inquiries + businesses / events / products */
const TYPE_LABELS: Record<string, string> = {
  beneficiary: 'Beneficiary',
  business: 'Business',
  offer: 'Product / service',
  discount: 'Product / service',
  event: 'Event',
  donation: 'Donation',
  partnership: 'Partnership',
  contact: 'Contact',
  form_submission: 'Form',
}

function shortenSubmitter(value: string | undefined): string {
  if (!value) return '—'
  if (value.includes('@') || value.includes(' ')) return value
  if (value.length > 18) return `${value.slice(0, 10)}…`
  return value
}

export default function ApprovalsPage() {
  const [pendingItems, setPendingItems] = React.useState<ApprovalItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedItem, setSelectedItem] = React.useState<ApprovalItem | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [tab, setTab] = React.useState<'forms' | 'listings'>('forms')

  const openReview = (item: ApprovalItem) => {
    setSelectedItem(item)
    setDetailsOpen(true)
  }

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

  const formsCount = React.useMemo(
    () => pendingItems.filter((i) => i.queue === 'forms').length,
    [pendingItems]
  )
  const listingsCount = React.useMemo(
    () => pendingItems.filter((i) => i.queue === 'listings').length,
    [pendingItems]
  )

  const filteredItems = React.useMemo(
    () =>
      tab === 'forms'
        ? pendingItems.filter((i) => i.queue === 'forms')
        : pendingItems.filter((i) => i.queue === 'listings'),
    [pendingItems, tab]
  )

  const runAction = async (item: ApprovalItem, action: 'approve' | 'reject') => {
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
      width: '240px',
    },
    {
      key: 'type',
      label: 'Category',
      width: '140px',
      render: (value: string) => (
        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-neutral-100 text-neutral-900 border border-neutral-200">
          {TYPE_LABELS[value] || value}
        </span>
      ),
    },
    {
      key: 'submittedBy',
      label: 'Submitted By',
      width: '180px',
      render: (value: string) => (
        <span className="text-neutral-600 text-sm break-all">{shortenSubmitter(value)}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Submitted',
      width: '130px',
      render: (value: string | null) => {
        if (!value) return '—'
        const date = new Date(value)
        return (
          <span className="text-neutral-600 text-sm">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
        )
      },
    },
    {
      key: 'id',
      label: 'Actions',
      width: '100px',
      render: (_: string, row: ApprovalItem) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            openReview(row)
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-black underline"
        >
          <Eye className="w-3.5 h-3.5" /> View
        </button>
      ),
    },
  ]

  return (
    <AdminPageLayout
      title="Approvals"
      subtitle="Two queues only — form inquiries, or businesses / events / products"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('forms')}
            className={tab === 'forms' ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
          >
            Form inquiries ({formsCount})
          </button>
          <button
            type="button"
            onClick={() => setTab('listings')}
            className={tab === 'listings' ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
          >
            Businesses, events &amp; products ({listingsCount})
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-600">
            {loading
              ? 'Loading…'
              : tab === 'forms'
                ? `${filteredItems.length} inquiry(ies) — partnerships, volunteers, contact, and custom forms`
                : `${filteredItems.length} listing(s) — businesses, events, and products/services`}
          </p>
          <button
            type="button"
            onClick={() => void loadApprovals()}
            disabled={loading}
            className={`${BUTTON_PRIMARY} gap-1 disabled:opacity-50`}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <AdminTable
          title={
            tab === 'forms'
              ? 'Form inquiries'
              : 'Businesses, events & products'
          }
          columns={columns}
          data={filteredItems}
          loading={loading}
          searchPlaceholder="Search by title, category, or submitter…"
          showActionsColumn={false}
        />

        <Dialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          title={selectedItem ? `Review · ${TYPE_LABELS[selectedItem.type] || selectedItem.type}` : 'Review'}
          description={selectedItem?.title}
          footer={
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                disabled={actionLoading}
                className={BUTTON_OUTLINE}
              >
                Close
              </button>
              {selectedItem?.href ? (
                <Link href={selectedItem.href} className={BUTTON_OUTLINE}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  {selectedItem.destinationLabel
                    ? `Open ${selectedItem.destinationLabel}`
                    : 'Open admin page'}
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => selectedItem && void runAction(selectedItem, 'reject')}
                disabled={actionLoading || !selectedItem}
                className={BUTTON_PRIMARY}
              >
                <X className="h-4 w-4" />
                Reject
              </button>
              <button
                type="button"
                onClick={() => selectedItem && void runAction(selectedItem, 'approve')}
                disabled={actionLoading || !selectedItem}
                className={BUTTON_PRIMARY}
              >
                <Check className="h-4 w-4" />
                {actionLoading ? 'Processing…' : 'Approve'}
              </button>
            </div>
          }
        >
          {selectedItem ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Category</p>
                  <p className="font-semibold text-neutral-900">
                    {TYPE_LABELS[selectedItem.type] || selectedItem.type}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Submitted by</p>
                  <p className="font-semibold text-neutral-900 break-all">
                    {selectedItem.submittedBy || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Submitted</p>
                  <p className="font-semibold text-neutral-900">
                    {selectedItem.createdAt
                      ? new Date(selectedItem.createdAt).toLocaleString()
                      : '—'}
                  </p>
                </div>
                {selectedItem.amount != null ? (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Amount</p>
                    <p className="font-semibold text-neutral-900">
                      AED {selectedItem.amount.toLocaleString()}
                    </p>
                  </div>
                ) : null}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Summary</p>
                <p className="text-neutral-700 whitespace-pre-wrap">
                  {selectedItem.description || 'No summary'}
                </p>
              </div>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                  Full inquiry / details
                </p>
                <p className="text-neutral-800 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {selectedItem.message ||
                    selectedItem.description ||
                    'No additional details were provided with this request.'}
                </p>
              </div>
            </div>
          ) : null}
        </Dialog>
      </div>
    </AdminPageLayout>
  )
}
