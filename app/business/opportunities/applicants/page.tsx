'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { getBusinessApplications, updateApplicationStatus } from '@/lib/business-queries'
import { JobApplication } from '@/lib/types'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  GraduationCap,
  Briefcase,
  Search,
  Download,
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

const STATUS_OPTIONS: JobApplication['status'][] = [
  'pending',
  'reviewing',
  'shortlisted',
  'accepted',
  'rejected',
]

const STATUS_STYLES: Record<JobApplication['status'], string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  reviewing: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  shortlisted: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
}

type ActivityFilter = 'all' | '1h' | '24h' | '7d' | '14d' | '30d'

const ACTIVITY_OPTIONS: { id: ActivityFilter; label: string; ms: number | null }[] = [
  { id: '1h', label: 'Last Hour', ms: 60 * 60 * 1000 },
  { id: '24h', label: 'Last 24 hours', ms: 24 * 60 * 60 * 1000 },
  { id: '7d', label: 'Last 7 days', ms: 7 * 24 * 60 * 60 * 1000 },
  { id: '14d', label: 'Last 14 days', ms: 14 * 24 * 60 * 60 * 1000 },
  { id: '30d', label: 'Last 30 days', ms: 30 * 24 * 60 * 60 * 1000 },
  { id: 'all', label: 'View All', ms: null },
]

type EnrichedApp = JobApplication & {
  profileTitle?: string
  profileLocation?: string
  profileEducation?: string
  profileExperience?: string
  profileHours?: number
  profilePhoto?: string
  profileSkills?: string[]
}

function toMillis(value: unknown): number {
  if (!value) return 0
  if (typeof value === 'number') return value
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate().getTime()
    } catch {
      return 0
    }
  }
  const parsed = Date.parse(String(value))
  return Number.isNaN(parsed) ? 0 : parsed
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

