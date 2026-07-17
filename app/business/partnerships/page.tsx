'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import {
  subscribeToPartnershipRequests,
  withdrawPartnershipRequest,
} from '@/lib/business-queries'
import { PartnershipRequest } from '@/lib/types'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardEmptyState,
  DashboardTabButton,
} from '@/components/dashboard-states'
import { Briefcase, Plus } from 'lucide-react'

const STATUS_BADGES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
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
  const d = new Date(value as string)
  return Number.isNaN(d.getTime()) ? null : d
}

type Tab = 'all' | 'pending' | 'under_review' | 'approved' | 'declined'

export default function PartnershipsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = React.useState<PartnershipRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState<Tab>('all')

  React.useEffect(() => {
    if (!user || !hasBusinessAccess(user)) {
      router.push('/login')
      return
    }
    const unsub = subscribeToPartnershipRequests(user.id, (data) => {
      setRequests(data)
      setLoading(false)
    })
    return () => unsub()
  }, [user, router])

  const filtered =
    tab === 'all' ? requests : requests.filter((r) => r.status === tab)

  const handleWithdraw = async (id: string) => {
    if (!confirm('Withdraw this request?')) return
    try {
      await withdrawPartnershipRequest(id)
    } catch (err) {
      console.error('[partnerships] withdraw:', err)
      alert('Failed to withdraw request')
    }
  }

  if (!user || !hasBusinessAccess(user)) {
    return <div className="text-center py-8">Access Denied</div>
  }

  if (loading) return <DashboardSkeleton rows={3} />

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'under_review', label: 'Under Review' },
    { id: 'approved', label: 'Approved' },
    { id: 'declined', label: 'Declined' },
  ]

  return (
    <DashboardPageShell
      title="Partnerships & Requests"
      subtitle="Submit a partnership, campaign, or sponsorship request"
      action={
        <Link
          href="/business/partnerships/new"
          className="inline-flex items-center gap-2 !bg-black !text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Submit New Request
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <DashboardTabButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </DashboardTabButton>
        ))}
      </div>

      {filtered.length === 0 ? (
        <DashboardEmptyState
          icon={<Briefcase className="w-12 h-12" />}
          title="No requests submitted yet"
          description="Submit a partnership, campaign, or sponsorship request."
          action={
            <Link
              href="/business/partnerships/new"
              className="inline-flex !bg-black !text-white px-4 py-2 rounded-lg text-sm"
            >
              Submit a Request
            </Link>
          }
        />
      ) : (
        <div className="bg-white border border-[#e4e1da] rounded-xl overflow-x-auto table-scroll">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-neutral-500">
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Admin Notes</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => {
                const submitted = toDate(req.submittedAt)
                return (
                  <tr key={req.id} className="border-b border-neutral-100">
                    <td className="py-3 px-4">{req.type}</td>
                    <td className="py-3 px-4 font-medium">{req.title}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {submitted ? submitted.toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs capitalize ${STATUS_BADGES[req.status] || 'bg-neutral-100'}`}
                      >
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-500 max-w-[200px] truncate">
                      {req.adminNotes || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        {req.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => handleWithdraw(req.id)}
                            className="text-xs bg-black !text-white px-2 py-1 rounded-md no-underline"
                          >
                            Withdraw
                          </button>
                        ) : null}
                        {req.status === 'declined' ? (
                          <Link
                            href="/business/partnerships/new"
                            className="text-xs text-neutral-700 underline"
                          >
                            Edit & Resubmit
                          </Link>
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
    </DashboardPageShell>
  )
}
