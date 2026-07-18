'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { auth, db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import {
  getOpportunityApplications,
  updateApplicationStatus,
} from '@/lib/business-queries'
import { JobApplication } from '@/lib/types'
import { normalizeOpportunityFromJob } from '@/lib/opportunity-utils'
import { htmlToPlainText } from '@/lib/cms-page-content'
import { ArrowLeft, Download } from 'lucide-react'
import { BUTTON_BACK } from '@/lib/admin-design-system'

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

export default function AdminOpportunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [job, setJob] = React.useState<Record<string, unknown> | null>(null)
  const [applications, setApplications] = React.useState<JobApplication[]>([])
  const [loading, setLoading] = React.useState(true)

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
    getOpportunityApplications(id).then(setApplications)

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

  const handleAppAction = async (appId: string, status: JobApplication['status']) => {
    try {
      await updateApplicationStatus(appId, status)
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status } : a))
      )
    } catch (err) {
      console.error('[admin] app status:', err)
      alert('Failed to update application')
    }
  }

  const exportCsv = () => {
    const headers = ['Applicant', 'Email', 'Status', 'CV URL', 'Date']
    const rows = applications.map((a) => [
      a.applicantName,
      a.applicantEmail,
      a.status,
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

  return (
    <AdminPageLayout title="Opportunity Detail" description="Review job posting and applications">
      <Link
        href="/admin/opportunities"
        className={`${BUTTON_BACK} mb-6`}
      >
        <ArrowLeft /> Back to All Opportunities
      </Link>

      {loading ? (
        <p className="text-neutral-500">Loading…</p>
      ) : !normalized ? (
        <p className="text-neutral-500">Opportunity not found.</p>
      ) : (
        <div className="space-y-8">
          <div className="bg-white border border-[#e4e1da] rounded-xl p-6">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">{normalized.title}</h1>
            <p className="text-sm text-neutral-500 mb-4">
              {normalized.companyName || normalized.businessName} · {normalized.status}
            </p>
            <p className="whitespace-pre-wrap text-sm text-neutral-800">
              {htmlToPlainText(normalized.description || '') || '—'}
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
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
              <button
                type="button"
                onClick={async () => {
                  if (!confirm('Delete permanently?')) return
                  await adminFetch(`/api/admin/opportunities?id=${id}`, { method: 'DELETE' })
                  router.push('/admin/opportunities')
                }}
                className="text-red-600 px-4 py-2 text-sm"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#e4e1da] rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold">Applications ({applications.length})</h2>
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

            {applications.length === 0 ? (
              <p className="text-sm text-neutral-500">No applications yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-neutral-500">
                      <th className="py-2 px-3">Applicant</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">CV</th>
                      <th className="py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className="border-b border-neutral-100">
                        <td className="py-2 px-3 font-medium">{app.applicantName}</td>
                        <td className="py-2 px-3">{app.applicantEmail}</td>
                        <td className="py-2 px-3">
                          {app.createdAt
                            ? new Date(app.createdAt as Date).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="py-2 px-3 capitalize">{app.status}</td>
                        <td className="py-2 px-3">
                          {app.resumeUrl ? (
                            <a
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                            >
                              Download CV
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1">
                            {(['reviewing', 'shortlisted', 'rejected'] as const).map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => handleAppAction(app.id, s)}
                                className="text-xs underline capitalize"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
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
