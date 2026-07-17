'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { db } from '@/lib/firebase'
import { adminApiFetch } from '@/lib/admin-api-client'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { format } from 'date-fns'

type PartnershipRow = {
  id: string
  submitterName?: string
  submitterEmail?: string
  type?: string
  title?: string
  description?: string
  proposedBudget?: string | null
  attachmentURL?: string | null
  status?: string
  adminNotes?: string
  submittedAt?: Date | null
}

const STATUS_ACTIONS = ['under_review', 'approved', 'declined'] as const

const btnClass =
  'px-3 py-1.5 text-xs font-semibold rounded-lg bg-black text-white hover:bg-neutral-900 disabled:opacity-50 min-h-[36px]'

export default function AdminPartnershipsPage() {
  const [rows, setRows] = React.useState<PartnershipRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [actingId, setActingId] = React.useState<string | null>(null)
  const [notesDraft, setNotesDraft] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    const q = query(collection(db, 'partnerships'), orderBy('submittedAt', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRows(
          snap.docs.map((d) => {
            const data = d.data()
            return {
              id: d.id,
              submitterName: data.submitterName,
              submitterEmail: data.submitterEmail,
              type: data.type,
              title: data.title,
              description: data.description,
              proposedBudget: data.proposedBudget ?? null,
              attachmentURL: data.attachmentURL ?? null,
              status: data.status,
              adminNotes: data.adminNotes,
              submittedAt:
                data.submittedAt?.toDate?.() ||
                (data.createdAt?.toDate?.() ?? null),
            }
          })
        )
        setLoading(false)
      },
      () => setLoading(false)
    )
    return () => unsub()
  }, [])

  const patchPartnership = async (
    id: string,
    patch: { status?: string; adminNotes?: string }
  ) => {
    setActingId(id)
    try {
      const json = await adminApiFetch('/api/admin/partnerships', {
        method: 'PATCH',
        body: JSON.stringify({
          id,
          ...patch,
          adminNotes:
            patch.adminNotes !== undefined
              ? patch.adminNotes
              : notesDraft[id] ?? undefined,
        }),
      })
      if (!json.success) {
        alert(json.error || 'Update failed')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setActingId(null)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    await patchPartnership(id, {
      status,
      adminNotes: notesDraft[id] ?? '',
    })
  }

  const saveNotes = async (id: string) => {
    await patchPartnership(id, {
      adminNotes: notesDraft[id] ?? '',
    })
  }

  return (
    <AdminPageLayout
      title="Sponsor Inquiries"
      subtitle="Business members request sponsorship for donation causes and projects here — not a separate user type"
    >
      {loading ? (
        <p className="text-gray-500 py-12 text-center">Loading requests…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 py-12 text-center bg-gray-50 rounded-lg">
          No partnership requests yet.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const current = String(row.status || 'pending').toLowerCase()
            return (
              <div
                key={row.id}
                className="bg-white border border-gray-200 rounded-lg p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-black break-words">{row.title}</h3>
                    <p className="text-sm text-gray-600">
                      {row.submitterName} · {row.submitterEmail} · {row.type}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {row.submittedAt ? format(row.submittedAt, 'MMM dd, yyyy') : '—'} ·{' '}
                      <span className="capitalize">
                        {String(row.status || 'pending').replace(/_/g, ' ')}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_ACTIONS.map((status) => {
                      const isActive = current === status
                      return (
                        <button
                          key={status}
                          type="button"
                          disabled={actingId === row.id}
                          onClick={() => void updateStatus(row.id, status)}
                          className={`${btnClass} ${isActive ? 'ring-2 ring-offset-1 ring-black' : 'opacity-80'}`}
                        >
                          {status.replace(/_/g, ' ')}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {row.description ? (
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">{row.description}</p>
                ) : null}

                {(row.proposedBudget || row.attachmentURL) && (
                  <div className="flex flex-wrap gap-3 text-sm text-neutral-600">
                    {row.proposedBudget ? (
                      <span>Budget: {row.proposedBudget}</span>
                    ) : null}
                    {row.attachmentURL ? (
                      <a
                        href={row.attachmentURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-black font-medium"
                      >
                        View attachment
                      </a>
                    ) : null}
                  </div>
                )}

                <textarea
                  value={notesDraft[row.id] ?? row.adminNotes ?? ''}
                  onChange={(e) =>
                    setNotesDraft((prev) => ({ ...prev, [row.id]: e.target.value }))
                  }
                  placeholder="Admin notes (visible to submitter on update)"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  type="button"
                  disabled={actingId === row.id}
                  onClick={() => void saveNotes(row.id)}
                  className={btnClass}
                >
                  {actingId === row.id ? 'Saving…' : 'Save notes'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </AdminPageLayout>
  )
}
