'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { db, auth } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import type { ReferralConversionDoc } from '@/lib/referral-config'
import {
  Share2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type ReferralRow = ReferralConversionDoc & { id: string }

type BusinessRow = {
  id: string
  name: string
  referralCode: string
  referralContributionPercent: number | null
}

type BusinessAgg = BusinessRow & {
  conversions: number
  revenue: number
  contributed: number
  pending: number
  confirmed: number
  paid: number
  dominantStatus: 'pending' | 'confirmed' | 'paid' | 'none'
  records: ReferralRow[]
}

function asDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const maybe = value as { toDate?: () => Date }
    if (typeof maybe.toDate === 'function') {
      try {
        const d = maybe.toDate()
        return Number.isNaN(d.getTime()) ? null : d
      } catch {
        return null
      }
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function formatAed(n: number): string {
  return `AED ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

function formatDate(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function monthKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
}

function relatedHref(r: ReferralRow): string | null {
  const id = String(r.relatedDocId || '').trim()
  if (!id) return null
  if (r.conversionType === 'event') return `/admin/events/${id}`
  if (r.conversionType === 'membership') {
    const uid = String(r.convertedUserId || '').trim()
    return uid ? `/admin/members/${uid}` : '/admin/membership'
  }
  if (r.conversionType === 'purchase') return null
  return null
}

function statusBadgeClass(status: string): string {
  if (status === 'paid') return 'bg-green-100 text-green-800'
  if (status === 'confirmed') return 'bg-blue-100 text-blue-800'
  if (status === 'pending') return 'bg-amber-100 text-amber-800'
  return 'bg-neutral-100 text-neutral-700'
}

async function getIdToken(): Promise<string | null> {
  return auth.currentUser?.getIdToken() || null
}

/**
 * Part 13C final — admin finance reporting over referrals + businesses.
 * Conversion writes (membership / purchase / event) are not wired yet;
 * UI supports all types and shows empty until real docs appear.
 */
export default function FinanceReferralsPage() {
  const [businesses, setBusinesses] = React.useState<BusinessRow[]>([])
  const [referrals, setReferrals] = React.useState<ReferralRow[]>([])
  const [bizLoading, setBizLoading] = React.useState(true)
  const [refLoading, setRefLoading] = React.useState(true)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [actingId, setActingId] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  )
  const [search, setSearch] = React.useState('')

  const loading = bizLoading || refLoading

  React.useEffect(() => {
    const unsubBiz = onSnapshot(
      collection(db, 'businesses'),
      (snap) => {
        const rows: BusinessRow[] = []
        snap.docs.forEach((d) => {
          const data = d.data()
          const code = typeof data.referralCode === 'string' ? data.referralCode.trim() : ''
          if (!code) return
          rows.push({
            id: d.id,
            name:
              (typeof data.name === 'string' && data.name) ||
              (typeof data.businessName === 'string' && data.businessName) ||
              'Untitled',
            referralCode: code,
            referralContributionPercent:
              typeof data.referralContributionPercent === 'number'
                ? data.referralContributionPercent
                : null,
          })
        })
        rows.sort((a, b) => a.name.localeCompare(b.name))
        setBusinesses(rows)
        setBizLoading(false)
      },
      (err) => {
        console.error('[finance/referrals] businesses', err)
        setMessage({ type: 'error', text: 'Failed to load businesses.' })
        setBizLoading(false)
      }
    )

    const unsubRef = onSnapshot(
      collection(db, 'referrals'),
      (snap) => {
        const rows: ReferralRow[] = snap.docs.map((d) => {
          const data = d.data() as Partial<ReferralConversionDoc>
          return {
            id: d.id,
            businessId: String(data.businessId || ''),
            referralCode: String(data.referralCode || ''),
            conversionType: (data.conversionType as ReferralRow['conversionType']) || 'purchase',
            convertedUserId: String(data.convertedUserId || ''),
            relatedDocId: String(data.relatedDocId || ''),
            revenueAmount: Number(data.revenueAmount) || 0,
            contributionPercent: Number(data.contributionPercent) || 0,
            contributionAmount: Number(data.contributionAmount) || 0,
            status: (data.status as ReferralRow['status']) || 'pending',
            createdAt: data.createdAt,
          }
        })
        rows.sort((a, b) => {
          const da = asDate(a.createdAt)?.getTime() || 0
          const db_ = asDate(b.createdAt)?.getTime() || 0
          return db_ - da
        })
        setReferrals(rows)
        setRefLoading(false)
      },
      (err) => {
        console.error('[finance/referrals] referrals', err)
        setMessage({ type: 'error', text: 'Failed to load referral conversions.' })
        setRefLoading(false)
      }
    )

    return () => {
      unsubBiz()
      unsubRef()
    }
  }, [])

  const byBusiness = React.useMemo(() => {
    const map = new Map<string, ReferralRow[]>()
    for (const r of referrals) {
      const list = map.get(r.businessId) || []
      list.push(r)
      map.set(r.businessId, list)
    }
    return map
  }, [referrals])

  const aggregates = React.useMemo((): BusinessAgg[] => {
    return businesses.map((b) => {
      const records = byBusiness.get(b.id) || []
      let revenue = 0
      let contributed = 0
      let pending = 0
      let confirmed = 0
      let paid = 0
      for (const r of records) {
        revenue += r.revenueAmount
        contributed += r.contributionAmount
        if (r.status === 'paid') paid += 1
        else if (r.status === 'confirmed') confirmed += 1
        else pending += 1
      }
      let dominantStatus: BusinessAgg['dominantStatus'] = 'none'
      if (records.length > 0) {
        const max = Math.max(pending, confirmed, paid)
        if (paid === max) dominantStatus = 'paid'
        else if (confirmed === max) dominantStatus = 'confirmed'
        else dominantStatus = 'pending'
      }
      return {
        ...b,
        conversions: records.length,
        revenue,
        contributed,
        pending,
        confirmed,
        paid,
        dominantStatus,
        records,
      }
    })
  }, [businesses, byBusiness])

  const stats = React.useMemo(() => {
    const totalConversions = referrals.length
    const totalRevenue = referrals.reduce((s, r) => s + r.revenueAmount, 0)
    const totalContributed = referrals.reduce((s, r) => s + r.contributionAmount, 0)
    const pendingContributions = referrals
      .filter((r) => r.status !== 'paid')
      .reduce((s, r) => s + r.contributionAmount, 0)
    const confirmedCount = referrals.filter((r) => r.status === 'confirmed').length
    const pendingCount = referrals.filter((r) => r.status === 'pending').length
    return {
      totalConversions,
      totalRevenue,
      totalContributed,
      pendingContributions,
      confirmedCount,
      pendingCount,
    }
  }, [referrals])

  const leaderboard = React.useMemo(() => {
    return [...aggregates]
      .filter((a) => a.contributed > 0)
      .sort((a, b) => b.contributed - a.contributed)
      .slice(0, 10)
  }, [aggregates])

  const top5Chart = React.useMemo(() => {
    return leaderboard.slice(0, 5).map((a) => ({
      name: a.name.length > 18 ? `${a.name.slice(0, 16)}…` : a.name,
      fullName: a.name,
      contribution: Math.round(a.contributed * 100) / 100,
    }))
  }, [leaderboard])

  const monthlyTrend = React.useMemo(() => {
    if (referrals.length === 0) return []
    const map = new Map<string, number>()
    for (const r of referrals) {
      const d = asDate(r.createdAt) || new Date(0)
      const key = monthKey(d)
      map.set(key, (map.get(key) || 0) + r.revenueAmount)
    }
    // Fill last 6 months for readability when sparse
    const now = new Date()
    const keys = new Set(map.keys())
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      keys.add(monthKey(d))
    }
    return [...keys]
      .sort()
      .map((key) => ({
        month: monthLabel(key),
        revenue: Math.round((map.get(key) || 0) * 100) / 100,
      }))
  }, [referrals])

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return aggregates
    return aggregates.filter((a) => {
      const blob = [a.name, a.referralCode, String(a.referralContributionPercent ?? '')]
        .join(' ')
        .toLowerCase()
      return blob.includes(term)
    })
  }, [aggregates, search])

  const markPaid = async (businessId: string, businessName: string) => {
    const agg = aggregates.find((a) => a.id === businessId)
    if (!agg) return
    if (agg.confirmed === 0) {
      setMessage({
        type: 'info',
        text:
          agg.pending > 0
            ? `"Mark as Paid" only updates confirmed referrals. ${businessName} has ${agg.pending} pending and 0 confirmed. Conversion recording currently does not promote referrals to "confirmed" — that gap must be filled before payout marking works.`
            : `No confirmed contributions for ${businessName}.`,
      })
      return
    }
    if (
      !window.confirm(
        `Mark ${agg.confirmed} confirmed contribution(s) for ${businessName} as paid?\n\nThis records money owed TO Passive Blessings as collected/paid.`
      )
    ) {
      return
    }

    setActingId(businessId)
    setMessage(null)
    try {
      const token = await getIdToken()
      if (!token) {
        setMessage({ type: 'error', text: 'Please sign in as admin.' })
        return
      }
      const res = await fetch('/api/admin/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'mark_paid', businessId }),
      })
      const json = await res.json()
      if (!json.success) {
        setMessage({
          type: json.gap ? 'info' : 'error',
          text: json.error || 'Action failed',
        })
        return
      }
      setMessage({
        type: 'success',
        text: `Marked ${json.marked} contribution(s) as paid for ${businessName}.`,
      })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Action failed',
      })
    } finally {
      setActingId(null)
    }
  }

  const StatCard = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
    <div className="rounded-lg border border-[#e4e1da] bg-white p-4 sm:p-5 min-w-0">
      <p
        className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {label}
      </p>
      <p
        className="text-2xl sm:text-3xl text-neutral-900 break-words"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}
      >
        {loading ? '—' : value}
      </p>
      {hint ? (
        <p className="text-xs text-neutral-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          {hint}
        </p>
      ) : null}
    </div>
  )

  const EmptyCharts = () => (
    <div className="rounded-lg border border-dashed border-[#e4e1da] bg-white p-8 sm:p-10 text-center">
      <Share2 className="w-10 h-10 mx-auto text-neutral-400 mb-3" />
      <h2
        className="text-xl text-neutral-900 mb-1"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}
      >
        No referral conversions yet
      </h2>
      <p
        className="text-sm text-neutral-500 max-w-lg mx-auto"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        Attribution and business referral links are live. Charts and totals will populate when a
        referred visitor completes a paid action (membership, marketplace purchase, or paid event)
        and a document is written to the referrals collection.
      </p>
    </div>
  )

  return (
    <AdminPageLayout title="Business Referrals">
      <div className="space-y-6 w-full min-w-0">
        <div>
          <p
            className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Finance
          </p>
          <h1
            className="text-2xl sm:text-3xl text-neutral-900"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Business Referrals
          </h1>
          <p className="text-sm text-neutral-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Take-rate tracking: contribution amounts are money owed{' '}
            <span className="font-semibold text-neutral-800">to Passive Blessings by businesses</span>
            , not payouts owed to businesses.
          </p>
        </div>

        {message && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : message.type === 'info'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            {message.text}
          </div>
        )}

        {/* Pipeline gap notice — conversion recording not wired */}
        {!loading && referrals.length === 0 && (
          <div
            className="flex items-start gap-2 p-3 rounded-lg text-sm bg-amber-50 text-amber-900 border border-amber-200"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Conversion recording not wired yet</p>
              <p className="mt-0.5">
                Membership, marketplace purchase, and paid-event flows do not yet write to{' '}
                <code className="text-xs bg-amber-100 px-1 rounded">referrals/</code>. Status also
                never advances from <code className="text-xs bg-amber-100 px-1 rounded">pending</code>{' '}
                to <code className="text-xs bg-amber-100 px-1 rounded">confirmed</code>, so “Mark
                Contributions as Paid” will stay inactive until that pipeline exists.
              </p>
            </div>
          </div>
        )}

        {!loading && stats.pendingCount > 0 && stats.confirmedCount === 0 && (
          <div
            className="flex items-start gap-2 p-3 rounded-lg text-sm bg-amber-50 text-amber-900 border border-amber-200"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              {stats.pendingCount} referral(s) are <strong>pending</strong> and none are{' '}
              <strong>confirmed</strong>. Mark as Paid only updates confirmed rows — pending will not
              be treated as confirmed.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total Conversions" value={String(stats.totalConversions)} />
          <StatCard label="Total Revenue Generated" value={formatAed(stats.totalRevenue)} />
          <StatCard label="Total Contributed to PB" value={formatAed(stats.totalContributed)} />
          <StatCard
            label="Pending Contributions"
            value={formatAed(stats.pendingContributions)}
            hint="Owed to PB (status ≠ paid)"
          />
        </div>

        {/* Charts + leaderboard */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-64 bg-neutral-100 rounded-lg" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-64 bg-neutral-100 rounded-lg" />
              <div className="h-64 bg-neutral-100 rounded-lg" />
            </div>
          </div>
        ) : referrals.length === 0 ? (
          <EmptyCharts />
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#e4e1da] bg-white p-4 sm:p-6 min-w-0">
              <h2
                className="text-lg sm:text-xl text-neutral-900 mb-4"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Monthly Referral Revenue
              </h2>
              <div className="w-full h-[240px] sm:h-[300px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e1da" />
                    <XAxis dataKey="month" stroke="#888888" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#888888" tick={{ fontSize: 11 }} width={48} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderColor: '#e4e1da', fontFamily: 'Inter, sans-serif' }}
                      formatter={(value: number | string) => [
                        formatAed(Number(value) || 0),
                        'Revenue',
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#111111"
                      strokeWidth={2}
                      dot={{ fill: '#111111', r: 3 }}
                      name="Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-[#e4e1da] bg-white p-4 sm:p-6 min-w-0">
                <h2
                  className="text-lg sm:text-xl text-neutral-900 mb-4"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                >
                  Top 5 by Contribution
                </h2>
                {top5Chart.length === 0 ? (
                  <p className="text-sm text-neutral-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                    No contributions yet.
                  </p>
                ) : (
                  <div className="w-full h-[240px] sm:h-[280px] min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={top5Chart} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e1da" />
                        <XAxis
                          dataKey="name"
                          stroke="#888888"
                          tick={{ fontSize: 10 }}
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis stroke="#888888" tick={{ fontSize: 11 }} width={48} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            borderColor: '#e4e1da',
                            fontFamily: 'Inter, sans-serif',
                          }}
                          formatter={(value: number | string) => [
                            formatAed(Number(value) || 0),
                            'Contribution',
                          ]}
                          labelFormatter={(_, payload) =>
                            (payload?.[0]?.payload as { fullName?: string })?.fullName || ''
                          }
                        />
                        <Bar dataKey="contribution" fill="#111111" name="Contribution" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-[#e4e1da] bg-white p-4 sm:p-6 min-w-0">
                <h2
                  className="text-lg sm:text-xl text-neutral-900 mb-1"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                >
                  Top Contributing Businesses
                </h2>
                <p
                  className="text-xs uppercase tracking-[0.12em] text-neutral-500 mb-4"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Leaderboard · by contribution to PB
                </p>
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-neutral-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                    No contributions ranked yet.
                  </p>
                ) : (
                  <ol className="space-y-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {leaderboard.map((a, i) => (
                      <li
                        key={a.id}
                        className="flex items-center gap-3 py-2 border-b border-[#f0eee8] last:border-0 min-w-0"
                      >
                        <span className="w-6 h-6 shrink-0 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-900 truncate">{a.name}</p>
                          <p className="text-xs text-neutral-500">
                            {a.conversions} conversion{a.conversions === 1 ? '' : 's'}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-neutral-900 shrink-0">
                          {formatAed(a.contributed)}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>

            {/* Pending payouts summary */}
            <div className="rounded-lg border border-[#e4e1da] bg-neutral-900 text-white p-4 sm:p-6">
              <p
                className="text-xs uppercase tracking-[0.15em] text-neutral-400 mb-1"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Pending contributions owed to Passive Blessings
              </p>
              <p
                className="text-3xl sm:text-4xl"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                {formatAed(stats.pendingContributions)}
              </p>
              <p className="text-sm text-neutral-400 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Sum of contributionAmount where status is not paid. This is the platform take-rate
                businesses owe PB — not money PB owes businesses.
              </p>
            </div>
          </div>
        )}

        {/* Platform-wide table */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-3">
            <div>
              <h2
                className="text-lg sm:text-xl text-neutral-900"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                All Referral Businesses
              </h2>
              <p className="text-sm text-neutral-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Businesses with a referralCode — expand a row for individual conversion records.
              </p>
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search business or code…"
              className="w-full sm:w-64 border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm bg-white"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-20 bg-neutral-100 rounded" />
              <div className="h-20 bg-neutral-100 rounded" />
              <div className="h-20 bg-neutral-100 rounded" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#e4e1da] bg-white p-8 text-center">
              <Share2 className="w-9 h-9 mx-auto text-neutral-400 mb-2" />
              <p
                className="text-lg text-neutral-900"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                {businesses.length === 0
                  ? 'No businesses with referral codes yet'
                  : 'No matches'}
              </p>
              <p className="text-sm text-neutral-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                {businesses.length === 0
                  ? 'Codes are generated when a business is approved.'
                  : 'Try a different search.'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden space-y-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                {filtered.map((a) => {
                  const open = expandedId === a.id
                  return (
                    <div
                      key={a.id}
                      className="rounded-lg border border-[#e4e1da] bg-white p-4 min-w-0"
                    >
                      <button
                        type="button"
                        className="w-full flex items-start gap-2 text-left min-h-[44px]"
                        onClick={() => setExpandedId(open ? null : a.id)}
                      >
                        {open ? (
                          <ChevronDown className="w-4 h-4 mt-1 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 mt-1 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-neutral-900 truncate">{a.name}</p>
                          <p className="text-xs text-neutral-500 font-mono">{a.referralCode}</p>
                        </div>
                        {a.dominantStatus !== 'none' && (
                          <span
                            className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded shrink-0 ${statusBadgeClass(a.dominantStatus)}`}
                          >
                            {a.dominantStatus}
                          </span>
                        )}
                      </button>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-neutral-500 uppercase tracking-wide">Rate</p>
                          <p>{a.referralContributionPercent ?? '—'}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 uppercase tracking-wide">
                            Conversions
                          </p>
                          <p>{a.conversions}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 uppercase tracking-wide">Revenue</p>
                          <p>{formatAed(a.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 uppercase tracking-wide">To PB</p>
                          <p>{formatAed(a.contributed)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 mt-2">
                        Status: {a.pending} pending · {a.confirmed} confirmed · {a.paid} paid
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => setExpandedId(open ? null : a.id)}
                          className="min-h-[44px] px-3 bg-white text-black border border-neutral-300 rounded text-xs font-semibold"
                        >
                          {open ? 'Hide Detail' : 'View Detail'}
                        </button>
                        <button
                          type="button"
                          disabled={actingId === a.id || a.confirmed === 0}
                          onClick={() => markPaid(a.id, a.name)}
                          className="min-h-[44px] px-3 bg-black text-white rounded text-xs font-semibold disabled:opacity-40"
                          title={
                            a.confirmed === 0
                              ? 'Requires confirmed status first'
                              : 'Mark confirmed contributions as paid'
                          }
                        >
                          Mark Contributions as Paid
                        </button>
                      </div>
                      {open && <DetailList records={a.records} />}
                    </div>
                  )
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-[#e4e1da] bg-white">
                <table
                  className="w-full text-sm text-left min-w-[840px]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <thead className="bg-neutral-50 border-b border-[#e4e1da]">
                    <tr>
                      <th className="px-3 py-3 text-xs uppercase tracking-wide text-neutral-500 font-medium">
                        Business
                      </th>
                      <th className="px-3 py-3 text-xs uppercase tracking-wide text-neutral-500 font-medium">
                        Contrib %
                      </th>
                      <th className="px-3 py-3 text-xs uppercase tracking-wide text-neutral-500 font-medium">
                        Conversions
                      </th>
                      <th className="px-3 py-3 text-xs uppercase tracking-wide text-neutral-500 font-medium">
                        Revenue
                      </th>
                      <th className="px-3 py-3 text-xs uppercase tracking-wide text-neutral-500 font-medium">
                        To PB
                      </th>
                      <th className="px-3 py-3 text-xs uppercase tracking-wide text-neutral-500 font-medium">
                        Status
                      </th>
                      <th className="px-3 py-3 text-xs uppercase tracking-wide text-neutral-500 font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => {
                      const open = expandedId === a.id
                      return (
                        <React.Fragment key={a.id}>
                          <tr className="border-b border-[#f0eee8] align-top">
                            <td className="px-3 py-3">
                              <button
                                type="button"
                                className="flex items-center gap-1.5 text-left hover:underline min-h-[44px]"
                                onClick={() => setExpandedId(open ? null : a.id)}
                              >
                                {open ? (
                                  <ChevronDown className="w-4 h-4 shrink-0" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 shrink-0" />
                                )}
                                <span>
                                  <span className="font-medium text-neutral-900 block">{a.name}</span>
                                  <span className="text-xs text-neutral-500 font-mono">
                                    {a.referralCode}
                                  </span>
                                </span>
                              </button>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              {a.referralContributionPercent ?? '—'}%
                            </td>
                            <td className="px-3 py-3">{a.conversions}</td>
                            <td className="px-3 py-3 whitespace-nowrap">{formatAed(a.revenue)}</td>
                            <td className="px-3 py-3 whitespace-nowrap font-medium">
                              {formatAed(a.contributed)}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex flex-wrap gap-1">
                                {a.dominantStatus !== 'none' && (
                                  <span
                                    className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${statusBadgeClass(a.dominantStatus)}`}
                                  >
                                    {a.dominantStatus}
                                  </span>
                                )}
                                <span className="text-xs text-neutral-500 block w-full mt-0.5">
                                  {a.pending}p / {a.confirmed}c / {a.paid}paid
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(open ? null : a.id)}
                                  className="min-h-[40px] px-3 bg-white text-black border border-neutral-300 rounded text-xs font-semibold"
                                >
                                  {open ? 'Hide' : 'View Detail'}
                                </button>
                                <button
                                  type="button"
                                  disabled={actingId === a.id || a.confirmed === 0}
                                  onClick={() => markPaid(a.id, a.name)}
                                  className="min-h-[40px] px-3 bg-black text-white rounded text-xs font-semibold disabled:opacity-40"
                                >
                                  Mark Paid
                                </button>
                              </div>
                            </td>
                          </tr>
                          {open && (
                            <tr className="bg-neutral-50 border-b border-[#e4e1da]">
                              <td colSpan={7} className="px-3 py-3">
                                <DetailList records={a.records} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminPageLayout>
  )
}

function DetailList({ records }: { records: ReferralRow[] }) {
  if (records.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-2" style={{ fontFamily: 'Inter, sans-serif' }}>
        No conversion records for this business yet.
      </p>
    )
  }

  return (
    <div className="mt-2 overflow-x-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <table className="w-full text-xs sm:text-sm min-w-[640px]">
        <thead>
          <tr className="text-left text-neutral-500 border-b border-[#e4e1da]">
            <th className="py-2 pr-2 font-medium">Type</th>
            <th className="py-2 pr-2 font-medium">Date</th>
            <th className="py-2 pr-2 font-medium">Revenue</th>
            <th className="py-2 pr-2 font-medium">Contribution</th>
            <th className="py-2 pr-2 font-medium">Status</th>
            <th className="py-2 font-medium">Related</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const href = relatedHref(r)
            return (
              <tr key={r.id} className="border-b border-[#f0eee8] last:border-0">
                <td className="py-2 pr-2 capitalize">{r.conversionType}</td>
                <td className="py-2 pr-2 whitespace-nowrap">{formatDate(asDate(r.createdAt))}</td>
                <td className="py-2 pr-2 whitespace-nowrap">{formatAed(r.revenueAmount)}</td>
                <td className="py-2 pr-2 whitespace-nowrap">
                  {formatAed(r.contributionAmount)}
                  <span className="text-neutral-400 ml-1">({r.contributionPercent}%)</span>
                </td>
                <td className="py-2 pr-2">
                  <span
                    className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${statusBadgeClass(r.status)}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="py-2">
                  {href && r.relatedDocId ? (
                    <Link
                      href={href}
                      className="inline-flex items-center gap-1 text-neutral-800 underline min-h-[36px]"
                    >
                      <span className="font-mono truncate max-w-[140px]">{r.relatedDocId}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </Link>
                  ) : r.relatedDocId ? (
                    <span className="font-mono text-neutral-600">{r.relatedDocId}</span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
