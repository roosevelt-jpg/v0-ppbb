'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import {
  getOpportunityById,
  getOpportunityApplications,
  updateApplicationStatus,
  updateOpportunity,
} from '@/lib/business-queries'
import { BusinessOpportunity, JobApplication } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { DashboardModal } from '@/components/dashboard-modal'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Edit2,
  Share2,
  RefreshCw,
  Download,
  MapPin,
  Clock,
  GraduationCap,
  Briefcase,
  ListChecks,
  X,
  Check,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'

type EnrichedApp = JobApplication & {
  profileTitle?: string
  profileLocation?: string
  profileEducation?: string
  profileExperience?: string
  profileHours?: number
  profilePhoto?: string
}

type TabId = 'applicants' | 'preview'
type StageFilter = 'all' | 'viewed' | 'shortlisted' | 'interview' | 'final' | 'rejected' | 'pending'

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

function formatOppLocation(opp: BusinessOpportunity): string {
  if (opp.locationText) return opp.locationText
  if (opp.locationCity) return opp.locationCity
  if (typeof opp.location === 'string') return opp.location
  if (opp.location && typeof opp.location === 'object') {
    const loc = opp.location as { formattedAddress?: string; city?: string }
    return loc.formattedAddress || loc.city || '—'
  }
  return '—'
}

function fileNameFromUrl(url: string, applicantName: string): string {
  try {
    const path = new URL(url).pathname
    const base = path.split('/').pop() || ''
    const decoded = decodeURIComponent(base.split('?')[0])
    if (decoded && /\.(pdf|doc|docx)$/i.test(decoded)) return decoded
  } catch {
    /* ignore */
  }
  const safe = (applicantName || 'candidate').replace(/[^\w\-]+/g, '_').slice(0, 40)
  return `${safe}-CV.pdf`
}

