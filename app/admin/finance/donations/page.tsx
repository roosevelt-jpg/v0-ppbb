'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { db, auth } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import {
  DollarSign,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ClipboardList,
} from 'lucide-react'

type Submission = {
  id: string
  donorName?: string
  donorEmail?: string
  donorPhone?: string
  phone?: string
  causeName?: string
  campaign?: string
  campaignName?: string
  amount?: number
  referenceNumber?: string
  proofImage?: string
  status?: string
  userId?: string
  submittedAt?: { toDate?: () => Date }
  createdAt?: { toDate?: () => Date }
  infoRequestMessage?: string
  rejectionReason?: string
}

const PENDING = new Set([
  'pending',
  'pending_verification',
  'more_info_requested',
  'resubmission_requested',
])

const VERIFIED = new Set(['verified', 'confirmed'])

function toDate(s: Submission): Date {
  return s.submittedAt?.toDate?.() || s.createdAt?.toDate?.() || new Date(0)
}

function formatDate(d: Date): string {
  if (!d.getTime()) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function statusLabel(status?: string): string {
  const s = String(status || '')
  if (VERIFIED.has(s)) return 'Verified'
  if (s === 'rejected') return 'Rejected'
  if (s === 'resubmission_requested' || s === 'more_info_requested') return 'Resubmission'
  if (PENDING.has(s)) return 'Pending'
  return s.replace(/_/g, ' ') || '—'
}

async function getIdToken(): Promise<string | null> {
  return auth.currentUser?.getIdToken() || null
}

/**
 * Part 13A — finance tracking view over the SAME donationSubmissions collection
 * as Part 7B. Actions call /api/admin/donation-verification (shared increment logic).
 */
export default function FinanceDonationsPage() {
  const [submissions, setSubmissions] = React.useState<Submission[]>([])
  const [loading, setLoading] = React.useState(true)
  const [actingId, setActingId] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )
  const [search, setSearch] = React.useState('')

  React.useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'donationSubmissions'),
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Submission, 'id'>) }))
          .sort((a, b) => toDate(b).getTime() - toDate(a).getTime())
        setSubmissions(data)
        setLoading(false)
      },
      (err) => {
        console.error('[finance/donations]', err)
        setMessage({ type: 'error', text: 'Failed to load donations.' })
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  const repeatKeys = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of submissions) {
      const email = (s.donorEmail || '').trim().toLowerCase()
      const phone = (s.donorPhone || s.phone || '').trim()
      if (email) counts.set(`e:${email}`, (counts.get(`e:${email}`) || 0) + 1)
      if (phone) counts.set(`p:${phone}`, (counts.get(`p:${phone}`) || 0) + 1)
    }
    return counts
  }, [submissions])

  const isRepeatDonor = (s: Submission) => {
    const email = (s.donorEmail || '').trim().toLowerCase()
    const phone = (s.donorPhone || s.phone || '').trim()
    if (email && (repeatKeys.get(`e:${email}`) || 0) > 1) return true
    if (phone && (repeatKeys.get(`p:${phone}`) || 0) > 1) return true
    return false
  }

  const stats = React.useMemo(() => {
    const total = submissions.length
    const verified = submissions.filter((s) => VERIFIED.has(String(s.status || '')))
    const pending = submissions.filter((s) => PENDING.has(String(s.status || '')))
    const raised = verified.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
    return {
      total,
      verified: verified.length,
      pending: pending.length,
      raised,
    }
  }, [submissions])

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return submissions
    return submissions.filter((s) => {
      const blob = [
        s.donorName,
        s.donorEmail,
        s.donorPhone || s.phone,
        s.causeName,
        s.campaign || s.campaignName,
        s.referenceNumber,
        s.status,
      ]
        .join(' ')
        .toLowerCase()
      return blob.includes(term)
    })
  }, [submissions, search])

  const runAction = async (
    submissionId: string,
    action: 'verify' | 'reject' | 'request_resubmission'
  ) => {
    let reason: string | undefined
    if (action === 'reject') {
      reason = window.prompt('Rejection reason (optional):') || undefined
      if (reason === null as unknown as undefined) return
    }
    if (action === 'request_resubmission') {
      reason =
        window.prompt('Message to donor:', 'Please resubmit a clearer payment proof screenshot.') ||
        undefined
      if (reason === null as unknown as undefined) return
    }

    setActingId(submissionId)
    setMessage(null)
    try {
      const token = await getIdToken()
      if (!token) {
        setMessage({ type: 'error', text: 'Please sign in as admin.' })
        return
      }
      const res = await fetch('/api/admin/donation-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          submissionId,
          action,
          reason,
          message: reason,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Action failed')
      setMessage({
        type: 'success',
        text:
          action === 'verify'
            ? 'Donation verified. Cause amountRaised updated.'
            : action === 'reject'
              ? 'Donation rejected.'
              : 'Resubmission requested. Donor notified if account exists.',
      })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Action failed',
      })
    } finally {
      setActingId(null)
    }
  }

  const StatCard = ({ label, value }: { label: string; value: string | number }) => (
    <div className="rounded-lg border border-[#e4e1da] bg-white p-4 sm:p-5 min-w-0">
      <p
        className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {label}
      </p>
      <p
        className="text-2xl sm:text-3xl text-neutral-900"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}
      >
        {loading ? '—' : value}
      </p>
    </div>
  )

  const ActionRow = ({ s }: { s: Submission }) => {
    const busy = actingId === s.id
    const st = String(s.status || '')
    const canVerify = !VERIFIED.has(st) && st !== 'rejected'
    return (
      <div className="flex flex-wrap gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
        <button
          type="button"
          disabled={busy || !canVerify}
          onClick={() => runAction(s.id, 'verify')}
          className="min-h-[44px] px-3 bg-black text-white rounded text-xs font-semibold disabled:opacity-40"
        >
          Verify
        </button>
        <button
          type="button"
          disabled={busy || VERIFIED.has(st)}
          onClick={() => runAction(s.id, 'reject')}
          className="min-h-[44px] px-3 bg-red-600 text-white rounded text-xs font-semibold disabled:opacity-40"
        >
          Reject
        </button>
        <button
          type="button"
          disabled={busy || VERIFIED.has(st)}
          onClick={() => runAction(s.id, 'request_resubmission')}
          className="min-h-[44px] px-3 bg-white text-black border border-neutral-300 rounded text-xs font-semibold disabled:opacity-40 inline-flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Request Resubmission
        </button>
      </div>
    )
  }

  return (
    <AdminPageLayout title="Donation Tracking">
      <div className="space-y-6 w-full min-w-0">
        <div>
          <p
            className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Finance
          </p>
          <h1
            className="text-2xl sm:text-3xl text-neutral-900"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Donation Tracking
          </h1>
          <p className="text-sm text-neutral-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Finance view of donationSubmissions — same data and verification flow as Donation
            Verification. Total AED Raised counts verified donations only.
          </p>
          <Link
            href="/admin/donation-verification"
            className="inline-flex items-center gap-1 text-sm text-neutral-700 underline mt-2 min-h-[44px]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Open Charity Verification queue
          </Link>
        </div>

        {message && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total Donations" value={stats.total} />
          <StatCard label="Verified" value={stats.verified} />
          <StatCard label="Pending Verification" value={stats.pending} />
          <StatCard
            label="Total AED Raised"
            value={loading ? '—' : `AED ${stats.raised.toLocaleString()}`}
          />
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search donor, cause, reference, campaign…"
          className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm bg-white"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 bg-neutral-100 rounded" />
            <div className="h-24 bg-neutral-100 rounded" />
            <div className="h-24 bg-neutral-100 rounded" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#e4e1da] bg-white p-8 sm:p-12 text-center">
            <ClipboardList className="w-10 h-10 mx-auto text-neutral-400 mb-3" />
            <h2
              className="text-xl text-neutral-900 mb-1"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              No donation submissions yet
            </h2>
            <p className="text-sm text-neutral-500 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Proofs submitted from /donate-confirm will appear here in real time.
            </p>
            <Link
              href="/donate"
              className="inline-flex items-center justify-center min-h-[44px] px-5 bg-black text-white rounded text-sm font-semibold"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              View public donate page
            </Link>
          </div>
        ) : (
          <>
            <ul className="lg:hidden space-y-3">
              {filtered.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-[#e4e1da] bg-white p-4 space-y-3"
                >
                  <div className="flex gap-3 min-w-0">
                    <div className="h-12 w-12 shrink-0 rounded border bg-neutral-50 flex items-center justify-center overflow-hidden">
                      {s.proofImage ? (
                        <a href={s.proofImage} target="_blank" rel="noopener noreferrer">
                          <img src={s.proofImage} alt="" className="h-12 w-12 object-cover" />
                        </a>
                      ) : (
                        <ImageIcon className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="font-semibold text-neutral-900 truncate"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {s.donorName || 'Donor'}
                        {isRepeatDonor(s) ? (
                          <span className="ml-2 text-[10px] uppercase tracking-wider text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                            Repeat
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {s.causeName || '—'} · AED {(s.amount || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {s.donorEmail || '—'} · {s.donorPhone || s.phone || '—'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Ref {s.referenceNumber || '—'} · {formatDate(toDate(s))} · {statusLabel(s.status)}
                      </p>
                      {(s.campaign || s.campaignName) && (
                        <p className="text-xs text-neutral-500">
                          Campaign: {s.campaign || s.campaignName}
                        </p>
                      )}
                    </div>
                  </div>
                  <ActionRow s={s} />
                </li>
              ))}
            </ul>

            <div className="hidden lg:block overflow-x-auto border border-[#e4e1da] rounded-lg bg-white">
              <table
                className="w-full text-sm min-w-[1000px]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <thead>
                  <tr className="border-b text-left text-neutral-500 text-xs uppercase tracking-wider">
                    <th className="py-3 px-3">Donor</th>
                    <th className="py-3 px-3">Cause</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Reference</th>
                    <th className="py-3 px-3">Proof</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-neutral-100 align-top">
                      <td className="py-3 px-3">
                        <div className="font-medium text-neutral-900">
                          {s.donorName || 'Donor'}
                          {isRepeatDonor(s) ? (
                            <span className="ml-2 text-[10px] uppercase text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                              Repeat
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-neutral-500">{s.donorEmail || '—'}</div>
                        <div className="text-xs text-neutral-500">{s.donorPhone || s.phone || '—'}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div>{s.causeName || '—'}</div>
                        {(s.campaign || s.campaignName) && (
                          <div className="text-xs text-neutral-500">
                            {s.campaign || s.campaignName}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold whitespace-nowrap">
                        AED {(s.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-xs">{s.referenceNumber || '—'}</td>
                      <td className="py-3 px-3">
                        {s.proofImage ? (
                          <a
                            href={s.proofImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <img
                              src={s.proofImage}
                              alt="Proof"
                              className="h-12 w-12 object-cover rounded border"
                            />
                          </a>
                        ) : (
                          <DollarSign className="w-5 h-5 text-neutral-300" />
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">{formatDate(toDate(s))}</td>
                      <td className="py-3 px-3 capitalize whitespace-nowrap">{statusLabel(s.status)}</td>
                      <td className="py-3 px-3">
                        <ActionRow s={s} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminPageLayout>
  )
}
