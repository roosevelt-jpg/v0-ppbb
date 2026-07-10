'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { db } from '@/lib/firebase'
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import { format } from 'date-fns'

type PartnershipRow = {
  id: string
  submitterName?: string
  submitterEmail?: string
  type?: string
  title?: string
  status?: string
  adminNotes?: string
  submittedAt?: Date | null
}

export default function AdminPartnershipsPage() {
  const [rows, setRows] = React.useState<PartnershipRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [actingId, setActingId] = React.useState<string | null>(null)
  const [notesDraft, setNotesDraft] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    const q = query(collection(db, 'partnerships'), orderBy('submittedAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setRows(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            submitterName: data.submitterName,
            submitterEmail: data.submitterEmail,
            type: data.type,
            title: data.title,
            status: data.status,
            adminNotes: data.adminNotes,
            submittedAt:
              data.submittedAt?.toDate?.() ||
              (data.createdAt?.toDate?.() ?? null),
          }
        })
      )
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    setActingId(id)
    try {
      await updateDoc(doc(db, 'partnerships', id), {
        status,
        adminNotes: notesDraft[id] || null,
        updatedAt: new Date(),
      })
    } finally {
      setActingId(null)
    }
  }

  return (
    <AdminPageLayout title="Partnership Requests" subtitle="Review partnership, campaign, and charity submissions">
      {loading ? (
        <p className="text-gray-500 py-12 text-center">Loading requests…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 py-12 text-center bg-gray-50 rounded-lg">No partnership requests yet.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.id} className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-black">{row.title}</h3>
                  <p className="text-sm text-gray-600">
                    {row.submitterName} · {row.submitterEmail} · {row.type}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {row.submittedAt ? format(row.submittedAt, 'MMM dd, yyyy') : '—'} ·{' '}
                    <span className="capitalize">{String(row.status || 'pending').replace(/_/g, ' ')}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['under_review', 'approved', 'declined'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={actingId === row.id}
                      onClick={() => updateStatus(row.id, status)}
                      className="px-3 py-1.5 text-xs font-medium rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 min-h-[36px]"
                    >
                      {status.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={notesDraft[row.id] ?? row.adminNotes ?? ''}
                onChange={(e) => setNotesDraft((prev) => ({ ...prev, [row.id]: e.target.value }))}
                placeholder="Admin notes (visible to submitter on update)"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          ))}
        </div>
      )}
    </AdminPageLayout>
  )
}
