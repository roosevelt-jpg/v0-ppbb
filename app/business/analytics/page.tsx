'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import {
  subscribeToBusinessOpportunities,
  subscribeToBusinessOffers,
  subscribeToBusinessLeads,
  getBusinessDashboardStats,
} from '@/lib/business-queries'
import type { BusinessOpportunity, BusinessOffer, BusinessLead } from '@/lib/types'
import { Card } from '@/components/ui/card'
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

export default function Analytics() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = React.useState<Awaited<ReturnType<typeof getBusinessDashboardStats>> | null>(null)
  const [jobs, setJobs] = React.useState<BusinessOpportunity[]>([])
  const [offers, setOffers] = React.useState<BusinessOffer[]>([])
  const [leads, setLeads] = React.useState<BusinessLead[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!user || !hasBusinessAccess(user)) {
      router.push('/login')
      return
    }
    void getBusinessDashboardStats(user.id).then(setStats)
    const unsubs = [
      subscribeToBusinessOpportunities(user.id, setJobs),
      subscribeToBusinessOffers(user.id, setOffers),
      subscribeToBusinessLeads(user.id, setLeads, () => {}, () => setLoading(false)),
    ]
    setLoading(false)
    return () => unsubs.forEach((u) => u())
  }, [user, router])

  const profileViews = React.useMemo(() => {
    const map = new Map<string, number>()
    leads.filter((l) => (l.sourceType || l.leadSource) === 'profile_view').forEach((l) => {
      const d = l.createdAt instanceof Date ? l.createdAt : new Date(String(l.createdAt || 0))
      const key = d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
      map.set(key, (map.get(key) || 0) + 1)
    })
    return Array.from(map.entries()).map(([date, views]) => ({ date, views })).slice(-14)
  }, [leads])

  const leadsBySource = React.useMemo(() => {
    const counts: Record<string, number> = {}
    for (const l of leads) {
      const s = l.sourceType || l.leadSource || 'direct'
      counts[s] = (counts[s] || 0) + 1
    }
    return Object.entries(counts).map(([source, count]) => ({ source, count }))
  }, [leads])

  if (!user || !hasBusinessAccess(user)) return <div className="text-center py-8">Access Denied</div>

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
      {loading ? (
        <p className="text-neutral-500">Loading analytics…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-[#e4e1da]"><p className="text-xs text-neutral-500">Jobs posted</p><p className="text-2xl font-bold">{stats?.opportunitiesPosted || 0}</p></Card>
            <Card className="p-4 border-[#e4e1da]"><p className="text-xs text-neutral-500">Offers posted</p><p className="text-2xl font-bold">{stats?.offersPosted || 0}</p></Card>
            <Card className="p-4 border-[#e4e1da]"><p className="text-xs text-neutral-500">Total leads</p><p className="text-2xl font-bold">{stats?.leadsGenerated || 0}</p></Card>
            <Card className="p-4 border-[#e4e1da]"><p className="text-xs text-neutral-500">Referral earnings</p><p className="text-2xl font-bold">AED {stats?.referralEarnings || 0}</p></Card>
          </div>

          <Card className="p-6 border-[#e4e1da]">
            <h3 className="font-semibold mb-4">Profile views (from leads)</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profileViews.length ? profileViews : [{ date: '—', views: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#111" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 border-[#e4e1da]">
            <h3 className="font-semibold mb-4">Job board performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead><tr className="border-b"><th className="text-left py-2">Job</th><th className="text-left py-2">Applications</th><th className="text-left py-2">Status</th></tr></thead>
                <tbody>
                  {jobs.slice(0, 10).map((j) => (
                    <tr key={j.id} className="border-b border-neutral-100">
                      <td className="py-2">{j.title}</td>
                      <td className="py-2">{j.applications || 0}</td>
                      <td className="py-2 capitalize">{j.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6 border-[#e4e1da]">
            <h3 className="font-semibold mb-4">Marketplace performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead><tr className="border-b"><th className="text-left py-2">Offer</th><th className="text-left py-2">Views</th><th className="text-left py-2">Purchases</th></tr></thead>
                <tbody>
                  {offers.slice(0, 10).map((o) => (
                    <tr key={o.id} className="border-b border-neutral-100">
                      <td className="py-2">{o.title}</td>
                      <td className="py-2">{o.views || 0}</td>
                      <td className="py-2">{o.conversions || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6 border-[#e4e1da]">
            <h3 className="font-semibold mb-4">Leads by source</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsBySource.length ? leadsBySource : [{ source: 'none', count: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#111" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
