'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import {
  subscribeToReferral,
  subscribeToReferralRecords,
  updateBusinessReferralPercent,
} from '@/lib/business-queries'
import { BusinessReferral, ReferralRecord } from '@/lib/types'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardEmptyState,
  DashboardTabButton,
} from '@/components/dashboard-states'
import { Copy, Check, Share2 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

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

export default function ReferralsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [referral, setReferral] = React.useState<BusinessReferral | undefined>()
  const [records, setRecords] = React.useState<ReferralRecord[]>([])
  const [referralCode, setReferralCode] = React.useState<string | null>(null)
  const [referralPercent, setReferralPercent] = React.useState(0)
  const [savingPercent, setSavingPercent] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!user || !hasBusinessAccess(user)) {
      router.push('/login')
      return
    }

    const unsubReferral = subscribeToReferral(user.id, (data) => {
      setReferral(data)
      if (data?.referralPercentage != null) setReferralPercent(data.referralPercentage)
      setLoading(false)
    })

    const unsubRecords = subscribeToReferralRecords(user.id, setRecords)

    const unsubBiz = onSnapshot(doc(db, 'businesses', user.id), (snap) => {
      const code = snap.data()?.referralCode
      setReferralCode(typeof code === 'string' && code.trim() ? code.trim() : null)
      const pct = snap.data()?.referralContributionPercent ?? snap.data()?.referralPercent
      if (typeof pct === 'number') setReferralPercent(pct)
    })

    return () => {
      unsubReferral()
      unsubRecords()
      unsubBiz()
    }
  }, [user, router])

  const siteURL =
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    ''

  const referralLink = referralCode && siteURL ? `${siteURL}/?ref=${referralCode}` : null

  const copyLink = async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const savePercent = async () => {
    if (!user) return
    setSavingPercent(true)
    try {
      await updateBusinessReferralPercent(user.id, referralPercent)
    } catch (err) {
      console.error('[referrals] save percent:', err)
      alert('Failed to save referral percentage')
    } finally {
      setSavingPercent(false)
    }
  }

  const converted = records.filter((r) => r.status === 'converted').length
  const pending = records.filter((r) => r.status === 'pending').length
  const totalCommission = records.reduce((sum, r) => sum + (r.amount || 0), 0)

  const monthlyChart = React.useMemo(() => {
    const months: { key: string; label: string; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months.push({
        key,
        label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        count: 0,
      })
    }
    records.forEach((r) => {
      if (r.status !== 'converted') return
      const d = toDate(r.convertedAt || r.referredAt)
      if (!d) return
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const bucket = months.find((m) => m.key === key)
      if (bucket) bucket.count += 1
    })
    return months
  }, [records])

  if (!user || !hasBusinessAccess(user)) {
    return <div className="text-center py-8">Access Denied</div>
  }

  if (loading) return <DashboardSkeleton rows={4} />

  return (
    <DashboardPageShell
      title="Referrals & Commission"
      subtitle="Share your referral link to start earning commissions"
    >
      <div className="bg-white dark:bg-card border border-[#e4e1da] dark:border-border rounded-xl p-5 mb-8">
        <p className="text-xs uppercase tracking-wider text-neutral-500 dark:text-muted-foreground mb-2">Your Referral Link</p>
        {referralLink ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value={referralLink}
              className="flex-1 border rounded-lg px-3 py-2 text-sm bg-neutral-50 dark:bg-white/5"
            />
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center justify-center gap-2 !bg-black !text-white px-4 py-2 rounded-lg text-sm"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-neutral-500 dark:text-muted-foreground">
            Your referral link will appear after your business listing is approved.
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-card border border-[#e4e1da] dark:border-border rounded-xl p-5 mb-8">
        <p className="text-sm font-medium mb-2">
          Your referral contribution % to Passive Blessings
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="number"
            min={0}
            max={100}
            value={referralPercent}
            onChange={(e) => setReferralPercent(Number(e.target.value))}
            className="w-24 border rounded-lg px-3 py-2 text-sm"
          />
          <span className="text-sm text-neutral-500 dark:text-muted-foreground">%</span>
          <button
            type="button"
            onClick={savePercent}
            disabled={savingPercent}
            className="!bg-black !text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {savingPercent ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Referred', value: records.length },
          { label: 'Converted', value: converted },
          { label: 'Pending', value: pending },
          { label: 'Total Commission', value: `AED ${totalCommission}` },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-card border border-[#e4e1da] dark:border-border rounded-xl p-5">
            <p className="text-sm text-neutral-500 dark:text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-semibold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {records.length > 0 ? (
        <div className="bg-white dark:bg-card border border-[#e4e1da] dark:border-border rounded-xl p-5 mb-8">
          <h3 className="font-semibold mb-4">Monthly conversions (6 months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--foreground)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {records.length === 0 ? (
        <DashboardEmptyState
          icon={<Share2 className="w-12 h-12" />}
          title="No referrals yet"
          description="Share your referral link to start earning commissions."
        />
      ) : (
        <div className="bg-white dark:bg-card border border-[#e4e1da] dark:border-border rounded-xl overflow-x-auto table-scroll">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-neutral-500 dark:text-muted-foreground">
                <th className="py-3 px-4">Referred User</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Commission %</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Settled</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const date = toDate(r.referredAt)
                const statusClass =
                  r.status === 'converted'
                    ? 'bg-green-100 text-green-800'
                    : r.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                return (
                  <tr key={r.id} className="border-b border-neutral-100 dark:border-border">
                    <td className="py-3 px-4">
                      <p className="font-medium">{r.referredUserName || '—'}</p>
                      <p className="text-xs text-neutral-500 dark:text-muted-foreground">{r.referredUserEmail}</p>
                    </td>
                    <td className="py-3 px-4">{date ? date.toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${statusClass}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{r.commissionPercent ?? referral?.referralPercentage ?? 0}%</td>
                    <td className="py-3 px-4">{r.amount ? `AED ${r.amount}` : '—'}</td>
                    <td className="py-3 px-4">{r.settled ? 'Yes' : 'No'}</td>
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