async function downloadCv(url: string, applicantName: string) {
  const fileName = fileNameFromUrl(url, applicantName)
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('fetch failed')
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

async function enrichApplications(apps: JobApplication[]): Promise<EnrichedApp[]> {
  const seen = new Set<string>()
  const unique = apps.filter((app) => {
    if (!app.id || seen.has(app.id)) return false
    seen.add(app.id)
    return true
  })

  return Promise.all(
    unique.map(async (app) => {
      const base: EnrichedApp = { ...app }
      if (
        app.applicantTitle &&
        app.applicantLocation &&
        app.applicantEducation &&
        app.applicantExperience
      ) {
        return base
      }
      try {
        const snap = await getDoc(doc(db, 'users', app.applicantId))
        if (!snap.exists()) return base
        const d = snap.data() as Record<string, unknown>
        const loc =
          (typeof d.locationLabel === 'string' && d.locationLabel) ||
          (typeof d.location === 'string' && d.location) ||
          (d.location && typeof d.location === 'object'
            ? String(
                (d.location as { formattedAddress?: string; city?: string }).formattedAddress ||
                  (d.location as { city?: string }).city ||
                  ''
              )
            : '')
        return {
          ...base,
          profileTitle: String(d.jobTitle || d.title || d.profession || ''),
          profileLocation: loc,
          profileEducation: String(d.education || d.highestEducation || ''),
          profileExperience: String(d.experience || d.workExperience || ''),
          profileHours: Number(d.volunteeredHours ?? d.volunteerHours ?? 0) || 0,
          profilePhoto: String(d.photoURL || d.avatarUrl || d.profileImage || '') || undefined,
          applicantAvatarUrl:
            app.applicantAvatarUrl ||
            String(d.photoURL || d.avatarUrl || d.profileImage || '') ||
            undefined,
        }
      } catch {
        return base
      }
    })
  )
}

function StatCard({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string
  value: number
  tone: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-3 text-left transition ring-offset-2 ${tone} ${
        active ? 'ring-2 ring-neutral-900' : ''
      }`}
    >
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-xs font-medium mt-1.5 opacity-90">{label}</p>
    </button>
  )
}

export default function BusinessOpportunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const id = params.id as string
  const initialTab = searchParams.get('tab') === 'preview' ? 'preview' : 'applicants'

  const [opportunity, setOpportunity] = React.useState<BusinessOpportunity | null>(null)
  const [applications, setApplications] = React.useState<EnrichedApp[]>([])
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState<TabId>(initialTab)
  const [stage, setStage] = React.useState<StageFilter>('all')
  const [experienceFilter, setExperienceFilter] = React.useState('all')
  const [educationFilter, setEducationFilter] = React.useState('all')
  const [perPage, setPerPage] = React.useState(5)
  const [page, setPage] = React.useState(1)
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null)
  const [isEditing, setIsEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [editForm, setEditForm] = React.useState({ title: '', description: '' })
  const [shareNote, setShareNote] = React.useState('')

  const load = React.useCallback(async () => {
    if (!user || !id) return
    setLoading(true)
    try {
      const data = await getOpportunityById(id)
      if (!data || data.businessId !== user.id) {
        setOpportunity(null)
        setApplications([])
        return
      }
      setOpportunity(data)
      setEditForm({ title: data.title, description: data.description || '' })
      const apps = await getOpportunityApplications(id)
      setApplications(await enrichApplications(apps))
    } catch (err) {
      console.error('[business opportunity] load error:', err)
      setOpportunity(null)
    } finally {
      setLoading(false)
    }
  }, [id, user])

  React.useEffect(() => {
    if (!user) return
    if (!hasBusinessAccess(user)) {
      router.push('/login')
      return
    }
    void load()
  }, [user, router, load])

  const stats = React.useMemo(() => {
    const total = applications.length
    const viewed = applications.filter((a) => a.status !== 'pending').length
    const shortlisted = applications.filter((a) => a.status === 'shortlisted').length
    const interview = applications.filter((a) => a.status === 'reviewing').length
    const finalList = applications.filter((a) => a.status === 'accepted').length
    const rejected = applications.filter((a) => a.status === 'rejected').length
    return { total, viewed, shortlisted, interview, finalList, rejected }
  }, [applications])

  const educationOptions = React.useMemo(() => {
    const set = new Set<string>()
    for (const a of applications) {
      const v = (a.applicantEducation || a.profileEducation || '').trim()
      if (v) set.add(v)
    }
    return Array.from(set).sort()
  }, [applications])

  const experienceOptions = React.useMemo(() => {
    const set = new Set<string>()
    for (const a of applications) {
      const v = (a.applicantExperience || a.profileExperience || '').trim()
      if (v) set.add(v)
    }
    return Array.from(set).sort()
  }, [applications])

  const filtered = React.useMemo(() => {
    return applications.filter((a) => {
      if (stage === 'viewed' && a.status === 'pending') return false
      if (stage === 'shortlisted' && a.status !== 'shortlisted') return false
      if (stage === 'interview' && a.status !== 'reviewing') return false
      if (stage === 'final' && a.status !== 'accepted') return false
      if (stage === 'rejected' && a.status !== 'rejected') return false
      if (stage === 'pending' && a.status !== 'pending') return false

      const education = (a.applicantEducation || a.profileEducation || '').trim()
      const experience = (a.applicantExperience || a.profileExperience || '').trim()
      if (educationFilter !== 'all' && education !== educationFilter) return false
      if (experienceFilter !== 'all' && experience !== experienceFilter) return false
      return true
    })
  }, [applications, stage, educationFilter, experienceFilter])

  React.useEffect(() => {
    setPage(1)
  }, [stage, educationFilter, experienceFilter, perPage])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const pageSafe = Math.min(page, totalPages)
  const paged = filtered.slice((pageSafe - 1) * perPage, pageSafe * perPage)

  const handleStatus = async (appId: string, status: JobApplication['status']) => {
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)))
    try {
      await updateApplicationStatus(appId, status)
    } catch (err) {
      console.error('[v0] status update failed:', err)
      void load()
    }
  }

  const handleDownloadCv = async (app: EnrichedApp) => {
    if (!app.resumeUrl) return
    setDownloadingId(app.id)
    try {
      await downloadCv(app.resumeUrl, app.applicantName || 'candidate')
    } finally {
      setDownloadingId(null)
    }
  }

  const exportCsv = () => {
    const rows = [
      [
        'Name',
        'Title',
        'Volunteer Hours',
        'Location',
        'Education',
        'Experience',
        'Status',
        'Email',
        'CV URL',
        'Applied',
      ],
      ...filtered.map((a) => [
        a.applicantName || '',
        a.applicantTitle || a.profileTitle || '',
        String(a.applicantVolunteerHours ?? a.profileHours ?? 0),
        a.applicantLocation || a.profileLocation || '',
        a.applicantEducation || a.profileEducation || '',
        a.applicantExperience || a.profileExperience || '',
        a.status,
        a.applicantEmail || '',
        a.resumeUrl || '',
        (() => {
          const d = toDate(a.createdAt)
          return d ? format(d, 'yyyy-MM-dd') : ''
        })(),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${(opportunity?.title || 'applicants').replace(/[^\w\-]+/g, '_')}-applicants.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/opportunities/${id}`
    try {
      await navigator.clipboard.writeText(url)
      setShareNote('Public link copied')
    } catch {
      setShareNote(url)
    }
    setTimeout(() => setShareNote(''), 2500)
  }

  const handleRepost = async () => {
    if (!opportunity) return
    if (!confirm('Repost this job for admin review?')) return
    try {
      await updateOpportunity(opportunity.id, { status: 'pending_approval' })
      setOpportunity({ ...opportunity, status: 'pending_approval' })
      alert('Job submitted for approval again.')
    } catch (err) {
      console.error(err)
      alert('Could not repost job')
    }
  }

  const handleSaveEdit = async () => {
    if (!opportunity) return
    if (!editForm.title.trim()) {
      alert('Title is required')
      return
    }
    setSaving(true)
    try {
      await updateOpportunity(opportunity.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
      })
      setOpportunity({
        ...opportunity,
        title: editForm.title.trim(),
        description: editForm.description.trim(),
      })
      setIsEditing(false)
    } catch (err) {
      console.error(err)
      alert('Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">Loading applicants…</div>
  }

  if (!opportunity) {
    return (
      <div className="p-8 text-center">
        <p className="text-neutral-500 mb-4">Opportunity not found.</p>
        <Button type="button" onClick={() => router.push('/business/opportunities')}>
          Back to Job List
        </Button>
      </div>
    )
  }

  const posted = toDate(opportunity.createdAt)
  const expired = toDate(opportunity.deadline) || toDate(opportunity.hiringBy)

  return (
    <div className="min-h-full bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 leading-tight">
                {opportunity.title}
              </h1>
              <p className="mt-2 text-sm text-neutral-500">
                Job Posted {posted ? format(posted, 'dd MMM yyyy') : '—'}
                <span className="mx-2 text-neutral-300">|</span>
                {expired ? `Expired ${format(expired, 'dd MMM yyyy')}` : 'No deadline set'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-[40px]"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
              <Button type="button" variant="outline" className="min-h-[40px]" onClick={() => void handleRepost()}>
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Repost
              </Button>
              <Button type="button" className="min-h-[40px] bg-[#111] text-white" onClick={() => void handleShare()}>
                <Share2 className="w-4 h-4 mr-1.5" />
                Share
              </Button>
            </div>
          </div>
          {shareNote ? <p className="mt-2 text-xs text-emerald-700">{shareNote}</p> : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200">
            <div className="flex gap-1">
              {(
                [
                  { id: 'applicants' as const, label: `Total Applicants (${stats.total})` },
                  { id: 'preview' as const, label: 'Job Preview' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    tab === t.id
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Link
              href="/business/opportunities"
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 pb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Job List
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {tab === 'preview' ? (
          <div className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(`/opportunities/${opportunity.id}`, '_blank')}
              >
                Open public page
              </Button>
            </div>
            <div>
              <h2 className="font-semibold text-neutral-900 mb-2">Description</h2>
              <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                {opportunity.description || '—'}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="rounded-md bg-neutral-50 p-3">
                <p className="text-xs text-neutral-500">Category</p>
                <p className="font-medium">{opportunity.category || '—'}</p>
              </div>
              <div className="rounded-md bg-neutral-50 p-3">
                <p className="text-xs text-neutral-500">Type</p>
                <p className="font-medium capitalize">{opportunity.type || '—'}</p>
              </div>
              <div className="rounded-md bg-neutral-50 p-3">
                <p className="text-xs text-neutral-500">Location</p>
                <p className="font-medium">{formatOppLocation(opportunity)}</p>
              </div>
              <div className="rounded-md bg-neutral-50 p-3">
                <p className="text-xs text-neutral-500">Status</p>
                <p className="font-medium capitalize">
                  {String(opportunity.status || '').replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <StatCard
                label="Total Applicants"
                value={stats.total}
                tone="bg-sky-500 text-white"
                active={stage === 'all'}
                onClick={() => setStage('all')}
              />
              <StatCard
                label="Viewed"
                value={stats.viewed}
                tone="bg-orange-400 text-white"
                active={stage === 'viewed'}
                onClick={() => setStage('viewed')}
              />
              <StatCard
                label="Shortlisted"
                value={stats.shortlisted}
                tone="bg-blue-600 text-white"
                active={stage === 'shortlisted'}
                onClick={() => setStage('shortlisted')}
              />
              <StatCard
                label="Interview List"
                value={stats.interview}
                tone="bg-amber-500 text-white"
                active={stage === 'interview'}
                onClick={() => setStage('interview')}
              />
              <StatCard
                label="Final List"
                value={stats.finalList}
                tone="bg-emerald-500 text-white"
                active={stage === 'final'}
                onClick={() => setStage('final')}
              />
              <StatCard
                label="Rejected"
                value={stats.rejected}
                tone="bg-rose-500 text-white"
                active={stage === 'rejected'}
                onClick={() => setStage('rejected')}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
              {/* Filters */}
              <aside className="bg-white border border-neutral-200 rounded-lg p-4 h-fit">
                <p className="text-sm font-bold text-neutral-900 mb-3">Filtered By:</p>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Position</label>
                <select
                  disabled
                  className="w-full h-9 rounded-md border border-neutral-300 bg-neutral-50 px-2 text-sm mb-3"
                  value={opportunity.title}
                >
                  <option>{opportunity.title}</option>
                </select>

                <label className="block text-xs font-semibold text-neutral-600 mb-1">Job Type</label>
                <select
                  disabled
                  className="w-full h-9 rounded-md border border-neutral-300 bg-neutral-50 px-2 text-sm mb-3 capitalize"
                  value={opportunity.type || ''}
                >
                  <option className="capitalize">{opportunity.type || '—'}</option>
                </select>

                <label className="block text-xs font-semibold text-neutral-600 mb-1">
                  Experience Level
                </label>
                <select
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                  className="w-full h-9 rounded-md border border-neutral-300 bg-white px-2 text-sm mb-3"
                >
                  <option value="all">All</option>
                  {experienceOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <label className="block text-xs font-semibold text-neutral-600 mb-1">
                  Education Level
                </label>
                <select
                  value={educationFilter}
                  onChange={(e) => setEducationFilter(e.target.value)}
                  className="w-full h-9 rounded-md border border-neutral-300 bg-white px-2 text-sm"
                >
                  <option value="all">All</option>
                  {educationOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </aside>

              {/* List */}
              <section>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-600">Download By:</span>
                    <button
                      type="button"
                      onClick={exportCsv}
                      title="Download CSV"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#111] text-white"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={exportCsv}
                      title="Download list"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value as StageFilter)}
                      className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-xs"
                    >
                      <option value="all">All Applicants</option>
                      <option value="pending">Not Viewed</option>
                      <option value="viewed">Viewed</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview">Interview List</option>
                      <option value="final">Final List (Accepted)</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-neutral-600">Show per page</label>
                    <select
                      value={perPage}
                      onChange={(e) => setPerPage(Number(e.target.value))}
                      className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-xs"
                    >
                      {[5, 10, 20, 50].map((n) => (
                        <option key={n} value={n}>
                          {String(n).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {paged.length === 0 ? (
                  <div className="rounded-lg border border-neutral-200 bg-white p-10 text-center text-neutral-500">
                    No applicants in this view.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead>
                        <tr className="bg-neutral-900 text-white">
                          <th className="px-4 py-3 font-semibold">Candidate Name</th>
                          <th className="px-4 py-3 font-semibold">Career Summary</th>
                          <th className="px-4 py-3 font-semibold text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paged.map((app) => {
                          const title = app.applicantTitle || app.profileTitle || '—'
                          const location = app.applicantLocation || app.profileLocation || '—'
                          const education = app.applicantEducation || app.profileEducation || '—'
                          const experience = app.applicantExperience || app.profileExperience || '—'
                          const hours = app.applicantVolunteerHours ?? app.profileHours ?? 0
                          const photo = app.applicantAvatarUrl || app.profilePhoto
                          const applied = toDate(app.createdAt)

                          return (
                            <tr key={app.id} className="border-t border-neutral-100 align-top">
                              <td className="px-4 py-4">
                                <div className="flex gap-3">
                                  <div className="w-12 h-12 rounded-md overflow-hidden bg-neutral-200 shrink-0 flex items-center justify-center">
                                    {photo ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={photo}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="font-semibold text-neutral-700">
                                        {app.applicantName?.charAt(0)?.toUpperCase() || '?'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-neutral-900">
                                      {app.applicantName || 'Applicant'}
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 shrink-0" />
                                      <span className="truncate">{location}</span>
                                    </p>
                                    <p className="text-[11px] text-neutral-400 mt-1">
                                      Applied On:{' '}
                                      {applied ? format(applied, 'dd MMM yyyy') : '—'}
                                    </p>
                                    <p className="text-[10px] uppercase tracking-wide text-neutral-500 mt-1 font-semibold">
                                      {app.status}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <p className="font-semibold text-neutral-900">{title}</p>
                                <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                                  <li className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                    Volunteer Hours : {hours}
                                  </li>
                                  <li className="flex items-center gap-1.5">
                                    <GraduationCap className="w-3.5 h-3.5 text-neutral-400" />
                                    Education : {education}
                                  </li>
                                  <li className="flex items-center gap-1.5">
                                    <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
                                    Experience : {experience}
                                  </li>
                                </ul>
                                {app.resumeUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => void handleDownloadCv(app)}
                                    disabled={downloadingId === app.id}
                                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 underline underline-offset-2 disabled:opacity-60"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    {downloadingId === app.id ? 'Downloading…' : 'Download CV'}
                                  </button>
                                ) : (
                                  <span className="mt-3 inline-block text-xs text-neutral-400">
                                    No CV uploaded
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex flex-col items-stretch gap-2 min-w-[140px]">
                                  <button
                                    type="button"
                                    onClick={() => void handleStatus(app.id, 'shortlisted')}
                                    disabled={app.status === 'shortlisted'}
                                    className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md bg-sky-600 text-white text-xs font-semibold disabled:opacity-40"
                                  >
                                    <ListChecks className="w-3.5 h-3.5" />
                                    Shortlist
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleStatus(app.id, 'accepted')}
                                    disabled={app.status === 'accepted'}
                                    className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md bg-emerald-600 text-white text-xs font-semibold disabled:opacity-40"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleStatus(app.id, 'rejected')}
                                    disabled={app.status === 'rejected'}
                                    className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md bg-rose-600 text-white text-xs font-semibold disabled:opacity-40"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    Reject
                                  </button>
                                  {app.status === 'pending' ? (
                                    <button
                                      type="button"
                                      onClick={() => void handleStatus(app.id, 'reviewing')}
                                      className="inline-flex items-center justify-center h-8 px-3 rounded-md border border-neutral-300 bg-white text-neutral-700 text-[11px] font-semibold"
                                    >
                                      Mark viewed
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {totalPages > 1 ? (
                  <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
                    <span>
                      Showing {(pageSafe - 1) * perPage + 1}–
                      {Math.min(pageSafe * perPage, filtered.length)} of {filtered.length}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9"
                        disabled={pageSafe <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9"
                        disabled={pageSafe >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          </>
        )}
      </div>

      <DashboardModal
        open={isEditing}
        title="Edit job"
        onClose={() => setIsEditing(false)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#111] text-white"
              disabled={saving}
              onClick={() => void handleSaveEdit()}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              value={editForm.title}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full min-h-[44px] rounded-lg border border-neutral-300 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              rows={5}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </DashboardModal>
    </div>
  )
}
