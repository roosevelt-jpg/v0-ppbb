'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Search, MapPin, Briefcase, Clock, Building2 } from 'lucide-react'
import { BusinessOpportunity } from '@/lib/types'
import {
  getAllOpenOpportunities,
  getMemberApplications,
} from '@/lib/business-queries'
import { useAuth } from '@/lib/auth-context'
import { OpportunityApplyModal } from './opportunity-apply-modal'

const TYPE_LABELS: Record<string, string> = {
  job: 'Job',
  internship: 'Internship',
  gig: 'Gig',
  volunteer: 'Volunteer',
  contract: 'Contract',
}

export function OpportunitiesList() {
  const { user } = useAuth()
  const [opportunities, setOpportunities] = useState<BusinessOpportunity[]>([])
  const [appliedIds, setAppliedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selected, setSelected] = useState<BusinessOpportunity | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const opps = await getAllOpenOpportunities()
      setOpportunities(opps)
      if (user) {
        const apps = await getMemberApplications(user.id)
        setAppliedIds(apps.map((a) => a.opportunityId))
      }
    } catch (e) {
      console.log('[v0] Failed to load opportunities:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const filtered = useMemo(() => {
    return opportunities.filter((o) => {
      const matchesType = typeFilter === 'all' || o.type === typeFilter
      const term = search.toLowerCase()
      const matchesSearch =
        !term ||
        o.title.toLowerCase().includes(term) ||
        o.businessName.toLowerCase().includes(term) ||
        (o.category || '').toLowerCase().includes(term)
      return matchesType && matchesSearch
    })
  }, [opportunities, search, typeFilter])

  const handleApplyClick = (opp: BusinessOpportunity) => {
    setSelected(opp)
    setModalOpen(true)
  }

  const types = ['all', 'job', 'internship', 'gig', 'volunteer', 'contract']

  return (
    <div>
      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <input
          type="text"
          placeholder="Search opportunities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Type filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
              typeFilter === t
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-white border border-gray-300 text-black hover:bg-gray-50'
            }`}
          >
            {t === 'all' ? 'All' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading opportunities...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-border rounded-lg">
          <Briefcase className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No open opportunities right now. Check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((opp) => {
            const alreadyApplied = appliedIds.includes(opp.id)
            return (
              <div
                key={opp.id}
                className="border border-border rounded-lg p-5 flex flex-col bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="inline-block bg-secondary text-secondary-foreground text-xs font-semibold px-2 py-1 rounded capitalize">
                    {TYPE_LABELS[opp.type] || opp.type}
                  </span>
                  {opp.featured && (
                    <span className="text-xs font-semibold text-primary">Featured</span>
                  )}
                </div>

                <h3 className="font-bold text-foreground mb-1 line-clamp-2">{opp.title}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="line-clamp-1">{opp.businessName}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                  {opp.description}
                </p>

                <div className="space-y-1 text-xs text-muted-foreground mb-4">
                  {(opp.locationText || opp.remote) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{opp.remote ? 'Remote' : opp.locationText}</span>
                    </div>
                  )}
                  {opp.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{opp.duration}</span>
                    </div>
                  )}
                  {opp.compensation && (
                    <div className="font-medium text-foreground">{opp.compensation}</div>
                  )}
                </div>

                {user ? (
                  <button
                    onClick={() => !alreadyApplied && handleApplyClick(opp)}
                    disabled={alreadyApplied}
                    className={`w-full py-2 font-medium rounded-lg transition-colors ${
                      alreadyApplied
                        ? 'bg-secondary text-muted-foreground cursor-default'
                        : 'bg-primary text-primary-foreground hover:opacity-90'
                    }`}
                  >
                    {alreadyApplied ? 'Applied' : 'Apply Now'}
                  </button>
                ) : (
                  <a
                    href={`/login?returnUrl=/opportunities`}
                    className="w-full py-2 font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors text-center block"
                  >
                    Sign in to Apply
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}

      <OpportunityApplyModal
        opportunity={selected}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onApplied={loadData}
      />
    </div>
  )
}
