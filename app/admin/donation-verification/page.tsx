'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { db, auth } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { ClipboardCheck, ImageIcon } from 'lucide-react'

type Submission = {
  id: string
  donorName?: string
  causeName?: string
  amount?: number
  referenceNumber?: string
  proofImage?: string
  status?: string
  submittedAt?: { toDate?: () => Date }
  infoRequestMessage?: string
  rejectionReason?: string
}

const PENDING_STATUSES = new Set([
  'pending',
  'pending_verification',
  'more_info_requested',
  'resubmission_requested',
])

async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}

export default function DonationVerificationPage() {
  const [submissions, setSubmissions] = React.useState<Submission[]>([])
  const [loading, setLoading] = React.useState(true)
  const [actingId, setActingId] = React.useState<string | null>(null)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'donationSubmissions'),
      (snapshot) => {
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Submission, 'id'>) }))
          .sort((a, b) => {
            const aT = a.submittedAt?.toDate?.()?.getTime() || 0
            const bT = b.submittedAt?.toDate?.()?.getTime() || 0
            return bT - aT
          })
        setSubmissions(data)
        setLoading(false)
      },
      (err) => {
        console.error('[donation-verification]', err)
        setError('Failed to load submissions (check Firestore rules).')
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const runAction = async (
    submissionId: string,
    action: 'verify' | 'reject' | 'request_info',
    extra?: { reason?: string; message?: string }
  ) => {
    setActingId(submissionId)
    setError('')
    try {
      const token = await getIdToken()
      if (!token) {
        setError('You must be signed in as admin')
        return
      }
      const res = await fetch('/api/admin/donation-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ submissionId, action, ...extra }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Action failed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActingId(null)
    }
  }

  const pending = submissions.filter((s) => PENDING_STATUSES.has(String(s.status || '')))
  const confirmed = submissions.filter(
    (s) => s.status === 'confirmed' || s.status === 'verified'
  )
  const rejected = submissions.filter((s) => s.status === 'rejected')

  const btnPrimary =
    'min-h-[44px] flex-1 bg-black hover:bg-neutral-900 text-white py-2 px-3 rounded text-sm font-semibold disabled:opacity-50'
  const btnSecondary =
    'min-h-[44px] flex-1 bg-white text-black border border-neutral-300 hover:bg-neutral-50 py-2 px-3 rounded text-sm font-semibold disabled:opacity-50'
  const btnDanger =
    'min-h-[44px] flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm font-semibold disabled:opacity-50'

  const renderPendingRow = (submission: Submission) => {
    const when = submission.submittedAt?.toDate?.() || new Date()
    const busy = actingId === submission.id
    return (
      <div
        key={submission.id}
        className="border border-neutral-200 rounded-lg p-4 space-y-3"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-neutral-900">{submission.donorName || 'Donor'}</p>
            <p className="text-sm text-neutral-600">Cause: {submission.causeName || '—'}</p>
            <p className="text-sm text-neutral-600">
              Amount: AED {(submission.amount || 0).toLocaleString()}
            </p>
            <p className="text-sm text-neutral-600">Ref: {submission.referenceNumber || '—'}</p>
            {submission.status === 'more_info_requested' && (
              <p className="text-xs text-amber-700 mt-1">
                More info requested: {submission.infoRequestMessage}
              </p>
            )}
          </div>
          <div className="text-left sm:text-right shrink-0">
            <p className="text-xs text-neutral-500">
              {formatDistanceToNow(when, { addSuffix: true })}
            </p>
            {submission.proofImage ? (
              <a
                href={submission.proofImage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm underline mt-1 min-h-[44px]"
              >
                <ImageIcon className="w-4 h-4" />
                View proof
              </a>
            ) : (
              <p className="text-xs text-neutral-400 mt-1">No proof image</p>
            )}
          </div>
        </div>

        {/* Desktop-style meta strip (also works stacked on mobile) */}
        <div className="hidden lg:grid grid-cols-6 gap-2 text-xs text-neutral-500 border-t border-neutral-100 pt-2">
          <span>Donor</span>
          <span>Cause</span>
          <span>Amount</span>
          <span>Reference</span>
          <span>Proof</span>
          <span>Date</span>
          <span className="text-neutral-900 font-medium truncate">{submission.donorName}</span>
          <span className="text-neutral-900 truncate">{submission.causeName}</span>
          <span className="text-neutral-900">AED {submission.amount}</span>
          <span className="text-neutral-900 truncate">{submission.referenceNumber}</span>
          <span>{submission.proofImage ? 'Yes' : '—'}</span>
          <span>{when.toLocaleDateString()}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            disabled={busy}
            className={btnPrimary}
            onClick={() => runAction(submission.id, 'verify')}
          >
            Verify
          </button>
          <button
            type="button"
            disabled={busy}
            className={btnSecondary}
            onClick={() => {
              const message =
                prompt('What additional information do you need?') ||
                'Please provide additional documentation'
              runAction(submission.id, 'request_info', { message })
            }}
          >
            Request more info
          </button>
          <button
            type="button"
            disabled={busy}
            className={btnDanger}
            onClick={() => {
              const reason = prompt('Rejection reason:') || 'No reason provided'
              runAction(submission.id, 'reject', { reason })
            }}
          >
            Reject
          </button>
        </div>
      </div>
    )
  }

  return (
    <AdminPageLayout
      title="Donation Verification"
      subtitle="Review payment proofs and confirm donations (increments cause amountRaised)"
    >
      <div className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded p-3">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-neutral-100">
          <h2
            className="text-lg mb-4 flex items-center gap-2"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            <span className="w-7 h-7 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-sm font-bold">
              {pending.length}
            </span>
            Pending Verification
          </h2>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 bg-neutral-100 rounded" />
              ))}
            </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600">No pending submissions</p>
              <p className="text-sm text-neutral-500 mt-1">
                Proof uploads from /donate will appear here for review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">{pending.map(renderPendingRow)}</div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-neutral-100">
            <h3 className="font-semibold mb-3">Confirmed ({confirmed.length})</h3>
            {confirmed.length === 0 ? (
              <p className="text-sm text-neutral-500">None yet</p>
            ) : (
              <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
                {confirmed.slice(0, 20).map((s) => (
                  <li key={s.id} className="border-b border-neutral-100 pb-2">
                    {s.donorName} — AED {s.amount} — {s.causeName}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-neutral-100">
            <h3 className="font-semibold mb-3">Rejected ({rejected.length})</h3>
            {rejected.length === 0 ? (
              <p className="text-sm text-neutral-500">None yet</p>
            ) : (
              <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
                {rejected.slice(0, 20).map((s) => (
                  <li key={s.id} className="border-b border-neutral-100 pb-2">
                    {s.donorName} — {s.rejectionReason || 'Rejected'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AdminPageLayout>
  )
}
