'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Search, MapPin, Briefcase, Building2 } from 'lucide-react'
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
  UAE_LOCATION_OPTIONS,
  WORK_TYPE_OPTIONS,
  getRoleType,
  getWorkType,
  getWorkTypeLabel,
  getOpportunityLocation,
  getPostedDate,
  matchesOpportunityFilter,
  opportunitySearchHaystack,
  opportunityGenderBlocksUser,
  opportunityMemberBlocksUser,
} from '@/lib/opportunity-utils'

function roleBadgeClass(role: string): string {
  const map: Record<string, string> = {
    full_time: 'bg-blue-100 text-blue-800',
    part_time: 'bg-indigo-100 text-indigo-800',
    freelance: 'bg-amber-100 text-amber-800',
    gig: 'bg-amber-100 text-amber-800',
    volunteer: 'bg-green-100 text-green-800',
    internship: 'bg-purple-100 text-purple-800',
    training: 'bg-cyan-100 text-cyan-800',
    contract: 'bg-gray-100 text-gray-800',
  }
  return map[role] || 'bg-neutral-100 text-neutral-800'
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
  const [locationFilter, setLocationFilter] = useState('All locations')
  const [workTypeFilter, setWorkTypeFilter] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
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

  const industries = useMemo(() => {
    const set = new Set<string>()
    opportunities.forEach((o) => {
      if (o.category?.trim()) set.add(o.category.trim())
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [opportunities])

  const filtered = useMemo(() => {
    const term = debouncedSearch.toLowerCase()
    return opportunities.filter((o) => {
      const matchesBusiness = !businessIdFilter || o.businessId === businessIdFilter
      const matchesType = matchesOpportunityFilter(o, typeFilter)
      const matchesSearch = !term || opportunitySearchHaystack(o).includes(term)
      const loc = getOpportunityLocation(o)
      const matchesLocation =
        locationFilter === 'All locations' ||
        (locationFilter === 'Remote' && getWorkType(o) === 'remote') ||
        loc.toLowerCase().includes(locationFilter.toLowerCase())
      const matchesWork =
        workTypeFilter === 'all' || getWorkType(o) === workTypeFilter
      const matchesIndustry =
        industryFilter === 'all' ||
        (o.category || '').toLowerCase() === industryFilter.toLowerCase()
      return (
        matchesBusiness &&
        matchesType &&
        matchesSearch &&
        matchesLocation &&
        matchesWork &&
        matchesIndustry
      )
    })
  }, [
    opportunities,
    debouncedSearch,
    typeFilter,
    businessIdFilter,
    locationFilter,
    workTypeFilter,
    industryFilter,
  ])

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
      <div className="mb-4 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <input
          type="text"
          placeholder="Search by title, company, category, location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {UAE_LOCATION_OPTIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {FILTER_TABS.map((t) => (
            <option key={t.id} value={t.id}>
              Role: {t.label}
            </option>
          ))}
        </select>
        <select
          value={workTypeFilter}
          onChange={(e) => setWorkTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {WORK_TYPE_OPTIONS.map((w) => (
            <option key={w.id} value={w.id}>
              {w.label}
            </option>
          ))}
        </select>
        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All industries</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice(0, visibleCount).map((opp) => {
            const roleType = getRoleType(opp)
            const companyName = opp.companyName || opp.businessName
            const applyState = getApplyState(opp)
            const posted = getPostedDate(opp)
            const location = getOpportunityLocation(opp)
            const salary =
              opp.compensation ||
              (opp.salary ? `AED ${opp.salary}` : null)

            return (
              <article
                key={opp.id}
                className="border border-border rounded-lg p-4 flex flex-col bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  {opp.businessLogoUrl ? (
                    <img
                      src={opp.businessLogoUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-neutral-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{companyName}</p>
                    {posted ? (
                      <p className="text-xs text-muted-foreground">
                        Posted {format(posted, 'MMM d, yyyy')}
                      </p>
                    ) : null}
                  </div>
                </div>

                <h3 className="font-bold text-base text-foreground mb-2 line-clamp-2">{opp.title}</h3>

                <div className="flex flex-wrap gap-1.5 mb-3 text-xs">
                  <span className={`px-2 py-0.5 rounded font-medium ${roleBadgeClass(roleType)}`}>
                    {ROLE_TYPE_LABELS[roleType] || roleType}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                    {getWorkTypeLabel(opp)}
                  </span>
                  {location ? (
                    <span className="px-2 py-0.5 rounded bg-slate-100 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {location}
                    </span>
                  ) : null}
                </div>

                {salary ? (
                  <p className="text-sm font-medium text-foreground mb-3">{salary}</p>
                ) : (
                  <p className="text-sm text-muted-foreground mb-3">Compensation TBA</p>
                )}

                <div className="flex gap-2 mt-auto">
                  <Link
                    href={`/opportunities/${opp.id}`}
                    className="flex-1 py-2 text-center text-sm font-medium rounded-lg !bg-black !text-white hover:opacity-90"
                  >
                    View Details
                  </Link>
                  {applyState.href ? (
                    <a
                      href={applyState.href}
                      className="flex-1 py-2 text-center text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
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
                          : 'border border-gray-300 hover:bg-gray-50'
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
              className="min-h-[44px] px-6 py-2 bg-black text-white rounded-lg font-semibold text-sm hover:opacity-90"
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
