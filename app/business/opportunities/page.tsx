'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DashboardModal } from '@/components/dashboard-modal'
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
  matched: number
  shortlisted: number
  viewed: number
  notViewed: number
}

const EMPTY_METRICS: JobMetrics = {
  applications: 0,
  matched: 0,
  shortlisted: 0,
  viewed: 0,
  notViewed: 0,
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

function MetricCell({
  value,
  tone,
}: {
  value: number
  tone: 'apps' | 'matched' | 'shortlisted' | 'viewed' | 'notViewed'
}) {
  const tones: Record<typeof tone, string> = {
    apps: 'bg-slate-100 text-slate-800',
    matched: 'bg-rose-100 text-rose-800',
    shortlisted: 'bg-sky-100 text-sky-800',
    viewed: 'bg-orange-100 text-orange-800',
    notViewed: 'bg-fuchsia-100 text-fuchsia-800',
  }
  return (
    <span
      className={`inline-flex min-w-[2.75rem] items-center justify-center rounded-md px-2.5 py-1.5 text-sm font-semibold ${tones[tone]}`}
    >
      {value}
    </span>
  )
}

export default function BusinessOpportunities() {
  const { user } = useAuth()
  const router = useRouter()
  const [opportunities, setOpportunities] = React.useState<BusinessOpportunity[]>([])
  const [metricsByOpp, setMetricsByOpp] = React.useState<Record<string, JobMetrics>>({})
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [selectedOpp, setSelectedOpp] = React.useState<BusinessOpportunity | null>(null)
  const [isEditingModal, setIsEditingModal] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [togglingId, setTogglingId] = React.useState<string | null>(null)
  const [titleQuery, setTitleQuery] = React.useState('')
  const [dateQuery, setDateQuery] = React.useState('')
  const [perPage, setPerPage] = React.useState(5)
  const [page, setPage] = React.useState(1)
  const [editForm, setEditForm] = React.useState({
    title: '',
    description: '',
    status: 'pending_approval' as BusinessOpportunity['status'],
  })

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
          if (app.status === 'accepted') m.matched += 1
          if (app.status === 'shortlisted') m.shortlisted += 1
          if (app.status === 'pending') m.notViewed += 1
          else m.viewed += 1
        }
        setMetricsByOpp(map)
      })
      .catch((err) => console.error('[v0] Failed to load application metrics:', err))

    return () => unsubscribe()
  }, [user, router])

  const openEditModal = (opp: BusinessOpportunity) => {
    setSelectedOpp(opp)
    setEditForm({
      title: opp.title,
      description: opp.description || '',
      status: opp.status,
    })
    setIsEditingModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedOpp) return
    if (!editForm.title.trim()) {
      alert('Title is required')
      return
    }
    if (editForm.status === 'open') {
      alert('Jobs go live only after admin approval.')
      return
    }

    setSaving(true)
    try {
      await updateOpportunity(selectedOpp.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        status: editForm.status,
      })
      setIsEditingModal(false)
      setSelectedOpp(null)
    } catch (error) {
      console.error('[v0] Error updating opportunity:', error)
      alert('Error updating opportunity')
    } finally {
      setSaving(false)
    }
  }

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
    if (!isLiveStatus(opp.status)) {
      if (opp.status === 'pending_approval' || opp.status === 'draft' || opp.status === 'rejected') {
        alert('This job goes live only after admin approval.')
        return
      }
      // Re-open previously closed jobs still requires admin path — keep closed/filled/archived as pause only
      alert('Contact admin to republish a closed job, or wait for approval on new posts.')
      return
    }

    setTogglingId(opp.id)
    try {
      await updateOpportunity(opp.id, { status: 'closed' })
    } catch (error) {
      console.error('[v0] Error pausing opportunity:', error)
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
    return { ...EMPTY_METRICS, applications: total, notViewed: total }
  }

  if (user && !hasBusinessAccess(user)) {
    return <div className="text-center py-8">Access Denied</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Latest Job List:</h1>
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
      <div className="bg-white border border-neutral-200 rounded-lg p-4 mb-5 flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4">
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
            Search by Job Title
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="search"
                value={titleQuery}
                onChange={(e) => setTitleQuery(e.target.value)}
                placeholder="Job title…"
                className="w-full h-10 rounded-md border border-neutral-300 bg-white pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/15"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
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
          <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
            Search by Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={dateQuery}
              onChange={(e) => setDateQuery(e.target.value)}
              className="w-full h-10 rounded-md border border-neutral-300 bg-white pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/15"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        <div className="w-full lg:w-40">
          <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
            Show per page
          </label>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="w-full h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/15"
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
        <div className="text-center py-12 text-neutral-500">Loading job list…</div>
      ) : loadError ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <p className="text-neutral-500 mb-4">{loadError}</p>
          <Button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-[44px] bg-[#111] text-white"
          >
            Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-10 text-center">
          <p className="text-neutral-500 mb-4">
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
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="bg-neutral-900 text-white">
                  <th className="px-4 py-3 font-semibold">Job Title</th>
                  <th className="px-3 py-3 font-semibold text-center">Applications</th>
                  <th className="px-3 py-3 font-semibold text-center">Matched</th>
                  <th className="px-3 py-3 font-semibold text-center">Shortlisted</th>
                  <th className="px-3 py-3 font-semibold text-center">Viewed</th>
                  <th className="px-3 py-3 font-semibold text-center">Not Viewed</th>
                  <th className="px-4 py-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((opp) => {
                  const m = metricsFor(opp)
                  const deadline = toDate(opp.deadline) || toDate(opp.hiringBy)
                  const live = isLiveStatus(opp.status)

                  return (
                    <tr key={opp.id} className="border-t border-neutral-100 align-top hover:bg-neutral-50/80">
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => router.push(`/business/opportunities/${opp.id}`)}
                          className="font-semibold text-neutral-900 hover:underline text-left"
                        >
                          {opp.title}
                        </button>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-500">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          Deadline:{' '}
                          {deadline ? format(deadline, 'dd MMMM, yyyy') : 'Not set'}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={live}
                            disabled={togglingId === opp.id || !live}
                            title={
                              live
                                ? 'Pause listing (set closed)'
                                : 'Live after admin approval only'
                            }
                            onClick={() => void handleLiveToggle(opp)}
                            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
                              live ? 'bg-emerald-500' : 'bg-neutral-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                                live ? 'translate-x-4' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                          <span className="text-xs font-medium text-neutral-600">
                            {live ? 'Live' : String(opp.status || '').replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <MetricCell value={m.applications} tone="apps" />
                      </td>
                      <td className="px-3 py-4 text-center">
                        <MetricCell value={m.matched} tone="matched" />
                      </td>
                      <td className="px-3 py-4 text-center">
                        <MetricCell value={m.shortlisted} tone="shortlisted" />
                      </td>
                      <td className="px-3 py-4 text-center">
                        <MetricCell value={m.viewed} tone="viewed" />
                      </td>
                      <td className="px-3 py-4 text-center">
                        <MetricCell value={m.notViewed} tone="notViewed" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            title="View applicants"
                            onClick={() => router.push(`/business/opportunities/${opp.id}`)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#111] text-white hover:bg-neutral-800"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Edit job"
                            onClick={() => openEditModal(opp)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#111] text-white hover:bg-neutral-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete job"
                            onClick={() => void handleDelete(opp.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
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
            <div className="mt-4 flex items-center justify-between gap-3 text-sm text-neutral-600">
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

      <DashboardModal
        open={isEditingModal && !!selectedOpp}
        title="Edit opportunity"
        onClose={() => {
          setIsEditingModal(false)
          setSelectedOpp(null)
        }}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditingModal(false)
                setSelectedOpp(null)
              }}
              className="min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving}
              className="min-h-[44px] w-full sm:w-auto bg-[#111] text-white"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full min-h-[44px] rounded-lg border border-neutral-300 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              rows={5}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
            <select
              value={editForm.status}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  status: e.target.value as BusinessOpportunity['status'],
                }))
              }
              className="w-full min-h-[44px] rounded-lg border border-neutral-300 px-3 text-sm"
            >
              <option value="pending_approval">Pending approval</option>
              <option value="closed">Closed</option>
              <option value="filled">Filled</option>
              <option value="archived">Archived</option>
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              Open/published status is set by admin after approval.
            </p>
          </div>
        </div>
      </DashboardModal>
    </div>
  )
}
