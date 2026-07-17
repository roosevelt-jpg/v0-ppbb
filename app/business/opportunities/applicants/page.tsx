'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { getBusinessApplications, updateApplicationStatus } from '@/lib/business-queries'
import { JobApplication } from '@/lib/types'
import { ArrowLeft, Mail, Phone, FileText, MapPin, Clock, GraduationCap, Briefcase } from 'lucide-react'
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

const STATUS_STYLES: Record<JobApplication['status'], { bg: string; color: string }> = {
  pending: { bg: '#fef3c7', color: '#92400e' },
  reviewing: { bg: '#dbeafe', color: '#1e40af' },
  shortlisted: { bg: '#e0e7ff', color: '#3730a3' },
  accepted: { bg: '#dcfce7', color: '#166534' },
  rejected: { bg: '#fee2e2', color: '#991b1b' },
}

type EnrichedApp = JobApplication & {
  profileTitle?: string
  profileLocation?: string
  profileEducation?: string
  profileExperience?: string
  profileHours?: number
}

export default function BusinessApplicants() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const opportunityIdFilter = searchParams.get('opportunityId')
  const [applications, setApplications] = React.useState<EnrichedApp[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | JobApplication['status']>('all')

  React.useEffect(() => {
    if (!user) return
    if (!hasBusinessAccess(user)) {
      router.push('/login')
      return
    }
    void loadApplications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadApplications = async () => {
    if (!user) return
    setLoading(true)
    try {
      const apps = await getBusinessApplications(user.id)
      const enriched = await Promise.all(
        apps.map(async (app) => {
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

  const filtered =
    filter === 'all'
      ? applications.filter((a) =>
          opportunityIdFilter ? a.opportunityId === opportunityIdFilter : true
        )
      : applications.filter(
          (a) =>
            a.status === filter &&
            (opportunityIdFilter ? a.opportunityId === opportunityIdFilter : true)
        )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '32px' }}>
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push('/business/opportunities')}
            className="flex items-center gap-2 text-sm mb-4"
            style={{ color: '#888888' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Opportunities
          </button>
          <h1 style={{ color: '#111111', fontSize: '32px', fontWeight: 700 }}>Applicants</h1>
          <p style={{ color: '#888888', marginTop: '8px' }}>
            Review directory-style applicant cards and manage status
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', ...STATUS_OPTIONS] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors"
              style={{
                backgroundColor: filter === opt ? '#111111' : '#ffffff',
                color: filter === opt ? '#ffffff' : '#555555',
                border: '1px solid #e4e1da',
              }}
            >
              {opt}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12" style={{ color: '#888888' }}>
            Loading applicants...
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e4e1da', color: '#888888' }}
          >
            No applications {filter !== 'all' ? `with status "${filter}"` : 'yet'}.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => {
              const statusStyle = STATUS_STYLES[app.status]
              const title = app.applicantTitle || app.profileTitle || ''
              const location = app.applicantLocation || app.profileLocation || ''
              const education = app.applicantEducation || app.profileEducation || ''
              const experience = app.applicantExperience || app.profileExperience || ''
              const hours =
                app.applicantVolunteerHours ?? app.profileHours ?? undefined
              return (
                <div
                  key={app.id}
                  className="rounded-xl p-6"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e4e1da' }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold shrink-0"
                        style={{ backgroundColor: '#e4e1da', color: '#111111' }}
                      >
                        {app.applicantName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <h3 style={{ color: '#111111', fontWeight: 600, fontSize: '18px' }}>
                          {app.applicantName}
                        </h3>
                        {title ? (
                          <p className="text-sm text-neutral-600 mt-0.5">{title}</p>
                        ) : null}
                        <p style={{ color: '#888888', fontSize: '14px' }}>
                          Applied for: {app.opportunityTitle}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-neutral-600">
                          {location ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {location}
                            </span>
                          ) : null}
                          {typeof hours === 'number' && hours > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {hours} volunteer hrs
                            </span>
                          ) : null}
                          {education ? (
                            <span className="inline-flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5" />
                              {education}
                            </span>
                          ) : null}
                          {experience ? (
                            <span className="inline-flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5" />
                              {experience}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm" style={{ color: '#555555' }}>
                          <a
                            href={`mailto:${app.applicantEmail}`}
                            className="flex items-center gap-1 hover:underline"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            {app.applicantEmail}
                          </a>
                          {app.applicantPhone && (
                            <a
                              href={`tel:${app.applicantPhone}`}
                              className="flex items-center gap-1 hover:underline"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {app.applicantPhone}
                            </a>
                          )}
                          {app.resumeUrl && (
                            <a
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:underline"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Resume / CV
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                    >
                      {app.status}
                    </span>
                  </div>

                  {app.coverLetter && (
                    <div
                      className="mt-4 p-4 rounded-lg text-sm"
                      style={{ backgroundColor: '#faf9f7', color: '#555555' }}
                    >
                      {app.coverLetter}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(app.id, status)}
                        disabled={app.status === status}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: app.status === status ? '#111111' : '#f3f2ef',
                          color: app.status === status ? '#ffffff' : '#555555',
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
