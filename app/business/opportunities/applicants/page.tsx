'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { getBusinessApplications, updateApplicationStatus } from '@/lib/business-queries'
import { JobApplication } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Phone, FileText } from 'lucide-react'

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

export default function BusinessApplicants() {
  const { user } = useAuth()
  const router = useRouter()
  const [applications, setApplications] = React.useState<JobApplication[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | JobApplication['status']>('all')

  React.useEffect(() => {
    if (!user) return
    if (!hasBusinessAccess(user)) {
      router.push('/business/signup')
      return
    }
    loadApplications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadApplications = async () => {
    if (!user) return
    setLoading(true)
    try {
      const apps = await getBusinessApplications(user.id)
      setApplications(apps)
    } catch (err) {
      console.error('[v0] Failed to load applications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (
    appId: string,
    status: JobApplication['status']
  ) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status } : a))
    )
    try {
      await updateApplicationStatus(appId, status)
    } catch (err) {
      console.error('[v0] Failed to update status:', err)
      loadApplications()
    }
  }

  const filtered =
    filter === 'all'
      ? applications
      : applications.filter((a) => a.status === filter)

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
            Review and manage applications to your opportunities
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Filter tabs */}
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
              return (
                <div
                  key={app.id}
                  className="rounded-xl p-6"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e4e1da' }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold shrink-0"
                        style={{ backgroundColor: '#e4e1da', color: '#111111' }}
                      >
                        {app.applicantName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 style={{ color: '#111111', fontWeight: 600, fontSize: '18px' }}>
                          {app.applicantName}
                        </h3>
                        <p style={{ color: '#888888', fontSize: '14px' }}>
                          Applied for: {app.opportunityTitle}
                        </p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm" style={{ color: '#555555' }}>
                          <a href={`mailto:${app.applicantEmail}`} className="flex items-center gap-1 hover:underline">
                            <Mail className="w-3.5 h-3.5" />
                            {app.applicantEmail}
                          </a>
                          {app.applicantPhone && (
                            <a href={`tel:${app.applicantPhone}`} className="flex items-center gap-1 hover:underline">
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
                              Resume
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
