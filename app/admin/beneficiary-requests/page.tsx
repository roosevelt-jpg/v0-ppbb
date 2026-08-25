'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { AdminDetailModal } from '@/components/admin-detail-modal'
import { useAuth } from '@/lib/auth-context'
import { db, auth } from '@/lib/firebase'
import { adminApiFetch } from '@/lib/admin-api-client'
import { canUserAccessSensitiveBeneficiaryDocs } from '@/lib/charity-cases'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_DANGER } from '@/lib/admin-design-system'
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  FileWarning,
  Inbox,
} from 'lucide-react'

type BeneficiaryRow = {
  id: string
  fullName?: string
  name?: string
  email?: string
  emergencyLevel?: string
  status?: string
  createdAt?: string | Date | { seconds?: number; _seconds?: number }
  submissionDate?: string | Date | { seconds?: number; _seconds?: number }
  hasSensitiveDocuments?: boolean
  availableDocuments?: string[]
  sensitiveDocumentsRedacted?: boolean
  reasonCategory?: string
  phoneNumber?: string
  formSubmissionId?: string
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') return new Date(value)
  if (typeof value === 'object') {
    const o = value as { seconds?: number; _seconds?: number; toDate?: () => Date }
    if (typeof o.toDate === 'function') return o.toDate()
    const sec = o.seconds ?? o._seconds
    if (typeof sec === 'number') return new Date(sec * 1000)
  }
  return null
}

function timestampMs(row: BeneficiaryRow): number {
  return (
    toDate(row.submissionDate)?.getTime() ||
    toDate(row.createdAt)?.getTime() ||
    0
  )
}

function sortRequests(rows: BeneficiaryRow[]): BeneficiaryRow[] {
  return [...rows].sort((a, b) => timestampMs(b) - timestampMs(a))
}

async function loadFromFirestore(): Promise<BeneficiaryRow[]> {
  const snap = await getDocs(collection(db, 'beneficiaryRequests'))
  return sortRequests(
    snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BeneficiaryRow, 'id'>) }))
  )
}

