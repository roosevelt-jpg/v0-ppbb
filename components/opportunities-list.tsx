'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, MapPin, Briefcase, Clock, Building2 } from 'lucide-react'
import { BusinessOpportunity } from '@/lib/types'
import {
  subscribeToPublishedOpportunities,
  getMemberApplications,
} from '@/lib/business-queries'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { OpportunityApplyModal } from './opportunity-apply-modal'
import {
  FILTER_TABS,
  ROLE_TYPE_LABELS,
  getRoleType,
  matchesOpportunityFilter,
  opportunitySearchHaystack,
  opportunityGenderBlocksUser,
  opportunityMemberBlocksUser,
  daysUntilDeadline,
} from '@/lib/opportunity-utils'

function roleBadgeClass(role: string): string {
  const map: Record<string, string> = {
    full_time: 'bg-blue-100 text-blue-800',
    part_time: 'bg-indigo-100 text-indigo-800',
    freelance: 'bg-amber-100 text-amber-800',
    gig: 'bg-amber-100 text-amber-800',
    volunteer: 'bg-green-100 text-green-800',
    internship: 'bg-purple-100 text-purple-800',
    contract: 'bg-gray-100 text-gray-800',
  }
  return map[role] || 'bg-neutral-100 text-neutral-800'
}

function truncateLines(text: string, maxLines = 2): string {
  const lines = text.split('\n').filter(Boolean)
  if (lines.length <= maxLines) return lines.join('\n')
  return lines.slice(0, maxLines).join('\n') + '…'
}

