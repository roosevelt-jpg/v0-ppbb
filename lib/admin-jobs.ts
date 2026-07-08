'use client'

import { db } from '@/lib/firebase'
import { collection, onSnapshot, type Unsubscribe } from 'firebase/firestore'

export type AdminJobStatus =
  | 'pending_approval'
  | 'published'
  | 'open'
  | 'draft'
  | 'closed'
  | 'filled'
  | 'archived'
  | 'rejected'
  | 'expired'
  | 'flagged'
  | string

export type AdminJob = {
  id: string
  title: string
  company: string
  businessId: string
  type: string
  category: string
  gender: string
  applications: number
  postedBy: string
  createdAt: Date | null
  deadline: Date | null
  status: AdminJobStatus
  flagged: boolean
  description: string
  source: 'jobs' | 'businessOpportunities'
}

export type AdminJobFilterTab =
  | 'all'
  | 'published'
  | 'pending_approval'
  | 'draft'
  | 'closed'
  | 'expired'
  | 'flagged'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate()
    } catch {
      return null
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

export function normalizeAdminJob(
  id: string,
  data: Record<string, unknown>,
  source: AdminJob['source']
): AdminJob {
  const status = asString(data.status, 'draft').toLowerCase()
  return {
    id,
    title: asString(data.title) || 'Untitled',
    company:
      asString(data.businessName) ||
      asString(data.company) ||
      asString(data.companyName) ||
      '—',
    businessId: asString(data.businessId),
    type: asString(data.jobType) || asString(data.type) || 'job',
    category: asString(data.category) || asString(data.jobType) || asString(data.type) || '—',
    gender: asString(data.gender) || asString(data.genderPreference) || 'Any',
    applications:
      typeof data.applications === 'number'
        ? data.applications
        : Array.isArray(data.applicants)
          ? data.applicants.length
          : 0,
    postedBy:
      asString(data.postedBy) ||
      asString(data.createdBy) ||
      asString(data.businessName) ||
      asString(data.businessId) ||
      '—',
    createdAt: toDate(data.createdAt) || toDate(data.updatedAt),
    deadline: toDate(data.deadline) || toDate(data.validUntil) || toDate(data.expiresAt),
    status,
    flagged: data.flagged === true,
    description: asString(data.description),
    source,
  }
}

/** Prefer canonical `jobs` docs; fill gaps from legacy dual-write. */
function mergeJobs(canonical: AdminJob[], legacy: AdminJob[]): AdminJob[] {
  const map = new Map<string, AdminJob>()
  for (const job of legacy) map.set(job.id, job)
  for (const job of canonical) map.set(job.id, job)
  return Array.from(map.values()).sort((a, b) => {
    const aT = a.createdAt?.getTime() || 0
    const bT = b.createdAt?.getTime() || 0
    return bT - aT
  })
}

export function isJobExpired(job: AdminJob, now = new Date()): boolean {
  if (!job.deadline) return false
  if (job.status === 'closed' || job.status === 'archived' || job.status === 'filled') return false
  return job.deadline.getTime() < now.getTime()
}

export function isJobPublished(job: AdminJob): boolean {
  const s = job.status
  return s === 'published' || s === 'open' || s === 'active'
}

export function matchesJobFilterTab(job: AdminJob, tab: AdminJobFilterTab): boolean {
  if (tab === 'all') return true
  if (tab === 'flagged') return job.flagged
  if (tab === 'expired') return isJobExpired(job)
  if (tab === 'published') return isJobPublished(job) && !isJobExpired(job)
  if (tab === 'pending_approval') return job.status === 'pending_approval'
  if (tab === 'draft') return job.status === 'draft'
  if (tab === 'closed') {
    return job.status === 'closed' || job.status === 'archived' || job.status === 'filled'
  }
  return true
}

export function jobMatchesSearch(job: AdminJob, raw: string): boolean {
  const term = raw.trim().toLowerCase()
  if (!term) return true
  const blob = [job.title, job.company, job.category, job.type, job.postedBy]
    .join(' ')
    .toLowerCase()
  return blob.includes(term)
}

export function subscribeToAdminJobs(
  callback: (jobs: AdminJob[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  let canonical: AdminJob[] = []
  let legacy: AdminJob[] = []
  const emit = () => callback(mergeJobs(canonical, legacy))

  const unsubA = onSnapshot(
    collection(db, 'jobs'),
    (snap) => {
      canonical = snap.docs.map((d) =>
        normalizeAdminJob(d.id, d.data() as Record<string, unknown>, 'jobs')
      )
      emit()
    },
    (error) => {
      console.error('[admin-jobs] jobs listener failed:', error)
      onError?.(error)
    }
  )

  const unsubB = onSnapshot(
    collection(db, 'businessOpportunities'),
    (snap) => {
      legacy = snap.docs.map((d) =>
        normalizeAdminJob(d.id, d.data() as Record<string, unknown>, 'businessOpportunities')
      )
      emit()
    },
    (error) => {
      console.error('[admin-jobs] businessOpportunities listener failed:', error)
      onError?.(error)
    }
  )

  return () => {
    unsubA()
    unsubB()
  }
}

/** Applications created in the current calendar month (for stats card). */
export function subscribeToApplicationsThisMonth(
  callback: (count: number) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'jobApplications'),
    (snap) => {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      let count = 0
      for (const d of snap.docs) {
        const created = toDate(d.data().createdAt)
        if (created && created >= monthStart) count++
      }
      callback(count)
    },
    (error) => {
      console.error('[admin-jobs] jobApplications listener failed:', error)
      onError?.(error)
      callback(0)
    }
  )
}
