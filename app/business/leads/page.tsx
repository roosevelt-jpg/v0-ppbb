'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { subscribeToBusinessLeads, updateLead } from '@/lib/business-queries'
import { BusinessLead } from '@/lib/types'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardEmptyState,
  DashboardTabButton,
} from '@/components/dashboard-states'
import { Users, TrendingUp, DollarSign, CheckCircle } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const SOURCE_BADGES: Record<string, string> = {
  job_view: 'bg-blue-100 text-blue-800',
  offer_view: 'bg-amber-100 text-amber-800',
  profile_view: 'bg-slate-100 text-slate-800',
  message: 'bg-purple-100 text-purple-800',
  discount_use: 'bg-green-100 text-green-800',
  opportunity: 'bg-blue-100 text-blue-800',
  offer: 'bg-amber-100 text-amber-800',
  direct: 'bg-slate-100 text-slate-800',
  marketplace: 'bg-green-100 text-green-800',
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

function getSourceType(lead: BusinessLead): string {
  return lead.sourceType || lead.leadSource || 'direct'
}

export default function LeadsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [leads, setLeads] = React.useState<BusinessLead[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = React.useState('all')
  const [dateRange, setDateRange] = React.useState<7 | 30 | 90>(30)

  React.useEffect(() => {
    if (!user || !hasBusinessAccess(user)) {
      router.push('/login')
      return
    }
    setLoading(true)
    setError(null)
    const unsub = subscribeToBusinessLeads(user.id, (data) => {
      setLeads(data)
      setLoading(false)
    })
    return () => unsub()
  }, [user, router])

  const rangeStart = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - dateRange)
    return d
  }, [dateRange])

  const inRange = React.useMemo(
    () =>
      leads.filter((l) => {
        const created = toDate(l.createdAt)
        return created ? created >= rangeStart : true
      }),
    [leads, rangeStart]
  )

  const filtered = React.useMemo(() => {
    if (sourceFilter === 'all') return inRange
    return inRange.filter((l) => getSourceType(l) === sourceFilter)
  }, [inRange, sourceFilter])

  const converted = inRange.filter((l) => l.status === 'converted' || l.converted).length
  const conversionRate =
    inRange.length > 0 ? ((converted / inRange.length) * 100).toFixed(1) : '0'
  const avgValue =
    inRange.length > 0
      ? inRange.reduce((sum, l) => sum + (l.value || 0), 0) / inRange.length
      : 0

  const dailyChart = React.useMemo(() => {
    const days: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days[d.toISOString().slice(0, 10)] = 0
    }
    inRange.forEach((l) => {
      const created = toDate(l.createdAt)
      if (!created) return
      const key = created.toISOString().slice(0, 10)
      if (key in days) days[key] += 1
    })
    return Object.entries(days).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      count,
    }))
  }, [inRange])

  const sourceChart = React.useMemo(() => {
    const counts: Record<string, number> = {}
    inRange.forEach((l) => {
      const src = getSourceType(l)
      counts[src] = (counts[src] || 0) + 1
    })
    return Object.entries(counts).map(([source, count]) => ({ source, count }))
  }, [inRange])

  const handleStatusChange = async (leadId: string, newStatus: BusinessLead['status']) => {
    try {
      await updateLead(leadId, {
        status: newStatus,
        converted: newStatus === 'converted',
      })
    } catch (err) {
      console.error('[leads] update error:', err)
      alert('Error updating lead')
    }
  }

  if (!user || !hasBusinessAccess(user)) {
    return <div className="text-center py-8">Access Denied</div>
  }

  if (loading) return <DashboardSkeleton rows={4} />

  if (error) {
    return (
      <DashboardPageShell title="Leads & Conversions" subtitle="Track leads from your listings and profile">
        <p className="text-red-600 text-sm">{error}</p>
      </DashboardPageShell>
    )
  }

  const sourceTypes = [
    'all',
    'job_view',
    'offer_view',
    'profile_view',
    'message',
    'discount_use',
  ]

  return (
    <DashboardPageShell
      title="Leads & Conversions"
      subtitle="Leads are generated when members view your profile, listings, or opportunities"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Leads', value: inRange.length, icon: Users },
          { label: 'Converted', value: converted, icon: CheckCircle },
          { label: 'Conversion Rate', value: `${conversionRate}%`, icon: TrendingUp },
          { label: 'Avg Value', value: `AED ${avgValue.toFixed(0)}`, icon: DollarSign },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-[#e4e1da] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <stat.icon className="w-7 h-7 text-neutral-300" />
              <div>
                <p className="text-sm text-neutral-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-neutral-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm text-neutral-500 self-center mr-2">Source:</span>
        {sourceTypes.map((s) => (
          <DashboardTabButton
            key={s}
            active={sourceFilter === s}
            onClick={() => setSourceFilter(s)}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </DashboardTabButton>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <span className="text-sm text-neutral-500 self-center mr-2">Date range:</span>
        {([7, 30, 90] as const).map((d) => (
          <DashboardTabButton
            key={d}
            active={dateRange === d}
            onClick={() => setDateRange(d)}
          >
            Last {d} days
          </DashboardTabButton>
        ))}
      </div>

      {inRange.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-[#e4e1da] rounded-xl p-5">
            <h3 className="font-semibold mb-4">Daily leads (30 days)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#111" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white border border-[#e4e1da] rounded-xl p-5">
            <h3 className="font-semibold mb-4">Leads by source</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sourceChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#111" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <DashboardEmptyState
          icon={<Users className="w-12 h-12" />}
          title="No leads yet"
          description="Leads are generated when members view your profile, listings, or opportunities."
        />
      ) : (
        <div className="bg-white border border-[#e4e1da] rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-neutral-500">
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Converted</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const src = getSourceType(lead)
                const created = toDate(lead.createdAt)
                return (
                  <tr key={lead.id} className="border-b border-neutral-100">
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${SOURCE_BADGES[src] || 'bg-neutral-100'}`}
                      >
                        {src}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {created ? created.toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-xs text-neutral-500">{lead.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      {lead.status === 'converted' || lead.converted ? 'Yes' : 'No'}
                    </td>
                    <td className="py-3 px-4">
                      {lead.value ? `AED ${lead.value}` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          handleStatusChange(lead.id, e.target.value as BusinessLead['status'])
                        }
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                      </select>
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
