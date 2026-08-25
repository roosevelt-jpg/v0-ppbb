'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { format } from 'date-fns'

type VendorRow = {
  id: string
  businessName?: string
  businessType?: string
  description?: string
  website?: string
  documentsURL?: string
  status?: string
  submittedAt?: Date | null
}

export default function AdminVendorApplicationsPage() {
  const [rows, setRows] = React.useState<VendorRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [actingId, setActingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const q = query(collection(db, 'vendorApplications'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRows(
          snap.docs.map((d) => {
            const data = d.data()
            return {
              id: d.id,
              businessName: data.businessName,
              businessType: data.businessType,
              description: data.description,
              website: data.website,
              documentsURL: data.documentsURL,
              status: data.status,
              submittedAt: data.createdAt?.toDate?.() ?? data.submittedAt?.toDate?.() ?? null,
            }
          })
        )
        setLoading(false)
      },
      () => setLoading(false)
    )
    return () => unsub()
  }, [])

  const setStatus = async (id: string, action: 'approve' | 'reject') => {
    setActingId(id)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) {
        alert('Sign in as admin')
        return
      }
      const res = await fetch('/api/admin/vendor-applications', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, action }),
      })
      const json = await res.json()
      if (!json.success) alert(json.error || 'Action failed')
    } catch {
      alert('Action failed')
    } finally {
      setActingId(null)
    }
  }

  return (
    <AdminPageLayout
      title="Vendor Applications"
      subtitle="Business members apply here to serve Passive Blessings events — not a separate user type"
    >
      {loading ? (
        <p className="text-gray-500 dark:text-muted-foreground py-12 text-center">Loading applications…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 dark:text-muted-foreground py-12 text-center bg-gray-50 dark:bg-muted rounded-lg">No vendor applications yet.</p>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg p-4 space-y-3">
                <div>
                  <p className="font-semibold text-sm break-words">{row.businessName}</p>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1 line-clamp-3 break-words">{row.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-muted-foreground">
                  <span>{row.businessType || '—'}</span>
                  <span>·</span>
                  <span>{row.submittedAt ? format(row.submittedAt, 'MMM dd, yyyy') : '—'}</span>
                  <span>·</span>
                  <span className="capitalize">{row.status || 'pending'}</span>
                </div>
                {row.documentsURL && (
                  <a href={row.documentsURL} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                    Documents
                  </a>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={actingId === row.id}
                    onClick={() => setStatus(row.id, 'approve')}
                    className="flex-1 px-3 bg-green-600 text-white rounded text-sm font-medium disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={actingId === row.id}
                    onClick={() => setStatus(row.id, 'reject')}
                    className="flex-1 px-3 bg-red-50 text-red-700 rounded text-sm font-medium disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-gray-50 dark:bg-muted border-b border-gray-200 dark:border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Business</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Submitted</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 text-sm">
                    <p className="font-medium">{row.businessName}</p>
                    <p className="text-gray-600 dark:text-muted-foreground text-xs mt-1 line-clamp-2">{row.description}</p>
                    {row.documentsURL && (
                      <a href={row.documentsURL} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                        Documents
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{row.businessType || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-muted-foreground">
                    {row.submittedAt ? format(row.submittedAt, 'MMM dd, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">{row.status || 'pending'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={actingId === row.id}
                        onClick={() => setStatus(row.id, 'approve')}
                        className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={actingId === row.id}
                        onClick={() => setStatus(row.id, 'reject')}
                        className="px-3 py-1.5 bg-red-50 text-red-700 rounded text-xs font-medium disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </AdminPageLayout>
  )
}
