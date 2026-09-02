'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  subscribeToBusinessOpportunities,
  deleteOpportunity,
  updateOpportunity,
  getBusinessApplications,
} from '@/lib/business-queries'
import { BusinessOpportunity } from '@/lib/types'
import { hasBusinessAccess } from '@/lib/roles'
import { Plus, Trash2, Edit2, Eye, Search, Calendar } from 'lucide-react'
import { format } from 'date-fns'

type JobMetrics = {
  applications: number
  pending: number
  reviewing: number
  shortlisted: number
  accepted: number
  rejected: number
}

const EMPTY_METRICS: JobMetrics = {
  applications: 0,
  pending: 0,
  reviewing: 0,
  shortlisted: 0,
  accepted: 0,
  rejected: 0,
}

function normalizeAppStatus(raw: unknown): keyof Omit<JobMetrics, 'applications'> {
  const s = String(raw || '').toLowerCase()
  if (s === 'shortlisted') return 'shortlisted'
  if (s === 'accepted' || s === 'hired') return 'accepted'
  if (s === 'rejected') return 'rejected'
  if (s === 'reviewing' || s === 'viewed') return 'reviewing'
  return 'pending'
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      const d = (value as { toDate: () => Date }).toDate()
      return Number.isNaN(d.getTime()) ? null : d
    } catch {
      return null
    }
  }
  const d = new Date(value as string | number)
  return Number.isNaN(d.getTime()) ? null : d
}

function isLiveStatus(status: BusinessOpportunity['status']): boolean {
  return status === 'open'
}

function canToggleLive(status: BusinessOpportunity['status']): boolean {
  return status === 'open' || status === 'closed' || status === 'filled'
}

function MetricCell({
  value,
  tone,
  onClick,
  label,
}: {
  value: number
  tone: 'apps' | 'pending' | 'reviewing' | 'shortlisted' | 'accepted' | 'rejected'
  onClick?: () => void
  label: string
}) {
  const tones: Record<typeof tone, string> = {
    apps: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
    pending: 'bg-amber-100 text-amber-900 hover:bg-amber-200',
    reviewing: 'bg-orange-100 text-orange-900 hover:bg-orange-200',
    shortlisted: 'bg-sky-100 text-sky-900 hover:bg-sky-200',
    accepted: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200',
    rejected: 'bg-rose-100 text-rose-900 hover:bg-rose-200',
  }
  const className = `pb-metric-btn pb-metric-btn--inline inline-flex min-w-[2.75rem] items-center justify-center rounded-md px-2.5 py-1.5 text-sm font-semibold transition-colors ${tones[tone]} ${
    onClick ? 'cursor-pointer' : ''
  }`
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} title={`View ${label}`}>
        {value}
      </button>
    )
  }
  return <span className={className}>{value}</span>
}

