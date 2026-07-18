'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import {
  getOpportunityApplications,
  updateApplicationStatus,
} from '@/lib/business-queries'
import { JobApplication } from '@/lib/types'
import { normalizeOpportunityFromJob } from '@/lib/opportunity-utils'
import { htmlToPlainText } from '@/lib/cms-page-content'
import { BUTTON_BACK } from '@/lib/admin-design-system'
import {
  ArrowLeft,
  Briefcase,
  Check,
  Clock,
  Download,
  GraduationCap,
  ListChecks,
  MapPin,
  X,
} from 'lucide-react'

type EnrichedApp = JobApplication & {
  profileTitle?: string
  profileLocation?: string
  profileEducation?: string
  profileExperience?: string
  profileHours?: number
  profilePhoto?: string
}

type StageFilter = 'all' | 'pending' | 'reviewing' | 'shortlisted' | 'accepted' | 'rejected'

async function adminFetch(path: string, options?: RequestInit) {
  const token = await auth.currentUser?.getIdToken()
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  })
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
      if (!app.applicantId) return base
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

export default function AdminOpportunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [job, setJob] = React.useState<Record<string, unknown> | null>(null)
  const [applications, setApplications] = React.useState<EnrichedApp[]>([])
  const [loading, setLoading] = React.useState(true)
  const [appsLoading, setAppsLoading] = React.useState(true)
  const [stage, setStage] = React.useState<StageFilter>('all')
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null)
  const [actingId, setActingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!id) return
    let cancelled = false

    const load = async () => {
      try {
        const res = await adminFetch(`/api/admin/opportunities?id=${encodeURIComponent(id)}`)
        const json = await res.json()
        if (!cancelled && json.success) setJob(json.data)
      } catch (err) {
        console.error('[admin/opportunity]', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    const unsub = onSnapshot(doc(db, 'jobs', id), (snap) => {
      if (snap.exists()) {
        setJob({ id: snap.id, ...snap.data() })
      }
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [id])

  React.useEffect(() => {
    if (!id) return
    let cancelled = false
    setAppsLoading(true)
    getOpportunityApplications(id)
      .then((apps) => enrichApplications(apps))
      .then((enriched) => {
        if (!cancelled) setApplications(enriched)
      })
      .catch((err) => console.error('[admin] applications:', err))
      .finally(() => {
        if (!cancelled) setAppsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const stats = React.useMemo(() => {
    const counts = {
      all: applications.length,
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0,
    }
    for (const app of applications) {
      const s = app.status
      if (s in counts && s !== 'all') counts[s as Exclude<StageFilter, 'all'>] += 1
    }
    return counts
  }, [applications])

  const filtered = React.useMemo(() => {
    if (stage === 'all') return applications
    return applications.filter((a) => a.status === stage)
  }, [applications, stage])

  const handleAppAction = async (appId: string, status: JobApplication['status']) => {
    setActingId(appId)
    try {
      await updateApplicationStatus(appId, status)
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)))
    } catch (err) {
      console.error('[admin] app status:', err)
      alert('Failed to update application')
    } finally {
      setActingId(null)
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
    const headers = ['Applicant', 'Email', 'Status', 'Title', 'Location', 'CV URL', 'Date']
    const rows = applications.map((a) => [
      a.applicantName,
      a.applicantEmail,
      a.status,
      a.applicantTitle || a.profileTitle || '',
      a.applicantLocation || a.profileLocation || '',
      a.resumeUrl || '',
      a.createdAt ? new Date(a.createdAt as Date).toISOString() : '',
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `applications-${id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const normalized = job
    ? normalizeOpportunityFromJob(String(job.id || id), job as Record<string, unknown>)
    : null

  const stageCards: { id: StageFilter; label: string; tone: string }[] = [
    { id: 'all', label: 'Total', tone: 'bg-sky-500 text-white' },
    { id: 'pending', label: 'Pending', tone: 'bg-amber-500 text-white' },
    { id: 'reviewing', label: 'Reviewing', tone: 'bg-orange-500 text-white' },
    { id: 'shortlisted', label: 'Shortlisted', tone: 'bg-blue-600 text-white' },
    { id: 'accepted', label: 'Accepted', tone: 'bg-emerald-600 text-white' },
    { id: 'rejected', label: 'Rejected', tone: 'bg-rose-600 text-white' },
  ]

  return (
    <AdminPageLayout
      title="Opportunity Applicants"
      description="Review candidates for this job — accept, reject, shortlist, and download CVs"
    >
      <Link href="/admin/opportunities" className={`${BUTTON_BACK} mb-6`}>
        <ArrowLeft /> Back to All Opportunities
      </Link>

      {loading ? (
        <p className="text-neutral-500">Loading…</p>
      ) : !normalized ? (
        <p className="text-neutral-500">Opportunity not found.</p>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-[#e4e1da] rounded-xl p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-neutral-900 mb-1">{normalized.title}</h1>
                <p className="text-sm text-neutral-500">
                  {normalized.companyName || normalized.businessName} ·{' '}
                  <span className="capitalize">{normalized.status}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await adminFetch('/api/admin/opportunities', {
                      method: 'PATCH',
                      body: JSON.stringify({ id, action: 'approve' }),
                    })
                    router.refresh()
                  }}
                  className="!bg-black !text-white px-4 py-2 rounded-lg text-sm"
                >
                  Approve / Publish
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm('Close this listing?')) return
                    await adminFetch('/api/admin/opportunities', {
                      method: 'PATCH',
                      body: JSON.stringify({ id, action: 'close' }),
                    })
                  }}
                  className="border border-gray-300 px-4 py-2 rounded-lg text-sm"
                >
                  Close
                </button>
                <a
                  href={`/opportunities/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-gray-300 px-4 py-2 rounded-lg text-sm inline-flex items-center"
                >
                  Public page
                </a>
              </div>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-neutral-700">
                Job description
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">
                {htmlToPlainText(normalized.description || '') || '—'}
              </p>
            </details>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stageCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setStage(card.id)}
                className={`rounded-lg px-2.5 py-2 text-left transition ${card.tone} ${
                  stage === card.id ? 'ring-2 ring-neutral-900 ring-offset-1' : ''
                }`}
              >
                <p className="text-lg font-bold leading-none">{stats[card.id]}</p>
                <p className="text-[10px] font-medium mt-1 opacity-90 uppercase tracking-wide">
                  {card.label}
                </p>
              </button>
            ))}
          </div>

          <div className="bg-white border border-[#e4e1da] rounded-xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold">
                Applicants ({filtered.length}
                {stage !== 'all' ? ` · ${stage}` : ''})
              </h2>
              {applications.length > 0 ? (
                <button
                  type="button"
                  onClick={exportCsv}
                  className="inline-flex items-center gap-2 !bg-black !text-white px-4 py-2 rounded-lg text-sm"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              ) : null}
            </div>

            {appsLoading ? (
              <p className="text-sm text-neutral-500">Loading applicants…</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-neutral-500 py-8 text-center">
                {applications.length === 0
                  ? 'No applications yet for this job.'
                  : 'No applicants in this filter.'}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="bg-neutral-900 text-white">
                      <th className="px-4 py-3 font-semibold">Candidate Name</th>
                      <th className="px-4 py-3 font-semibold">Career Summary</th>
                      <th className="px-4 py-3 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((app) => {
                      const title = app.applicantTitle || app.profileTitle || '—'
                      const location = app.applicantLocation || app.profileLocation || '—'
                      const education = app.applicantEducation || app.profileEducation || '—'
                      const experience = app.applicantExperience || app.profileExperience || '—'
                      const hours = app.applicantVolunteerHours ?? app.profileHours ?? 0
                      const photo = app.applicantAvatarUrl || app.profilePhoto
                      const applied = toDate(app.createdAt)
                      const busy = actingId === app.id

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
                                {app.applicantEmail ? (
                                  <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                                    {app.applicantEmail}
                                  </p>
                                ) : null}
                                <p className="text-[11px] text-neutral-400 mt-1">
                                  Applied On:{' '}
                                  {applied
                                    ? applied.toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      })
                                    : '—'}
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
                                disabled={busy || app.status === 'shortlisted'}
                                onClick={() => void handleAppAction(app.id, 'shortlisted')}
                                className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md bg-sky-600 text-white text-xs font-semibold disabled:opacity-40"
                              >
                                <ListChecks className="w-3.5 h-3.5" />
                                Shortlist
                              </button>
                              <button
                                type="button"
                                disabled={busy || app.status === 'accepted'}
                                onClick={() => void handleAppAction(app.id, 'accepted')}
                                className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md bg-emerald-600 text-white text-xs font-semibold disabled:opacity-40"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Accept
                              </button>
                              <button
                                type="button"
                                disabled={busy || app.status === 'rejected'}
                                onClick={() => void handleAppAction(app.id, 'rejected')}
                                className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md bg-rose-600 text-white text-xs font-semibold disabled:opacity-40"
                              >
                                <X className="w-3.5 h-3.5" />
                                Reject
                              </button>
                              {app.status === 'pending' ? (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void handleAppAction(app.id, 'reviewing')}
                                  className="inline-flex items-center justify-center h-8 px-3 rounded-md border border-neutral-300 bg-white text-neutral-700 text-[11px] font-semibold disabled:opacity-40"
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
          </div>
        </div>
      )}
    </AdminPageLayout>
  )
}
