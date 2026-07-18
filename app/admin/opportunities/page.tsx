'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { auth } from '@/lib/firebase'
import {
  subscribeToAdminJobs,
  subscribeToApplicationsThisMonth,
  matchesJobFilterTab,
  jobMatchesSearch,
  isJobExpired,
  isJobPublished,
  type AdminJob,
  type AdminJobFilterTab,
} from '@/lib/admin-jobs'
import {
  Briefcase,
  Search,
  Eye,
  Pencil,
  Ban,
  Trash2,
  Flag,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'
import { htmlToPlainText } from '@/lib/cms-page-content'

const FILTER_TABS: { id: AdminJobFilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'pending_approval', label: 'Pending Approval' },
  { id: 'draft', label: 'Draft' },
  { id: 'closed', label: 'Closed' },
  { id: 'expired', label: 'Expired' },
  { id: 'flagged', label: 'Flagged' },
]

function formatDate(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function displayStatus(job: AdminJob): string {
  if (job.flagged) return 'Flagged'
  if (isJobExpired(job)) return 'Expired'
  return String(job.status || '').replace(/_/g, ' ')
}

async function getAdminToken(): Promise<string | null> {
  return (await auth.currentUser?.getIdToken()) || null
}

export function AdminOpportunitiesPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const focusId = searchParams.get('focus')
  const [jobs, setJobs] = React.useState<AdminJob[]>([])
  const [appsThisMonth, setAppsThisMonth] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState<AdminJobFilterTab>(focusId ? 'pending_approval' : 'all')
  const [search, setSearch] = React.useState('')
  const [actingId, setActingId] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )
  const [viewJob, setViewJob] = React.useState<AdminJob | null>(null)
  const [editJob, setEditJob] = React.useState<AdminJob | null>(null)
  const [editForm, setEditForm] = React.useState({
    title: '',
    category: '',
    type: '',
    gender: '',
    description: '',
  })
  const focusApplied = React.useRef(false)

  React.useEffect(() => {
    const unsub = subscribeToAdminJobs(
      (data) => {
        setJobs(data)
        setLoading(false)
      },
      () => setLoading(false)
    )
    return () => unsub()
  }, [])

  React.useEffect(() => subscribeToApplicationsThisMonth(setAppsThisMonth), [])

  React.useEffect(() => {
    if (!focusId || loading || focusApplied.current || jobs.length === 0) return
    const match = jobs.find((j) => j.id === focusId)
    if (!match) return
    focusApplied.current = true
    setTab('pending_approval')
    setViewJob(match)
  }, [focusId, loading, jobs])

  const stats = React.useMemo(() => {
    const total = jobs.length
    const published = jobs.filter((j) => isJobPublished(j) && !isJobExpired(j)).length
    const expired = jobs.filter((j) => isJobExpired(j)).length
    return { total, published, appsThisMonth, expired }
  }, [jobs, appsThisMonth])

  const filtered = React.useMemo(() => {
    return jobs.filter((j) => matchesJobFilterTab(j, tab) && jobMatchesSearch(j, search))
  }, [jobs, tab, search])

  const runAction = async (
    job: AdminJob,
    action: 'approve' | 'close' | 'flag' | 'delete' | 'update',
    extra?: Record<string, unknown>
  ) => {
    setActingId(job.id)
    setMessage(null)
    try {
      const token = await getAdminToken()
      if (!token) {
        setMessage({ type: 'error', text: 'Please sign in again.' })
        return
      }

      if (action === 'delete') {
        const ok = window.confirm(`Delete “${job.title}”? This cannot be undone.`)
        if (!ok) return
        const res = await fetch(`/api/admin/opportunities?id=${encodeURIComponent(job.id)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.error || 'Delete failed')
        setMessage({ type: 'success', text: 'Opportunity deleted.' })
        setViewJob(null)
        return
      }

      const res = await fetch('/api/admin/opportunities', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: job.id, action, ...extra }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Action failed')

      if (action === 'approve') {
        setMessage({ type: 'success', text: `“${job.title}” is now published. Business notified.` })
      } else if (action === 'close') {
        setMessage({ type: 'success', text: 'Opportunity closed.' })
      } else if (action === 'flag') {
        setMessage({
          type: 'success',
          text: json.flagged ? 'Flagged for review.' : 'Flag removed.',
        })
      } else if (action === 'update') {
        setMessage({ type: 'success', text: 'Opportunity updated.' })
        setEditJob(null)
      }
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Action failed',
      })
    } finally {
      setActingId(null)
    }
  }

  const openEdit = (job: AdminJob) => {
    setEditJob(job)
    setEditForm({
      title: job.title,
      category: job.category === '—' ? '' : job.category,
      type: job.type,
      gender: job.gender === 'Any' ? '' : job.gender,
      description: job.description,
    })
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editJob) return
    await runAction(editJob, 'update', {
      title: editForm.title,
      category: editForm.category,
      type: editForm.type,
      jobType: editForm.type,
      gender: editForm.gender || 'Any',
      description: editForm.description,
    })
  }

  const StatCard = ({ label, value }: { label: string; value: number }) => (
    <div className="pb-stat-card rounded-lg border border-[#e4e1da] bg-white p-3 min-w-0">
      <p className="pb-stat-label text-[10px] uppercase tracking-wide text-neutral-500 mb-0.5">
        {label}
      </p>
      <p className="pb-stat-value font-headline text-xl font-bold text-neutral-900">
        {loading ? '—' : value}
      </p>
    </div>
  )

  const ActionButtons = ({ job, compact = false }: { job: AdminJob; compact?: boolean }) => {
    const busy = actingId === job.id
    const btn =
      'pb-compact-btn inline-flex items-center justify-center h-6 w-6 min-h-0 min-w-0 rounded-md text-xs font-semibold bg-black text-white hover:bg-neutral-800 disabled:opacity-50 shrink-0 [&_svg]:h-3 [&_svg]:w-3'
    return (
      <div className="flex flex-nowrap items-center gap-1 whitespace-nowrap" style={{ fontFamily: 'Inter, sans-serif' }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => setViewJob(job)}
          className={`${btn} w-8`}
          aria-label="View details"
          title="View details"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <a
          href={`/opportunities/${job.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} w-8`}
          aria-label="Open public posting"
          title="Open public posting"
        >
          <Briefcase className="w-3.5 h-3.5" />
        </a>
        <button
          type="button"
          disabled={busy}
          onClick={() => openEdit(job)}
          className={`${btn} w-8`}
          aria-label="Edit"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {job.status === 'pending_approval' ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => runAction(job, 'approve')}
            className={`${btn} px-2.5`}
            title="Approve"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {!compact ? <span className="ml-1">Approve</span> : null}
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy || job.status === 'closed'}
          onClick={() => runAction(job, 'close')}
          className={`${btn} w-8`}
          aria-label="Close"
          title="Close"
        >
          <Ban className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => runAction(job, 'flag')}
          className={`${btn} w-8`}
          aria-label="Flag"
          title="Flag"
        >
          <Flag className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => runAction(job, 'delete')}
          className={`${btn} w-8`}
          aria-label="Delete"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <AdminPageLayout title="All Opportunities">
      <div className="space-y-6 w-full min-w-0">
        <div>
          <p
            className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Community
          </p>
          <h1
            className="text-2xl sm:text-3xl text-neutral-900"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            All Opportunities
          </h1>
          <p className="text-sm text-neutral-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Monitor all job and opportunity postings across the platform
          </p>
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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total Posted" value={stats.total} />
          <StatCard label="Published" value={stats.published} />
          <StatCard label="Applications This Month" value={stats.appsThisMonth} />
          <StatCard label="Expired" value={stats.expired} />
        </div>

        {/* Filters + search */}
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {FILTER_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`h-7 min-h-0 shrink-0 px-3 sm:px-4 rounded text-sm font-semibold whitespace-nowrap ${ tab === t.id ? 'bg-black text-white' : 'bg-white text-black border border-neutral-300 hover:bg-neutral-50' }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, company, or category..."
              className="w-full border border-neutral-300 rounded pl-10 pr-3 py-2.5 min-h-[44px] text-sm bg-white"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 bg-neutral-100 rounded" />
            <div className="h-20 bg-neutral-100 rounded" />
            <div className="h-20 bg-neutral-100 rounded" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#e4e1da] bg-white p-8 sm:p-12 text-center">
            <Briefcase className="w-10 h-10 mx-auto text-neutral-400 mb-3" />
            <h2
              className="text-xl text-neutral-900 mb-1"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              No jobs posted yet
            </h2>
            <p className="text-sm text-neutral-500 mb-5" style={{ fontFamily: 'Inter, sans-serif' }}>
              Business members submit jobs for approval. They will appear here in real time.
            </p>
            <Link
              href="/admin/businesses"
              className="h-7 min-h-0 inline-flex items-center justify-center px-5 bg-black text-white rounded text-sm font-semibold"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Review businesses
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-neutral-500 py-8 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
            No opportunities match this filter or search.
          </p>
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="lg:hidden space-y-3">
              {filtered.map((job) => (
                <li
                  key={job.id}
                  className="rounded-lg border border-[#e4e1da] bg-white p-4 space-y-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/opportunities/${job.id}`}
                      className="font-semibold text-neutral-900 break-words hover:underline"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {job.title}
                    </Link>
                    <p className="text-xs text-neutral-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {job.company} · {job.type} · {job.category}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {displayStatus(job)} · {job.applications} apps · {formatDate(job.createdAt)}
                    </p>
                    {job.deadline ? (
                      <p className="text-xs text-neutral-500">Deadline {formatDate(job.deadline)}</p>
                    ) : null}
                  </div>
                  <ActionButtons job={job} />
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="hidden lg:block admin-table-scroll border border-[#e4e1da] rounded-lg bg-white min-w-0">
              <table className="w-full text-sm min-w-[1100px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr className="border-b text-left text-neutral-500 text-xs uppercase tracking-wider">
                    <th className="py-3 px-3">Title</th>
                    <th className="py-3 px-3">Company</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Gender</th>
                    <th className="py-3 px-3">Applications</th>
                    <th className="py-3 px-3">Posted By</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Deadline</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((job) => (
                    <tr key={job.id} className="border-b border-neutral-100 align-top">
                      <td className="py-3 px-3 font-medium text-neutral-900 max-w-[180px]">
                        <Link href={`/admin/opportunities/${job.id}`} className="line-clamp-2 hover:underline">
                          {job.title}
                        </Link>
                      </td>
                      <td className="py-3 px-3 max-w-[140px]">
                        <span className="line-clamp-2">{job.company}</span>
                      </td>
                      <td className="py-3 px-3 capitalize">{job.type}</td>
                      <td className="py-3 px-3">{job.category}</td>
                      <td className="py-3 px-3">{job.gender}</td>
                      <td className="py-3 px-3">{job.applications}</td>
                      <td className="py-3 px-3 max-w-[120px] truncate">{job.postedBy}</td>
                      <td className="py-3 px-3 whitespace-nowrap">{formatDate(job.createdAt)}</td>
                      <td className="py-3 px-3 whitespace-nowrap">{formatDate(job.deadline)}</td>
                      <td className="py-3 px-3 capitalize whitespace-nowrap">{displayStatus(job)}</td>
                      <td className="py-3 px-3">
                        <ActionButtons job={job} compact />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* View drawer */}
      {viewJob && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => setViewJob(null)}
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6">
            <button
              type="button"
              onClick={() => setViewJob(null)}
              className="absolute top-3 right-3 min-w-[44px] inline-flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <p
              className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Opportunity
            </p>
            <h2
              className="text-2xl text-neutral-900 mb-2 pr-10"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              {viewJob.title}
            </h2>
            <dl className="space-y-2 text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              <div>
                <dt className="text-neutral-500 text-xs uppercase tracking-wider">Company</dt>
                <dd>{viewJob.company}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 text-xs uppercase tracking-wider">Status</dt>
                <dd className="capitalize">{displayStatus(viewJob)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 text-xs uppercase tracking-wider">Description</dt>
                <dd className="whitespace-pre-wrap text-neutral-700">
                  {htmlToPlainText(viewJob.description || '') || '—'}
                </dd>
              </div>
            </dl>
            <ActionButtons job={viewJob} />
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  window.open(`/opportunities/${viewJob.id}`, '_blank', 'noopener,noreferrer')
                }}
                className="w-full min-h-[44px] bg-black text-white rounded text-sm font-semibold hover:bg-neutral-800"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                View public posting
              </button>
              {viewJob.businessId ? (
                <button
                  type="button"
                  onClick={() => {
                    window.open(`/directory/${viewJob.businessId}`, '_blank', 'noopener,noreferrer')
                  }}
                  className="w-full min-h-[44px] bg-white text-black border border-neutral-300 rounded text-sm font-semibold"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  View business directory
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editJob && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => setEditJob(null)}
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6">
            <button
              type="button"
              onClick={() => setEditJob(null)}
              className="absolute top-3 right-3 min-w-[44px] inline-flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h2
              className="text-2xl text-neutral-900 mb-4 pr-10"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Edit Opportunity
            </h2>
            <form onSubmit={saveEdit} className="space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              {(
                [
                  ['title', 'Title'],
                  ['category', 'Category'],
                  ['type', 'Type'],
                  ['gender', 'Gender'],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={editForm[key]}
                    onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
                    required={key === 'title'}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  rows={4}
                  className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  disabled={actingId === editJob.id}
                  className="h-7 min-h-0 px-5 bg-black text-white rounded text-sm font-semibold disabled:opacity-50"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditJob(null)}
                  className="min-h-[44px] px-5 bg-white text-black border border-neutral-300 rounded text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageLayout>
  )
}

export default function AdminOpportunitiesPage() {
  return (
    <React.Suspense
      fallback={
        <AdminPageLayout title="Opportunities" subtitle="Loading…">
          <p className="text-neutral-500 py-12 text-center">Loading opportunities…</p>
        </AdminPageLayout>
      }
    >
      <AdminOpportunitiesPageInner />
    </React.Suspense>
  )
}