export default function BeneficiaryRequestsAdmin() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<BeneficiaryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<BeneficiaryRow | null>(null)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ status: '', emergencyLevel: '' })
  const [usingFirestoreFallback, setUsingFirestoreFallback] = useState(false)
  const [canViewDocsFromApi, setCanViewDocsFromApi] = useState<boolean | null>(null)

  // Prefer adminRole / permissions over membership role (e.g. member who is also super_admin)
  const canViewDocsLocal = canUserAccessSensitiveBeneficiaryDocs(user)
  const canViewDocs = canViewDocsFromApi ?? canViewDocsLocal

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setUsingFirestoreFallback(false)
    try {
      const json = await adminApiFetch<BeneficiaryRow[]>('/api/admin/beneficiary-requests')
      if (typeof json.canViewSensitiveDocuments === 'boolean') {
        setCanViewDocsFromApi(json.canViewSensitiveDocuments)
      }
      if (json.success && Array.isArray(json.data)) {
        setRequests(sortRequests(json.data))
        return
      }

      const rows = await loadFromFirestore()
      setRequests(rows)
      setUsingFirestoreFallback(true)
      if (!json.success && json.error) {
        setError(`Loaded from database directly. (${json.error})`)
      }
    } catch (err) {
      try {
        const rows = await loadFromFirestore()
        setRequests(rows)
        setUsingFirestoreFallback(true)
        setError(
          err instanceof Error
            ? `API unavailable — showing data from database. (${err.message})`
            : 'API unavailable — showing data from database.'
        )
      } catch (fallbackErr) {
        setError(fallbackErr instanceof Error ? fallbackErr.message : 'Failed to load')
        setRequests([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = requests.filter((r) => {
    if (filters.status && r.status !== filters.status) return false
    if (filters.emergencyLevel && r.emergencyLevel !== filters.emergencyLevel) return false
    return true
  })

  const runAction = async (id: string, action: 'review' | 'accept' | 'reject') => {
    setActing(true)
    setError('')
    try {
      const notes =
        action === 'reject'
          ? prompt('Rejection reason:') || ''
          : action === 'accept'
            ? prompt('Acceptance notes (optional):') || ''
            : ''

      const statusMap = {
        review: 'under_review',
        accept: 'approved',
        reject: 'rejected',
      } as const

      const payload = {
        status: statusMap[action],
        reviewedBy: auth.currentUser?.uid || null,
        reviewDate: new Date(),
        reviewNotes: notes || null,
        updatedAt: new Date(),
      }

      const json = await adminApiFetch('/api/admin/beneficiary-requests', {
        method: 'PATCH',
        body: JSON.stringify({ id, action, notes }),
      })

      if (!json.success) {
        await updateDoc(doc(db, 'beneficiaryRequests', id), payload)
      }

      await load()
      setSelected(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActing(false)
    }
  }

  const openReview = async (row: BeneficiaryRow) => {
    setSelected(row)
    try {
      const json = await adminApiFetch<BeneficiaryRow>(
        `/api/admin/beneficiary-requests?id=${encodeURIComponent(row.id)}`
      )
      if (typeof json.canViewSensitiveDocuments === 'boolean') {
        setCanViewDocsFromApi(json.canViewSensitiveDocuments)
      }
      if (json.success && json.data && typeof json.data === 'object') {
        setSelected({ ...row, ...json.data, id: row.id })
      }
    } catch {
      /* keep list row */
    }
  }

  const openSensitiveDoc = async (requestId: string, documentKey: string) => {
    if (!canViewDocs) {
      alert(
        'Your account cannot open sensitive documents. Super admins and Manage Beneficiary permission holders can view them — sign out and back in, then retry.'
      )
      return
    }
    try {
      const json = await adminApiFetch(
        `/api/admin/beneficiary-requests?id=${encodeURIComponent(requestId)}&document=${encodeURIComponent(documentKey)}`
      )
      if (!json.success || !json.url) {
        throw new Error(json.error || 'Document not found or access denied')
      }
      window.open(json.url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Cannot open document')
    }
  }

  const statusIcon = (status?: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'under_review':
      case 'submitted':
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-neutral-400 dark:text-muted-foreground" />
    }
  }

  const btnPrimary = `${BUTTON_PRIMARY} min-h-[36px] px-3 py-1.5 text-sm`
  const btnSecondary = `${BUTTON_SECONDARY} min-h-[36px] px-3 py-1.5 text-sm`
  const btnDanger = `${BUTTON_DANGER} min-h-[36px] px-3 py-1.5 text-sm`

  return (
    <AdminPageLayout
      title="Beneficiary Requests"
      subtitle="Review charity support applications — sensitive documents role-gated server-side"
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded p-3">
            {error}
          </div>
        )}

        {usingFirestoreFallback && !error && (
          <div className="bg-neutral-50 dark:bg-muted border border-neutral-200 dark:border-border text-neutral-700 dark:text-foreground text-sm rounded p-3">
            Showing requests from the database. Document viewing still requires the secure API.
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900">
          Sensitive documents (Emirates ID, salary cert, bank statement) are visible to{' '}
          <strong>super admin</strong>, <strong>admin</strong>, and welfare-tier roles (
          <strong>welfare</strong>, <strong>founder</strong>, <strong>coordinator</strong>,
          founder_admin / manager). Document URLs are never listed in bulk — open them via Review.
          {!canViewDocs && (
            <span className="block mt-1 font-medium">
              Your current session cannot view or download sensitive files. If you are a super
              admin, refresh after signing in again so your admin role is loaded.
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-neutral-300 dark:border-border rounded px-3 py-2 min-h-[36px] text-sm"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filters.emergencyLevel}
            onChange={(e) => setFilters({ ...filters, emergencyLevel: e.target.value })}
            className="border border-neutral-300 dark:border-border rounded px-3 py-2 min-h-[36px] text-sm"
          >
            <option value="">All emergency levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <button type="button" data-dashboard-control onClick={() => void load()} className={btnSecondary}>
            Refresh
          </button>
        </div>

        <div className="bg-white dark:bg-card rounded-lg border border-neutral-100 dark:border-border shadow-sm p-4 sm:p-6">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-neutral-100 dark:bg-muted rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-10 h-10 text-neutral-300 dark:text-muted-foreground mx-auto mb-3" />
              <p className="text-neutral-600 dark:text-muted-foreground">No beneficiary requests</p>
              <p className="text-sm text-neutral-500 dark:text-muted-foreground mt-1">
                Submissions from the charity support form will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {filtered.map((r) => {
                  const when = toDate(r.submissionDate || r.createdAt)
                  return (
                    <div key={r.id} className="border border-neutral-200 dark:border-border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        {statusIcon(r.status)}
                        <span className="font-semibold">{r.fullName || r.name || '—'}</span>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-muted-foreground">{r.email || '—'}</p>
                      <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-muted-foreground">
                        {r.emergencyLevel || '—'} · {r.status || '—'}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-muted-foreground">
                        {when ? when.toLocaleDateString() : '—'}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button type="button" className={btnSecondary} onClick={() => void openReview(r)}>
                          <Eye className="w-4 h-4 inline mr-1" />
                          Review
                        </button>
                        <button
                          type="button"
                          disabled={acting}
                          className={btnPrimary}
                          onClick={() => void runAction(r.id, 'accept')}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={acting}
                          className={btnDanger}
                          onClick={() => void runAction(r.id, 'reject')}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="hidden md:block admin-table-scroll min-w-0">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 dark:text-muted-foreground border-b">
                      <th className="py-3 pr-3">Name</th>
                      <th className="py-3 pr-3">Email</th>
                      <th className="py-3 pr-3">Emergency</th>
                      <th className="py-3 pr-3">Date</th>
                      <th className="py-3 pr-3">Status</th>
                      <th className="py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const when = toDate(r.submissionDate || r.createdAt)
                      return (
                        <tr key={r.id} className="border-b border-neutral-100 dark:border-border">
                          <td className="py-3 pr-3 font-medium">{r.fullName || r.name || '—'}</td>
                          <td className="py-3 pr-3">{r.email || '—'}</td>
                          <td className="py-3 pr-3 capitalize">{r.emergencyLevel || '—'}</td>
                          <td className="py-3 pr-3">{when ? when.toLocaleDateString() : '—'}</td>
                          <td className="py-3 pr-3 capitalize">{r.status || '—'}</td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-2">
                              <button type="button" className="underline" onClick={() => void openReview(r)}>
                                Review
                              </button>
                              <button
                                type="button"
                                className="underline text-neutral-900 dark:text-foreground"
                                disabled={acting}
                                onClick={() => void runAction(r.id, 'accept')}
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                className="bg-black !text-white px-2 py-1 rounded-md no-underline"
                                disabled={acting}
                                onClick={() => void runAction(r.id, 'reject')}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <AdminDetailModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Review request"
        panelClassName="sm:max-w-sm"
        footer={
          <>
            <button
              type="button"
              disabled={acting}
              className={`${btnSecondary} w-full sm:w-auto flex-1`}
              onClick={() => selected && void runAction(selected.id, 'review')}
            >
              Mark under review
            </button>
            <button
              type="button"
              disabled={acting}
              className={`${btnPrimary} w-full sm:w-auto flex-1`}
              onClick={() => selected && void runAction(selected.id, 'accept')}
            >
              Accept
            </button>
            <button
              type="button"
              disabled={acting}
              className={`${btnDanger} w-full sm:w-auto flex-1`}
              onClick={() => selected && void runAction(selected.id, 'reject')}
            >
              Reject
            </button>
            <button
              type="button"
              className={`${btnSecondary} w-full sm:w-auto flex-1`}
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </>
        }
      >
        {selected ? (
          <>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-neutral-500 dark:text-muted-foreground text-xs">Name</dt>
                <dd className="font-medium">{selected.fullName || selected.name}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 dark:text-muted-foreground text-xs">Email</dt>
                <dd>{selected.email}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 dark:text-muted-foreground text-xs">Phone</dt>
                <dd>{selected.phoneNumber || '—'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 dark:text-muted-foreground text-xs">Emergency</dt>
                <dd className="capitalize">{selected.emergencyLevel}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 dark:text-muted-foreground text-xs">Status</dt>
                <dd className="capitalize">{selected.status}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 dark:text-muted-foreground text-xs">Category</dt>
                <dd>{selected.reasonCategory || '—'}</dd>
              </div>
            </dl>

            <div className="border-t border-neutral-200 dark:border-border mt-3 pt-3">
              <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-muted-foreground mb-2">
                Sensitive documents
              </p>
              {!canViewDocs ? (
                <div className="flex gap-2 items-start text-sm text-neutral-600 dark:text-muted-foreground bg-neutral-50 dark:bg-muted p-2.5 rounded">
                  <FileWarning className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    Documents are hidden for your role. Super admin, admin, and welfare-tier
                    roles can view them via the secure API.
                  </span>
                </div>
              ) : (
                (() => {
                  const docs = [
                    ['emiratesIdUrl', 'Emirates ID'],
                    ['passportUrl', 'Passport'],
                    ['visaUrl', 'Visa'],
                    ['salaryCertificateUrl', 'Salary certificate'],
                    ['bankStatementUrl', 'Bank statement'],
                    ['supportingDocumentUrls', 'Supporting documents'],
                  ] as const
                  const available = new Set(
                    Array.isArray(selected.availableDocuments)
                      ? selected.availableDocuments
                      : selected.hasSensitiveDocuments
                        ? docs.map(([k]) => k)
                        : []
                  )
                  const present = docs.filter(([key]) => available.has(key))
                  if (present.length === 0) {
                    return (
                      <p className="text-sm text-neutral-500 dark:text-muted-foreground bg-neutral-50 dark:bg-muted rounded p-2.5">
                        No uploaded documents were found on this request. If the applicant used
                        the charity form, ask them to resubmit with attachments, or check Storage
                        for this request id.
                      </p>
                    )
                  }
                  return (
                    <div className="flex flex-col gap-1.5">
                      {present.map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          data-dashboard-control
                          className={`${btnSecondary} text-left text-xs`}
                          onClick={() => void openSensitiveDoc(selected.id, key)}
                        >
                          View {label}
                        </button>
                      ))}
                    </div>
                  )
                })()
              )}
            </div>
          </>
        ) : null}
      </AdminDetailModal>
    </AdminPageLayout>
  )
}
