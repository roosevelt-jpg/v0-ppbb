'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Plus, CheckCircle, Clock, XCircle, Download } from 'lucide-react'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardErrorState,
  DashboardEmptyState,
  DashboardTabButton,
} from '@/components/dashboard-states'
import {
  subscribeToMemberDonations,
  parseDonationDate,
  isDonationCompleted,
  type DonationRow,
} from '@/lib/member-dashboard'

type CharityCase = {
  id: string
  title?: string
  description?: string
  bannerImage?: string
  goalAmount?: number
  raisedAmount?: number
  amountRaised?: number
}

function DonationsContent() {
  const { user, loading: authLoading } = useAuth()
  const [donations, setDonations] = React.useState<DonationRow[]>([])
  const [charityCases, setCharityCases] = React.useState<CharityCase[]>([])
  const [activeTab, setActiveTab] = React.useState<'history' | 'cases'>('history')
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (authLoading) return
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    const unsub = subscribeToMemberDonations(
      user.id,
      (rows) => {
        setDonations(rows)
        setLoading(false)
        setError(null)
      },
      (msg) => {
        console.error('[v0] Donations error:', msg)
        setError('Failed to load donations.')
        setLoading(false)
      }
    )

    const charityUnsub = onSnapshot(
      query(collection(db, 'charityCases'), where('status', '==', 'active')),
      (snapshot) => {
        setCharityCases(snapshot?.docs?.map((d) => ({ id: d.id, ...d.data() } as CharityCase)) ?? [])
      },
      (err) => console.error('[v0] charityCases error:', err)
    )

    return () => {
      unsub()
      charityUnsub()
    }
  }, [authLoading, user?.id])

  const completed = donations.filter((d) => isDonationCompleted(d.status))
  const totalDonated = completed.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
  const causesSupported = new Set(completed.map((d) => d.charityName || d.causeName).filter(Boolean)).size

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'verified':
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending':
      case 'pending_verification':
      case 'more_info_requested':
      case 'resubmission_requested':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'rejected':
      case 'refunded':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-neutral-400" />
    }
  }

  if (authLoading || loading) return <DashboardSkeleton />
  if (error) return <DashboardErrorState message={error} />

  return (
    <DashboardPageShell title="My Donations" subtitle="Your giving history and impact">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-5 border border-neutral-200">
          <p className="text-sm text-neutral-500">Total Donated</p>
          <p className="text-3xl font-bold mt-1">AED {totalDonated.toLocaleString()}</p>
        </Card>
        <Card className="p-5 border border-neutral-200">
          <p className="text-sm text-neutral-500">Causes Supported</p>
          <p className="text-3xl font-bold mt-1">{causesSupported}</p>
        </Card>
        <Card className="p-5 border border-neutral-200">
          <p className="text-sm text-neutral-500">Last Donation</p>
          <p className="text-lg font-semibold mt-1">
            {donations[0] ? parseDonationDate(donations[0]) : '—'}
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <DashboardTabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
          Donation History
        </DashboardTabButton>
        <DashboardTabButton active={activeTab === 'cases'} onClick={() => setActiveTab('cases')}>
          Active Charity Cases
        </DashboardTabButton>
      </div>

      {activeTab === 'history' ? (
        donations.length === 0 ? (
          <DashboardEmptyState
            title="No donations yet"
            description="Browse charity cases to make your first donation."
            action={
              <Link href="/donate" className="!bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold">
                Browse Charity Cases
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {donations.map((donation) => (
              <Card key={donation.id} className="p-4 border border-neutral-200">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(donation.status)}
                      <p className="font-bold truncate">{donation.causeName || donation.charityName || 'Donation'}</p>
                    </div>
                    {donation.partnerName ? (
                      <p className="text-sm text-neutral-500">Partner: {donation.partnerName}</p>
                    ) : null}
                    {(donation as { donationType?: string }).donationType ? (
                      <p className="text-sm text-neutral-500 capitalize">
                        Type: {(donation as { donationType?: string }).donationType}
                      </p>
                    ) : null}
                    <p className="text-sm text-neutral-500">{parseDonationDate(donation)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {donation.currency ?? 'AED'} {Number(donation.amount || 0).toLocaleString()}
                    </p>
                    {donation.receiptURL ? (
                      <a
                        href={donation.receiptURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 mt-2"
                      >
                        <Download className="w-4 h-4" /> Receipt
                      </a>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : charityCases.length === 0 ? (
        <DashboardEmptyState
          title="No active charity cases"
          description="No active charity cases right now."
          action={
            <Link href="/donate" className="!bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold">
              Browse Charity Cases
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {charityCases.map((c) => {
            const raised = Number(c.raisedAmount ?? c.amountRaised ?? 0)
            const goal = Number(c.goalAmount ?? 0)
            const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0
            return (
              <Card key={c.id} className="overflow-hidden border border-neutral-200">
                {c.bannerImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.bannerImage} alt="" className="w-full h-40 object-cover" />
                ) : null}
                <div className="p-4">
                  <h3 className="font-bold">{c.title ?? 'Charity case'}</h3>
                  {c.description ? (
                    <p className="text-sm text-neutral-500 mt-2 line-clamp-2">{c.description}</p>
                  ) : null}
                  {goal > 0 ? (
                    <div className="mt-3">
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-black rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        AED {raised.toLocaleString()} of AED {goal.toLocaleString()}
                      </p>
                    </div>
                  ) : null}
                  <Link
                    href="/donate"
                    className="inline-flex mt-4 !bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Donate Now
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </DashboardPageShell>
  )
}

export default function DonationsPage() {
  return <DonationsContent />
}