export default function BusinessOpportunities() {
  const { user } = useAuth()
  const router = useRouter()
  const [opportunities, setOpportunities] = React.useState<BusinessOpportunity[]>([])
  const [metricsByOpp, setMetricsByOpp] = React.useState<Record<string, JobMetrics>>({})
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [togglingId, setTogglingId] = React.useState<string | null>(null)
  const [titleQuery, setTitleQuery] = React.useState('')
  const [dateQuery, setDateQuery] = React.useState('')
  const [perPage, setPerPage] = React.useState(5)
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    if (!user) return
    if (!hasBusinessAccess(user)) {
      router.push('/login')
      return
    }

    setLoading(true)
    setLoadError(null)
    const unsubscribe = subscribeToBusinessOpportunities(
      user.id,
      (data) => {
        const seen = new Set<string>()
        const unique = data.filter((opp) => {
          if (!opp.id || seen.has(opp.id)) return false
          seen.add(opp.id)
          return true
        })
        setOpportunities(unique)
        setLoading(false)
      },
      () => {
        setLoadError('Unable to load opportunities. Check your connection and try again.')
        setLoading(false)
      }
    )

    void getBusinessApplications(user.id)
      .then((apps) => {
        const map: Record<string, JobMetrics> = {}
        const seenApp = new Set<string>()
        for (const app of apps) {
          if (!app.id || seenApp.has(app.id)) continue
          seenApp.add(app.id)
          const oppId = app.opportunityId
          if (!oppId) continue
          if (!map[oppId]) map[oppId] = { ...EMPTY_METRICS }
          const m = map[oppId]
          m.applications += 1
          m[normalizeAppStatus(app.status)] += 1
        }
        setMetricsByOpp(map)
      })
      .catch((err) => console.error('[v0] Failed to load application metrics:', err))

    return () => unsubscribe()
  }, [user, router])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this opportunity?')) {
      try {
        await deleteOpportunity(id)
        setOpportunities((prev) => prev.filter((o) => o.id !== id))
      } catch (error) {
        console.error('[v0] Error deleting opportunity:', error)
        alert('Error deleting opportunity')
      }
    }
  }

  const handleLiveToggle = async (opp: BusinessOpportunity) => {
    if (!canToggleLive(opp.status)) {
      if (opp.status === 'pending_approval' || opp.status === 'draft' || opp.status === 'rejected') {
        alert('This job goes live only after admin approval.')
        return
      }
      alert('This listing cannot be toggled from its current status.')
      return
    }

    setTogglingId(opp.id)
    try {
      const nextStatus = isLiveStatus(opp.status) ? 'closed' : 'open'
      await updateOpportunity(opp.id, { status: nextStatus })
      setOpportunities((prev) =>
        prev.map((o) => (o.id === opp.id ? { ...o, status: nextStatus } : o))
      )
    } catch (error) {
      console.error('[v0] Error updating opportunity live status:', error)
      alert('Could not update live status')
    } finally {
      setTogglingId(null)
    }
  }

  const filtered = React.useMemo(() => {
    const titleQ = titleQuery.trim().toLowerCase()
    const dateQ = dateQuery.trim()

    return opportunities.filter((opp) => {
      if (titleQ && !opp.title.toLowerCase().includes(titleQ)) return false
      if (dateQ) {
        const deadline = toDate(opp.deadline) || toDate(opp.hiringBy) || toDate(opp.createdAt)
        if (!deadline) return false
        const iso = format(deadline, 'yyyy-MM-dd')
        const pretty = format(deadline, 'dd MMMM yyyy').toLowerCase()
        if (!iso.includes(dateQ) && !pretty.includes(dateQ.toLowerCase())) return false
      }
      return true
    })
  }, [opportunities, titleQuery, dateQuery])

  React.useEffect(() => {
    setPage(1)
  }, [titleQuery, dateQuery, perPage])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const pageSafe = Math.min(page, totalPages)
  const paged = filtered.slice((pageSafe - 1) * perPage, pageSafe * perPage)

  const metricsFor = (opp: BusinessOpportunity): JobMetrics => {
    const fromApps = metricsByOpp[opp.id]
    if (fromApps) return fromApps
    const total = opp.applications ?? opp.applicants?.length ?? 0
    return { ...EMPTY_METRICS, applications: total, pending: total }
  }

  const openApplicants = (
    oppId: string,
    status?: keyof Omit<JobMetrics, 'applications'>
  ) => {
    const qs = status ? `?status=${status}` : ''
    router.push(`/business/opportunities/${oppId}${qs}`)
  }

  if (user && !hasBusinessAccess(user)) {
    return <div className="text-center py-8">Access Denied</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-foreground">Latest Job List:</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            type="button"
            onClick={() => router.push('/business/opportunities/applicants')}
            variant="outline"
            className="min-h-[44px] w-full sm:w-auto"
          >
            <Eye className="w-4 h-4 mr-2" />
            All Candidates
          </Button>
          <Button
            type="button"
            onClick={() => router.push('/business/opportunities/new')}
            className="min-h-[44px] w-full sm:w-auto bg-[#111] text-white hover:bg-neutral-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Job Post
          </Button>
        </div>
      </div>

      {/* Search / filter bar */}
      <div className="bg-white dark:bg-card border border-neutral-200 dark:border-border rounded-lg p-4 mb-5 flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4">
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold text-neutral-600 dark:text-muted-foreground mb-1.5">
            Search by Job Title
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="search"
                value={titleQuery}
                onChange={(e) => setTitleQuery(e.target.value)}
                placeholder="Job title…"
                className="w-full h-10 rounded-md border border-neutral-300 dark:border-border bg-white dark:bg-card pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/15"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
            </div>
            <Button
              type="button"
              className="h-10 px-4 bg-[#111] text-white shrink-0"
              onClick={() => setPage(1)}
            >
              Search
            </Button>
          </div>
        </div>

        <div className="w-full lg:w-56">
          <label className="block text-xs font-semibold text-neutral-600 dark:text-muted-foreground mb-1.5">
            Search by Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={dateQuery}
              onChange={(e) => setDateQuery(e.target.value)}
              className="w-full h-10 rounded-md border border-neutral-300 dark:border-border bg-white dark:bg-card pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/15"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
          </div>
        </div>

        <div className="w-full lg:w-40">
          <label className="block text-xs font-semibold text-neutral-600 dark:text-muted-foreground mb-1.5">
            Show per page
          </label>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="w-full h-10 rounded-md border border-neutral-300 dark:border-border bg-white dark:bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/15"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {String(n).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-neutral-500 dark:text-muted-foreground">Loading job list…</div>
      ) : loadError ? (
        <div className="rounded-lg border border-neutral-200 dark:border-border bg-white dark:bg-card p-8 text-center">
          <p className="text-neutral-500 dark:text-muted-foreground mb-4">{loadError}</p>
          <Button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-[44px] bg-[#111] text-white"
          >
            Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 dark:border-border bg-white dark:bg-card p-10 text-center">
          <p className="text-neutral-500 dark:text-muted-foreground mb-4">
            {opportunities.length === 0 ? 'No jobs posted yet' : 'No jobs match your search'}
          </p>
          {opportunities.length === 0 ? (
            <Button
              type="button"
              onClick={() => router.push('/business/opportunities/new')}
              className="min-h-[44px] bg-[#111] text-white"
            >
              Create Job Post
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-border bg-white dark:bg-card shadow-sm">
            <ul className="lg:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
              {paged.map((opp) => {
                const m = metricsFor(opp)
                const deadline = toDate(opp.deadline) || toDate(opp.hiringBy)
                const live = isLiveStatus(opp.status)
                return (
                  <li key={opp.id} className="p-4 space-y-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => router.push(`/business/opportunities/${opp.id}`)}
                        className="pb-ghost-btn text-left font-semibold text-neutral-900 dark:text-foreground break-words"
                      >
                        {opp.title}
                      </button>
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        Deadline:{' '}
                        {deadline ? format(deadline, 'dd MMMM, yyyy') : 'Not set'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 min-h-[44px]">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={live}
                        aria-label={live ? 'Set job closed' : 'Set job live'}
                        disabled={togglingId === opp.id || !canToggleLive(opp.status)}
                        onClick={() => void handleLiveToggle(opp)}
                        className="pb-ghost-btn relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-0 p-0 shadow-none transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                          height: 32,
                          width: 56,
                          minHeight: 32,
                          maxHeight: 32,
                          minWidth: 56,
                          padding: 0,
                          backgroundColor: live ? '#10b981' : '#111111',
                        }}
                      >
                        <span
                          aria-hidden
                          className="pointer-events-none inline-block rounded-full bg-white dark:bg-card shadow-md transition-transform duration-200"
                          style={{
                            height: 26,
                            width: 26,
                            transform: live ? 'translateX(26px)' : 'translateX(3px)',
                          }}
                        />
                      </button>
                      <span
                        className={`text-sm font-semibold capitalize ${
                          live ? 'text-emerald-700' : 'text-neutral-600 dark:text-muted-foreground'
                        }`}
                      >
                        {live ? 'Live' : String(opp.status || 'closed').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                      {(
                        [
                          ['applications', 'Apps', undefined],
                          ['pending', 'Pending', 'pending'],
                          ['reviewing', 'Review', 'reviewing'],
                          ['shortlisted', 'Short', 'shortlisted'],
                          ['accepted', 'Accepted', 'accepted'],
                          ['rejected', 'Rejected', 'rejected'],
                        ] as const
                      ).map(([key, label, status]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            openApplicants(
                              opp.id,
                              status as keyof Omit<JobMetrics, 'applications'> | undefined
                            )
                          }
                          className="pb-metric-btn pb-metric-btn--center rounded-md bg-neutral-50 dark:bg-white/5 text-neutral-900 dark:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                          <p className="pb-metric-value text-neutral-900 dark:text-foreground">{m[key]}</p>
                          <p className="pb-metric-label text-neutral-500 dark:text-muted-foreground opacity-100">{label}</p>
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        title="View applicants"
                        onClick={() => openApplicants(opp.id)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-[#111] px-3 text-sm text-white"
                      >
                        <Eye className="w-4 h-4" /> Applicants
                      </button>
                      <button
                        type="button"
                        title="Edit job"
                        onClick={() => router.push(`/business/opportunities/${opp.id}/edit`)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-[#111] px-3 text-sm text-white"
                      >
                        <Edit2 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        type="button"
                        title="Delete job"
                        onClick={() => void handleDelete(opp.id)}
                        className="pb-outline-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-md px-3 text-sm"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <table className="hidden lg:table w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="bg-[#f7f6f2] text-neutral-600 border-b border-neutral-200">
                  <th className="px-4 py-3 font-semibold">Job Title</th>
                  <th className="px-2 py-3 font-semibold text-center">All</th>
                  <th className="px-2 py-3 font-semibold text-center">Pending</th>
                  <th className="px-2 py-3 font-semibold text-center">Reviewing</th>
                  <th className="px-2 py-3 font-semibold text-center">Shortlisted</th>
                  <th className="px-2 py-3 font-semibold text-center">Accepted</th>
                  <th className="px-2 py-3 font-semibold text-center">Rejected</th>
                  <th className="px-4 py-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((opp) => {
                  const m = metricsFor(opp)
                  const deadline = toDate(opp.deadline) || toDate(opp.hiringBy)
                  const live = isLiveStatus(opp.status)

                  return (
                    <tr key={opp.id} className="border-t border-neutral-100 dark:border-border align-top hover:bg-neutral-50/80 dark:hover:bg-neutral-800">
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => openApplicants(opp.id)}
                          className="font-semibold text-neutral-900 dark:text-foreground hover:underline text-left"
                        >
                          {opp.title}
                        </button>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          Deadline:{' '}
                          {deadline ? format(deadline, 'dd MMMM, yyyy') : 'Not set'}
                        </p>
                        <div className="mt-3 flex items-center gap-3 min-h-[44px]">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={live}
                            aria-label={live ? 'Set job closed' : 'Set job live'}
                            disabled={togglingId === opp.id || !canToggleLive(opp.status)}
                            title={
                              live
                                ? 'Turn off to close this listing'
                                : canToggleLive(opp.status)
                                  ? 'Turn on to reopen this listing'
                                  : 'Live after admin approval only'
                            }
                            onClick={() => void handleLiveToggle(opp)}
                            className="pb-ghost-btn relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-0 p-0 shadow-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                            style={{
                              height: 32,
                              width: 56,
                              minHeight: 32,
                              maxHeight: 32,
                              minWidth: 56,
                              padding: 0,
                              backgroundColor: live ? '#10b981' : '#111111',
                            }}
                          >
                            <span
                              aria-hidden
                              className="pointer-events-none inline-block rounded-full bg-white dark:bg-card shadow-md transition-transform duration-200"
                              style={{
                                height: 26,
                                width: 26,
                                transform: live ? 'translateX(26px)' : 'translateX(3px)',
                              }}
                            />
                          </button>
                          <span
                            className={`text-sm font-semibold capitalize ${
                              live ? 'text-emerald-700' : 'text-neutral-600 dark:text-muted-foreground'
                            }`}
                          >
                            {live ? 'Live' : String(opp.status || 'closed').replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-4 text-center">
                        <MetricCell
                          value={m.applications}
                          tone="apps"
                          label="all applicants"
                          onClick={() => openApplicants(opp.id)}
                        />
                      </td>
                      <td className="px-2 py-4 text-center">
                        <MetricCell
                          value={m.pending}
                          tone="pending"
                          label="pending"
                          onClick={() => openApplicants(opp.id, 'pending')}
                        />
                      </td>
                      <td className="px-2 py-4 text-center">
                        <MetricCell
                          value={m.reviewing}
                          tone="reviewing"
                          label="reviewing"
                          onClick={() => openApplicants(opp.id, 'reviewing')}
                        />
                      </td>
                      <td className="px-2 py-4 text-center">
                        <MetricCell
                          value={m.shortlisted}
                          tone="shortlisted"
                          label="shortlisted"
                          onClick={() => openApplicants(opp.id, 'shortlisted')}
                        />
                      </td>
                      <td className="px-2 py-4 text-center">
                        <MetricCell
                          value={m.accepted}
                          tone="accepted"
                          label="accepted"
                          onClick={() => openApplicants(opp.id, 'accepted')}
                        />
                      </td>
                      <td className="px-2 py-4 text-center">
                        <MetricCell
                          value={m.rejected}
                          tone="rejected"
                          label="rejected"
                          onClick={() => openApplicants(opp.id, 'rejected')}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            title="View applicants"
                            onClick={() => openApplicants(opp.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#111] text-white hover:bg-neutral-800"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Edit job"
                            onClick={() => router.push(`/business/opportunities/${opp.id}/edit`)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#111] text-white hover:bg-neutral-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete job"
                            onClick={() => void handleDelete(opp.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 dark:border-border bg-white dark:bg-card text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="mt-4 flex flex-col gap-3 text-sm text-neutral-600 dark:text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {(pageSafe - 1) * perPage + 1}–
                {Math.min(pageSafe * perPage, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-9"
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-9"
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