export default function BusinessApplicants() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const opportunityIdFilter = searchParams.get('opportunityId')
  const [applications, setApplications] = React.useState<EnrichedApp[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | JobApplication['status']>(() => {
    const s = searchParams.get('status')
    if (s && STATUS_OPTIONS.includes(s as JobApplication['status'])) {
      return s as JobApplication['status']
    }
    return 'all'
  })
  const [keyword, setKeyword] = React.useState('')
  const [locationQuery, setLocationQuery] = React.useState('')
  const [categoryId, setCategoryId] = React.useState(opportunityIdFilter || 'all')
  const [activity, setActivity] = React.useState<ActivityFilter>('all')
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (opportunityIdFilter) {
      const status = searchParams.get('status')
      const qs = status ? `?status=${encodeURIComponent(status)}` : ''
      router.replace(`/business/opportunities/${opportunityIdFilter}${qs}`)
    }
  }, [opportunityIdFilter, router, searchParams])

  React.useEffect(() => {
    if (opportunityIdFilter) setCategoryId(opportunityIdFilter)
  }, [opportunityIdFilter])

  React.useEffect(() => {
    if (!user) return
    if (!hasBusinessAccess(user)) {
      router.push('/login')
      return
    }
    if (opportunityIdFilter) return
    void loadApplications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, opportunityIdFilter])

  const loadApplications = async () => {
    if (!user) return
    setLoading(true)
    try {
      const apps = await getBusinessApplications(user.id)
      // Deduplicate by application id (keep first)
      const seen = new Set<string>()
      const uniqueApps = apps.filter((app) => {
        if (!app.id || seen.has(app.id)) return false
        seen.add(app.id)
        return true
      })

      const enriched = await Promise.all(
        uniqueApps.map(async (app) => {
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
              profilePhoto:
                String(d.photoURL || d.avatarUrl || d.profileImage || d.avatar || '') || undefined,
              applicantAvatarUrl:
                app.applicantAvatarUrl ||
                String(d.photoURL || d.avatarUrl || d.profileImage || '') ||
                undefined,
              profileSkills: Array.isArray(d.skills)
                ? (d.skills as unknown[]).map((s) => String(s)).filter(Boolean)
                : typeof d.skills === 'string' && d.skills
                  ? d.skills.split(',').map((s) => s.trim()).filter(Boolean)
                  : [],
            }
          } catch {
            return base
          }
        })
      )
      setApplications(enriched)
    } catch (err) {
      console.error('[v0] Failed to load applications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (appId: string, status: JobApplication['status']) => {
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)))
    try {
      await updateApplicationStatus(appId, status)
    } catch (err) {
      console.error('[v0] Failed to update status:', err)
      void loadApplications()
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

  const opportunityOptions = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const app of applications) {
      if (app.opportunityId && !map.has(app.opportunityId)) {
        map.set(app.opportunityId, app.opportunityTitle || 'Opportunity')
      }
    }
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
  }, [applications])

  const filtered = React.useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    const locQ = locationQuery.trim().toLowerCase()
    const activityOpt = ACTIVITY_OPTIONS.find((o) => o.id === activity)
    const now = Date.now()

    return applications.filter((a) => {
      if (categoryId !== 'all' && a.opportunityId !== categoryId) return false
      if (filter !== 'all' && a.status !== filter) return false

      if (activityOpt?.ms != null) {
        const appliedAt = toMillis(a.createdAt)
        if (!appliedAt || now - appliedAt > activityOpt.ms) return false
      }

      const title = a.applicantTitle || a.profileTitle || ''
      const location = a.applicantLocation || a.profileLocation || ''
      const education = a.applicantEducation || a.profileEducation || ''
      const experience = a.applicantExperience || a.profileExperience || ''

      if (locQ && !location.toLowerCase().includes(locQ)) return false

      if (kw) {
        const haystack = [
          a.applicantName,
          a.applicantEmail,
          title,
          location,
          education,
          experience,
          a.opportunityTitle,
          ...(a.applicantSkills || a.profileSkills || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(kw)) return false
      }

      return true
    })
  }, [applications, categoryId, filter, activity, keyword, locationQuery])

  if (opportunityIdFilter) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] dark:bg-neutral-950 flex items-center justify-center text-neutral-500 dark:text-muted-foreground text-sm">
        Opening job applicants…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-neutral-950">
      <div className="bg-white dark:bg-card border-b border-neutral-200 dark:border-border px-4 sm:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <button
            type="button"
            onClick={() => router.push('/business/opportunities')}
            className="flex items-center gap-2 text-sm text-neutral-500 dark:text-muted-foreground mb-3 hover:text-neutral-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Opportunities
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-foreground">Candidates</h1>
          <p className="text-sm text-neutral-500 dark:text-muted-foreground mt-1">
            Browse applicants, filter by activity, and download CVs
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar filters */}
          <aside className="bg-[#eeeeee] dark:bg-neutral-800 rounded-lg p-5 h-fit lg:sticky lg:top-4">
            <label className="block text-sm font-semibold text-neutral-800 dark:text-foreground mb-2">
              Search Keywords
            </label>
            <div className="relative mb-5">
              <input
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Name, title, skills…"
                className="w-full h-10 rounded-md border border-neutral-300 dark:border-border bg-white dark:bg-card pl-3 pr-9 text-sm text-neutral-900 dark:text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
            </div>

            <label className="block text-sm font-semibold text-neutral-800 dark:text-foreground mb-2">Location</label>
            <div className="relative mb-5">
              <input
                type="search"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="City or emirate"
                className="w-full h-10 rounded-md border border-neutral-300 dark:border-border bg-white dark:bg-card pl-3 pr-9 text-sm text-neutral-900 dark:text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
              />
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
            </div>

            <label className="block text-sm font-semibold text-neutral-800 dark:text-foreground mb-2">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 rounded-md border border-neutral-300 dark:border-border bg-white dark:bg-card px-3 text-sm text-neutral-900 dark:text-foreground mb-5 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
            >
              <option value="all">All Opportunities</option>
              {opportunityOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.title}
                </option>
              ))}
            </select>

            <label className="block text-sm font-semibold text-neutral-800 dark:text-foreground mb-2">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="w-full h-10 rounded-md border border-neutral-300 dark:border-border bg-white dark:bg-card px-3 text-sm text-neutral-900 dark:text-foreground mb-5 capitalize focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>

            <p className="text-sm font-semibold text-neutral-800 dark:text-foreground mb-3">Last Activity</p>
            <ul className="space-y-2.5">
              {ACTIVITY_OPTIONS.map((opt) => (
                <li key={opt.id}>
                  <label className="flex items-center gap-2.5 text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer">
                    <input
                      type="radio"
                      name="last-activity"
                      checked={activity === opt.id}
                      onChange={() => setActivity(opt.id)}
                      className="accent-neutral-900"
                    />
                    <span className={activity === opt.id ? 'font-medium text-neutral-900 dark:text-foreground' : ''}>
                      {opt.label}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </aside>

          {/* Results */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-foreground">
                {loading ? 'Loading…' : `${filtered.length} Candidate${filtered.length === 1 ? '' : 's'} Found`}
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-16 text-neutral-500 dark:text-muted-foreground">Loading candidates…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 rounded-lg bg-white dark:bg-card border border-neutral-200 dark:border-border text-neutral-500 dark:text-muted-foreground">
                No candidates match your filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filtered.map((app) => {
                  const statusStyle = STATUS_STYLES[app.status]
                  const title = app.applicantTitle || app.profileTitle || '—'
                  const location = app.applicantLocation || app.profileLocation || '—'
                  const education = app.applicantEducation || app.profileEducation || '—'
                  const experience = app.applicantExperience || app.profileExperience || '—'
                  const hours = app.applicantVolunteerHours ?? app.profileHours ?? 0
                  const photo = app.applicantAvatarUrl || app.profilePhoto

                  return (
                    <article
                      key={app.id}
                      className="bg-white dark:bg-card border border-neutral-200 dark:border-border rounded-lg shadow-sm p-4 sm:p-5 flex flex-col gap-4"
                    >
                      <div className="flex gap-3 sm:gap-4 items-start">
                        <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photo}
                              alt={app.applicantName || 'Candidate'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl font-semibold text-neutral-700 dark:text-neutral-200">
                              {app.applicantName?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-bold text-base sm:text-lg text-neutral-900 dark:text-foreground leading-snug truncate">
                                {app.applicantName || 'Applicant'}
                              </h3>
                              <p className="text-sm font-medium text-neutral-600 dark:text-muted-foreground mt-0.5 truncate">
                                {title}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${statusStyle}`}
                            >
                              {app.status}
                            </span>
                          </div>

                          <ul className="mt-2 space-y-1 text-xs sm:text-sm text-neutral-600 dark:text-muted-foreground">
                            <li className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" />
                              <span>
                                Volunteer Hours :{' '}
                                <span className="font-medium text-neutral-800 dark:text-foreground">{hours}</span>
                              </span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" />
                              <span className="truncate">
                                Location :{' '}
                                <span className="font-medium text-neutral-800 dark:text-foreground">{location}</span>
                              </span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" />
                              <span className="truncate">
                                Education :{' '}
                                <span className="font-medium text-neutral-800 dark:text-foreground">{education}</span>
                              </span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" />
                              <span className="truncate">
                                Experience :{' '}
                                <span className="font-medium text-neutral-800 dark:text-foreground">{experience}</span>
                              </span>
                            </li>
                          </ul>

                          <p className="mt-2 text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
                            Applied for: {app.opportunityTitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {app.resumeUrl ? (
                          <button
                            type="button"
                            onClick={() => void handleDownloadCv(app)}
                            disabled={downloadingId === app.id}
                            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-[#111] text-white text-xs font-semibold uppercase tracking-wide hover:bg-neutral-800 disabled:opacity-60"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {downloadingId === app.id ? 'Downloading…' : 'View Resume'}
                          </button>
                        ) : (
                          <span className="inline-flex items-center h-9 px-4 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 text-xs font-semibold uppercase tracking-wide">
                            No CV
                          </span>
                        )}
                        {app.applicantEmail ? (
                          <a
                            href={`mailto:${app.applicantEmail}`}
                            className="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-muted-foreground hover:text-neutral-900"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email
                          </a>
                        ) : null}
                        {app.applicantPhone ? (
                          <a
                            href={`tel:${app.applicantPhone}`}
                            className="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-muted-foreground hover:text-neutral-900"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Call
                          </a>
                        ) : null}
                      </div>

                      {app.coverLetter ? (
                        <p className="text-xs text-neutral-600 dark:text-muted-foreground bg-neutral-50 dark:bg-white/5 rounded-md p-3 line-clamp-3">
                          {app.coverLetter}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-neutral-100 dark:border-border">
                        {STATUS_OPTIONS.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => void handleStatusChange(app.id, status)}
                            disabled={app.status === status}
                            className="px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: app.status === status ? '#111111' : 'var(--secondary)',
                              color: app.status === status ? '#ffffff' : 'var(--muted-foreground)',
                            }}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
