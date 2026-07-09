'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import {
  subscribeToBusinessOpportunities,
  subscribeToBusinessOffers,
  subscribeToBusinessLeads,
  subscribeToBusinessPartnerships,
} from '@/lib/business-queries'
import { subscribeToPublishedEvents } from '@/lib/event-queries'
import type { BusinessOpportunity, BusinessOffer, BusinessLead, BusinessPartnership } from '@/lib/types'
import type { NormalizedEvent } from '@/lib/event-utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function toChartDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
}

export function BusinessDashboardHomeSections({ businessId }: { businessId: string }) {
  const router = useRouter()
  const [jobs, setJobs] = React.useState<BusinessOpportunity[]>([])
  const [offers, setOffers] = React.useState<BusinessOffer[]>([])
  const [leads, setLeads] = React.useState<BusinessLead[]>([])
  const [partnerships, setPartnerships] = React.useState<BusinessPartnership[]>([])
  const [networkEvents, setNetworkEvents] = React.useState<NormalizedEvent[]>([])

  React.useEffect(() => {
    const unsubs = [
      subscribeToBusinessOpportunities(businessId, setJobs),
      subscribeToBusinessOffers(businessId, setOffers),
      subscribeToBusinessLeads(businessId, setLeads),
      subscribeToBusinessPartnerships(businessId, setPartnerships),
      subscribeToPublishedEvents((events) => {
        const now = Date.now()
        const upcoming = events
          .filter((e) => {
            const start = e.startDate?.getTime?.() ?? 0
            const isUpcoming = start >= now - 24 * 60 * 60 * 1000
            const isMine = e.createdBy === businessId
            const isNetworking =
              Array.isArray(e.tags) && e.tags.some((t) => String(t).toLowerCase().includes('network'))
            return isUpcoming && (isMine || isNetworking)
          })
          .slice(0, 5)
        setNetworkEvents(upcoming)
      }),
    ]
    return () => unsubs.forEach((u) => u())
  }, [businessId])

  const recentJobs = jobs.slice(0, 3)
  const recentOffers = offers.slice(0, 3)

  const leadsChart = React.useMemo(() => {
    const map = new Map<string, number>()
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    for (const lead of leads) {
      const raw = lead.createdAt
      const d =
        raw instanceof Date
          ? raw
          : raw && typeof raw === 'object' && 'toDate' in raw
            ? (raw as { toDate: () => Date }).toDate()
            : new Date(String(raw || 0))
      if (d.getTime() < cutoff) continue
      const key = toChartDate(d)
      map.set(key, (map.get(key) || 0) + 1)
    }
    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .slice(-14)
  }, [leads])

  const converted = leads.filter((l) => l.convertedToCustomer || l.status === 'converted').length
  const conversionRate = leads.length ? Math.round((converted / leads.length) * 100) : 0

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Posted Jobs</h2>
          <Link href="/business/opportunities" className="text-sm font-medium underline">View All Jobs</Link>
        </div>
        {recentJobs.length === 0 ? (
          <p className="text-sm text-neutral-500">No jobs posted yet.</p>
        ) : (
          <div className="space-y-2">
            {recentJobs.map((job) => (
              <Card key={job.id} className="p-4 flex flex-wrap items-center justify-between gap-3 border-[#e4e1da]">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-xs text-neutral-500 capitalize">{job.type || job.jobType} · {job.applications || 0} applications · {job.status}</p>
                </div>
                <button type="button" onClick={() => router.push(`/business/opportunities/${job.id}`)} className="min-h-[36px] px-3 bg-black text-white rounded text-sm">Manage</button>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Posted Offers</h2>
          <Link href="/business/offers" className="text-sm font-medium underline">View All Offers</Link>
        </div>
        {recentOffers.length === 0 ? (
          <p className="text-sm text-neutral-500">No offers posted yet.</p>
        ) : (
          <div className="space-y-2">
            {recentOffers.map((offer) => (
              <Card key={offer.id} className="p-4 flex flex-wrap items-center justify-between gap-3 border-[#e4e1da]">
                <div>
                  <p className="font-medium">{offer.title}</p>
                  <p className="text-xs text-neutral-500 capitalize">{offer.type} · {offer.views || 0} views · {offer.status}</p>
                </div>
                <button type="button" onClick={() => router.push(`/business/offers/${offer.id}/edit`)} className="min-h-[36px] px-3 bg-black text-white rounded text-sm">Manage</button>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Leads (last 30 days)</h2>
          <Link href="/business/leads" className="text-sm font-medium underline">View Leads</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 text-center">
          <Card className="p-3 border-[#e4e1da]"><p className="text-xs text-neutral-500">Total</p><p className="text-xl font-bold">{leads.length}</p></Card>
          <Card className="p-3 border-[#e4e1da]"><p className="text-xs text-neutral-500">Converted</p><p className="text-xl font-bold">{converted}</p></Card>
          <Card className="p-3 border-[#e4e1da]"><p className="text-xs text-neutral-500">Rate</p><p className="text-xl font-bold">{conversionRate}%</p></Card>
        </div>
        <div className="h-48">
          {leadsChart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={leadsChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#111" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-neutral-500 text-center py-8">No leads in the last 30 days.</p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Partnership Requests</h2>
          <Link href="/business/partnerships/new" className="min-h-[36px] inline-flex items-center px-3 bg-black text-white rounded text-sm">Submit New Request</Link>
        </div>
        {partnerships.length === 0 ? (
          <p className="text-sm text-neutral-500">No partnership requests yet.</p>
        ) : (
          <div className="space-y-2">
            {partnerships.slice(0, 5).map((p) => (
              <Card key={p.id} className="p-4 border-[#e4e1da]">
                <p className="font-medium">{p.title || p.type}</p>
                <p className="text-xs text-neutral-500 capitalize">{p.status} · {p.type}</p>
              </Card>
            ))}
          </div>
        )}
        <Link href="/business/partnerships" className="inline-block mt-3 text-sm underline">View all requests</Link>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upcoming Networking Events</h2>
          <Link href="/business/events" className="text-sm font-medium underline">View All Events</Link>
        </div>
        {networkEvents.length === 0 ? (
          <p className="text-sm text-neutral-500">No upcoming networking events.</p>
        ) : (
          <div className="space-y-2">
            {networkEvents.map((event) => (
              <Card key={event.id} className="p-4 flex flex-wrap items-center justify-between gap-3 border-[#e4e1da]">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-xs text-neutral-500">
                    {event.startDate?.toLocaleDateString?.('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    · {event.locationName || 'TBC'}
                  </p>
                </div>
                <Link href={`/events/${event.id}`} className="min-h-[36px] inline-flex items-center px-3 bg-black text-white rounded text-sm">
                  View
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