export function OpportunitiesList() {
  const searchParams = useSearchParams()
  const businessIdFilter = searchParams.get('businessId') || ''
  const { user } = useAuth()
  const [opportunities, setOpportunities] = useState<BusinessOpportunity[]>([])
  const [appliedIds, setAppliedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selected, setSelected] = useState<BusinessOpportunity | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(12)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setLoading(true)
    const unsub = subscribeToPublishedOpportunities((opps) => {
      setOpportunities(opps)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user) {
      setAppliedIds([])
      return
    }
    getMemberApplications(user.id).then((apps) => {
      setAppliedIds(apps.map((a) => a.opportunityId))
    })
  }, [user?.id])

  const filtered = useMemo(() => {
    const term = debouncedSearch.toLowerCase()
    return opportunities.filter((o) => {
      const matchesBusiness = !businessIdFilter || o.businessId === businessIdFilter
      const matchesType = matchesOpportunityFilter(o, typeFilter)
      const matchesSearch = !term || opportunitySearchHaystack(o).includes(term)
      return matchesBusiness && matchesType && matchesSearch
    })
  }, [opportunities, debouncedSearch, typeFilter, businessIdFilter])

  const handleApplyClick = (opp: BusinessOpportunity) => {
    setSelected(opp)
    setModalOpen(true)
  }

  const getApplyState = (opp: BusinessOpportunity) => {
    if (!user) return { label: 'Sign in to Apply', disabled: false, href: `/login?returnUrl=/opportunities` }
    if (hasBusinessAccess(user)) {
      return { label: 'Posted by Business', disabled: true, href: null }
    }
    if (user.role === 'admin' || user.role === 'super_admin') {
      return { label: 'Admin View', disabled: true, href: null }
    }
    const genderBlock = opportunityGenderBlocksUser(opp, user.gender)
    const memberBlock = opportunityMemberBlocksUser(opp, user.role, hasBusinessAccess(user))
    if (genderBlock) return { label: genderBlock, disabled: true, href: null, title: genderBlock }
    if (memberBlock) return { label: 'Members Only', disabled: true, href: null, title: memberBlock }
    if (appliedIds.includes(opp.id)) return { label: 'Applied ✓', disabled: true, href: null }
    return { label: 'Apply Now', disabled: false, href: null }
  }

  return (
    <div>
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <input
          type="text"
          placeholder="Search by title, company, category, location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {FILTER_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTypeFilter(t.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              typeFilter === t.id
                ? '!bg-black !text-white hover:opacity-90'
                : '!bg-white border border-gray-300 !text-black hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading opportunities…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-border rounded-lg">
          <Briefcase className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No open opportunities right now. Check back soon.</p>
        </div>
      ) : (
        <>
        <div className="grid gap-6 lg:grid-cols-2">
          {filtered.slice(0, visibleCount).map((opp) => {
            const roleType = getRoleType(opp)
            const companyName = opp.companyName || opp.businessName
            const daysLeft = daysUntilDeadline(opp)
            const applyState = getApplyState(opp)
            const suitableFor = opp.suitableFor || []

            return (
              <article
                key={opp.id}
                className="border border-border rounded-xl p-5 flex flex-col bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3 pb-3 border-b border-border">
                  {opp.businessLogoUrl ? (
                    <img
                      src={opp.businessLogoUrl}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-neutral-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{companyName}</p>
                    {opp.category ? (
                      <span className="inline-block mt-1 text-xs bg-secondary px-2 py-0.5 rounded">
                        {opp.category}
                      </span>
                    ) : null}
                  </div>
                </div>

                <h3 className="font-bold text-lg text-foreground mb-2">{opp.title}</h3>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${roleBadgeClass(roleType)}`}>
                    {ROLE_TYPE_LABELS[roleType] || roleType}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                    {opp.remote || opp.locationType === 'remote' ? 'Remote' : opp.locationType || 'Onsite'}
                  </span>
                  {(opp as { locationCity?: string }).locationCity ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {(opp as { locationCity?: string }).locationCity}
                    </span>
                  ) : null}
                </div>

                {suitableFor.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {suitableFor.map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded bg-lime-50 text-lime-800 border border-lime-200">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="text-sm text-muted-foreground mb-2">
                  <p className="font-medium text-foreground text-xs uppercase mb-1">Description</p>
                  <p className="line-clamp-3 whitespace-pre-wrap">{truncateLines(opp.description, 2)}</p>
                </div>

                {opp.requirements?.length ? (
                  <div className="text-sm text-muted-foreground mb-2">
                    <p className="font-medium text-foreground text-xs uppercase mb-1">Requirements</p>
                    <p className="line-clamp-2">{opp.requirements.join(' · ')}</p>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3 text-sm mb-4 mt-auto">
                  {opp.salary ? (
                    <span className="font-medium text-foreground">AED {opp.salary}/mo</span>
                  ) : opp.compensation ? (
                    <span className="font-medium text-foreground">{opp.compensation}</span>
                  ) : null}
                  {daysLeft !== null ? (
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        daysLeft < 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {daysLeft < 0 ? 'Deadline passed' : `${daysLeft} days left`}
                    </span>
                  ) : null}
                  {opp.duration ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" /> {opp.duration}
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-muted-foreground mb-4">
                  Posted by {opp.posterRelation === 'connector' ? 'Connector' : 'Employer'} ·{' '}
                  {opp.applications || 0} applied
                </p>

                <div className="flex gap-2">
                  <Link
                    href={`/opportunities/${opp.id}`}
                    className="flex-1 py-2 text-center text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    View Details →
                  </Link>
                  {applyState.href ? (
                    <a
                      href={applyState.href}
                      className="flex-1 py-2 text-center text-sm font-medium rounded-lg !bg-black !text-white hover:opacity-90"
                    >
                      {applyState.label}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => !applyState.disabled && handleApplyClick(opp)}
                      disabled={applyState.disabled}
                      title={applyState.title}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                        applyState.disabled
                          ? 'bg-secondary text-muted-foreground cursor-default'
                          : '!bg-black !text-white hover:opacity-90'
                      }`}
                    >
                      {applyState.label}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
        {visibleCount < filtered.length && (
          <div className="text-center mt-8">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + 12)}
              className="min-h-[44px] px-6 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-50"
            >
              Load More
            </button>
          </div>
        )}
        </>
      )}

      <OpportunityApplyModal
        opportunity={selected}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onApplied={() => {
          if (user) {
            getMemberApplications(user.id).then((apps) => {
              setAppliedIds(apps.map((a) => a.opportunityId))
            })
          }
        }}
      />
    </div>
  )
}
