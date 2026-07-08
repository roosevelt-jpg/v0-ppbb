'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { BeneficiarySupportForm } from '@/components/beneficiary-support-form'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
} from 'lucide-react'

type RequestRow = {
  id: string
  fullName?: string
  status?: string
  emergencyLevel?: string
  createdAt?: { toDate?: () => Date }
  submissionDate?: { toDate?: () => Date }
  reason?: string
}

function statusMeta(status?: string) {
  switch (status) {
    case 'approved':
      return { label: 'Approved', className: 'bg-green-100 text-green-800', Icon: CheckCircle2 }
    case 'rejected':
      return { label: 'Rejected', className: 'bg-red-100 text-red-800', Icon: AlertCircle }
    case 'under_review':
      return { label: 'Under review', className: 'bg-amber-100 text-amber-800', Icon: Clock }
    case 'pending':
    case 'submitted':
      return {
        label: status === 'pending' ? 'Pending' : 'Submitted',
        className: 'bg-amber-100 text-amber-800',
        Icon: Clock,
      }
    default:
      return { label: status || 'Unknown', className: 'bg-neutral-100 text-neutral-700', Icon: FileText }
  }
}

function CharityRequestsContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (searchParams.get('apply') === '1') {
      setShowForm(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    let unsubFallback: (() => void) | null = null

    const q = query(
      collection(db, 'beneficiaryRequests'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setRequests(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<RequestRow, 'id'>),
          }))
        )
        setLoading(false)
      },
      (err) => {
        console.warn('[charity-requests] ordered query failed, using fallback:', err)
        const fallback = query(
          collection(db, 'beneficiaryRequests'),
          where('userId', '==', user.uid)
        )
        unsubFallback = onSnapshot(fallback, (snapshot) => {
          const rows = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<RequestRow, 'id'>),
          }))
          rows.sort((a, b) => {
            const aT = a.createdAt?.toDate?.()?.getTime() || 0
            const bT = b.createdAt?.toDate?.()?.getTime() || 0
            return bT - aT
          })
          setRequests(rows)
          setLoading(false)
        })
      }
    )

    return () => {
      unsubscribe()
      unsubFallback?.()
    }
  }, [user])

  const btnPrimary =
    'min-h-[44px] inline-flex items-center justify-center gap-2 bg-black hover:bg-neutral-900 text-white px-4 py-2.5 rounded text-sm font-semibold'
  const btnSecondary =
    'min-h-[44px] inline-flex items-center justify-center gap-2 bg-white text-black border border-neutral-300 hover:bg-neutral-50 px-4 py-2.5 rounded text-sm font-semibold'

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p
            className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Member support
          </p>
          <h1
            className="text-3xl sm:text-4xl text-neutral-900"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Charity Support Requests
          </h1>
          <p
            className="text-sm text-neutral-600 mt-2 max-w-xl"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Apply confidentially for welfare support. Your documents are stored on a restricted path
            and reviewed only by authorized administrators.
          </p>
        </div>
        {!showForm ? (
          <button
            type="button"
            className={btnPrimary}
            style={{ fontFamily: 'Inter, sans-serif' }}
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4" />
            Apply for Support
          </button>
        ) : (
          <button
            type="button"
            className={btnSecondary}
            style={{ fontFamily: 'Inter, sans-serif' }}
            onClick={() => setShowForm(false)}
          >
            Hide form
          </button>
        )}
      </div>

      {showForm ? (
        <div className="mb-10">
          <BeneficiarySupportForm onCancel={() => setShowForm(false)} />
        </div>
      ) : null}

      <div className="bg-white border border-neutral-200 rounded-lg p-4 sm:p-6">
        <h2
          className="text-xl mb-4 text-neutral-900"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          Your requests
        </h2>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-neutral-100 rounded" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12" style={{ fontFamily: 'Inter, sans-serif' }}>
            <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600 mb-1">No support requests yet</p>
            <p className="text-sm text-neutral-500 mb-6">
              Start an application when you need confidential charity support.
            </p>
            <button type="button" className={btnPrimary} onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" />
              Apply for Support
            </button>
          </div>
        ) : (
          <ul className="space-y-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            {requests.map((r) => {
              const meta = statusMeta(r.status)
              const when = r.submissionDate?.toDate?.() || r.createdAt?.toDate?.() || null
              return (
                <li
                  key={r.id}
                  className="border border-neutral-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <meta.Icon className="w-4 h-4 text-neutral-500 shrink-0" />
                      <span className="font-medium text-neutral-900 truncate">
                        {r.fullName || 'Support request'}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1 capitalize">
                      {r.emergencyLevel || '—'} priority
                      {when ? ` · ${when.toLocaleDateString()}` : ''}
                    </p>
                    {r.reason ? (
                      <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{r.reason}</p>
                    ) : null}
                  </div>
                  <p className="text-[10px] font-mono text-neutral-400 break-all sm:text-right">
                    {r.id}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function CharityRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-8 max-w-4xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-1/2" />
          <div className="h-40 bg-neutral-200 rounded" />
        </div>
      }
    >
      <CharityRequestsContent />
    </Suspense>
  )
}
