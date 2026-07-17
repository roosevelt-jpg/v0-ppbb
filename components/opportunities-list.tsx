'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Search, Briefcase, Building2 } from 'lucide-react'
import { BusinessOpportunity } from '@/lib/types'
import {
  subscribeToPublishedOpportunities,
  getMemberApplications,
} from '@/lib/business-queries'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { OpportunityApplyModal } from './opportunity-apply-modal'
import {
  ROLE_TYPE_LABELS,
  ROLE_TYPE_FILTER_OPTIONS,
  UAE_LOCATION_OPTIONS,
  WORK_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  getRoleType,
  getWorkType,
  getWorkTypeLabel,
  getOpportunityLocation,
  getPostedDate,
  matchesRoleTypeFilter,
  opportunitySearchHaystack,
  opportunityGenderBlocksUser,
  opportunityMemberBlocksUser,
} from '@/lib/opportunity-utils'

const selectClass =
  'w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent'

export function OpportunitiesList() {
  const searchParams = useSearchParams()
  const businessIdFilter = searchParams.get('businessId') || ''
  const { user } = useAuth()
  const [opportunities, setOpportunities] = useState<BusinessOpportunity[]>([])
  const [appliedIds, setAppliedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleTypeFilter, setRoleTypeFilter] = useState('all')
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

  const industryOptions = useMemo(() => {
    const set = new Set<string>(INDUSTRY_OPTIONS)
    opportunities.forEach((o) => {
      if (o.category?.trim()) set.add(o.category.trim())
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [opportunities])

  const filtered = useMemo(() => {
    const term = debouncedSearch.toLowerCase()
    return opportunities.filter((o) => {
      const matchesBusiness = !businessIdFilter || o.businessId === businessIdFilter
      const matchesRole = matchesRoleTypeFilter(o, roleTypeFilter)
      const matchesSearch = !term || opportunitySearchHaystack(o).includes(term)
      const loc = getOpportunityLocation(o)
      const matchesLocation =
        locationFilter === 'All locations' ||
        (locationFilter === 'Remote' && getWorkType(o) === 'remote') ||
        loc.toLowerCase().includes(locationFilter.toLowerCase())
      const matchesWork = workTypeFilter === 'all' || getWorkType(o) === workTypeFilter
      const matchesIndustry =
        industryFilter === 'all' ||
        (o.category || '').toLowerCase() === industryFilter.toLowerCase()
      return (
        matchesBusiness &&
        matchesRole &&
        matchesSearch &&
        matchesLocation &&
        matchesWork &&
        matchesIndustry
      )
    })
  }, [
    opportunities,
    debouncedSearch,
    roleTypeFilter,
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
    if (!user) return { label: 'Apply Now', disabled: false, href: `/login?returnUrl=/opportunities` }
    if (hasBusinessAccess(user)) {
      return { label: 'Posted by Business', disabled: true, href: null as string | null }
    }
    if (user.role === 'admin' || user.role === 'super_admin') {
      return { label: 'Admin View', disabled: true, href: null as string | null }
    }
    const genderBlock = opportunityGenderBlocksUser(opp, user.gender)
    const memberBlock = opportunityMemberBlocksUser(opp, user.role, hasBusinessAccess(user))
    if (genderBlock) return { label: genderBlock, disabled: true, href: null, title: genderBlock }
    if (memberBlock) return { label: 'Members Only', disabled: true, href: null, title: memberBlock }
    if (appliedIds.includes(opp.id)) return { label: 'Applied ✓', disabled: true, href: null }
    return { label: 'Apply Now', disabled: false, href: null }
  }

  const clearFilters = () => {
    setSearch('')
    setRoleTypeFilter('all')
    setLocationFilter('All locations')
    setWorkTypeFilter('all')
    setIndustryFilter('all')
  }

  return (
    <div>
      {/* Job search filters */}
      <section className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-900">
              Job search filter
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Filter by location, role type, work type, and industry
            </p>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-semibold text-neutral-600 underline hover:text-neutral-900"
          >
            Clear filters
          </button>
        </div>

        <div className="mb-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search job title, company, industry…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-neutral-600 mb-1">
              Location
            </span>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className={selectClass}
              aria-label="Filter by location"
            >
              {UAE_LOCATION_OPTIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-neutral-600 mb-1">
              Role Type
            </span>
            <select
              value={roleTypeFilter}
              onChange={(e) => setRoleTypeFilter(e.target.value)}
              className={selectClass}
              aria-label="Filter by role type"
            >
              {ROLE_TYPE_FILTER_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-neutral-600 mb-1">
              Work Type
            </span>
            <select
              value={workTypeFilter}
              onChange={(e) => setWorkTypeFilter(e.target.value)}
              className={selectClass}
              aria-label="Filter by work type"
            >
              {WORK_TYPE_OPTIONS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-neutral-600 mb-1">
              Industry Type
            </span>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className={selectClass}
              aria-label="Filter by industry"
            >
              <option value="all">All industries</option>
              {industryOptions.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {!loading && filtered.length > 0 ? (
        <p className="text-xs text-neutral-500 mb-3">
          Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} opportunities
        </p>
      ) : null}

      {loading ? (
        <div className="text-center py-12 text-neutral-500">Loading opportunities…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-neutral-200 rounded-lg bg-white">
          <Briefcase className="w-10 h-10 mx-auto mb-3 text-neutral-400" />
          <p className="text-neutral-600">No open opportunities match your filters.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-sm font-semibold underline text-neutral-900"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {filtered.slice(0, visibleCount).map((opp) => {
              const roleType = getRoleType(opp)
              const companyName = opp.companyName || opp.businessName || 'Company'
              const applyState = getApplyState(opp)
              const posted = getPostedDate(opp)
              const location = getOpportunityLocation(opp) || 'Location TBA'
              const salary =
                opp.compensation ||
                (opp.salary ? `AED ${Number(opp.salary).toLocaleString()}` : null) ||
                (opp as { salaryRange?: string }).salaryRange ||
                'Compensation TBA'
              const industry = opp.category?.trim() || 'General'

              return (
                <article
                  key={opp.id}
                  className="bg-white border border-neutral-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5 flex gap-3 sm:gap-4 relative"
                >
                  <Link
                    href={`/opportunities/${opp.id}`}
                    className="absolute inset-0 z-0 rounded-lg"
                    aria-label={`View ${opp.title}`}
                  />
                  {/* Company logo */}
                  <div className="shrink-0 relative z-[1] pointer-events-none">
                    {opp.businessLogoUrl ? (
                      <img
                        src={opp.businessLogoUrl}
                        alt=""
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-md object-cover border border-neutral-100"
                      />
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-md bg-neutral-100 flex items-center justify-center border border-neutral-100">
                        <Building2 className="w-6 h-6 text-neutral-400" />
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="min-w-0 flex-1 flex flex-col relative z-[1]">
                    <h3 className="font-bold text-base sm:text-lg text-neutral-900 leading-snug line-clamp-2 pointer-events-none">
                      {opp.title}
                    </h3>

                    <ul className="mt-2 space-y-0.5 text-xs sm:text-sm text-neutral-600 pointer-events-none">
                      <li>
                        <span className="text-neutral-500">Company :</span> {companyName}
                      </li>
                      <li>
                        <span className="text-neutral-500">Industry :</span> {industry}
                      </li>
                      <li>
                        <span className="text-neutral-500">Date posted :</span>{' '}
                        {posted ? format(posted, 'dd.MM.yyyy') : '—'}
                      </li>
                      <li>
                        <span className="text-neutral-500">Salary :</span> {salary}
                      </li>
                      <li>
                        <span className="text-neutral-500">Role type :</span>{' '}
                        {ROLE_TYPE_LABELS[roleType] || roleType}
                      </li>
                      <li>
                        <span className="text-neutral-500">Work type :</span>{' '}
                        {getWorkTypeLabel(opp)}
                      </li>
                      <li>
                        <span className="text-neutral-500">Location :</span> {location}
                      </li>
                    </ul>

                    <div className="mt-3 flex flex-wrap items-center gap-2 relative z-[2]">
                      <Link
                        href={`/opportunities/${opp.id}`}
                        className="inline-flex items-center justify-center h-8 px-3 rounded-md border border-neutral-300 bg-white text-neutral-900 text-[11px] font-semibold hover:bg-neutral-50"
                      >
                        View Details
                      </Link>
                      {applyState.href ? (
                        <a
                          href={applyState.href}
                          className="inline-flex items-center justify-center h-8 px-3 rounded-md bg-black !text-white text-[11px] font-semibold uppercase tracking-wide hover:bg-neutral-800"
                        >
                          {applyState.label}
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => !applyState.disabled && handleApplyClick(opp)}
                          disabled={applyState.disabled}
                          title={applyState.title}
                          className={`inline-flex items-center justify-center h-8 px-3 rounded-md text-[11px] font-semibold uppercase tracking-wide ${
                            applyState.disabled
                              ? 'bg-neutral-200 text-neutral-500 cursor-default'
                              : 'bg-black !text-white hover:bg-neutral-800'
                          }`}
                        >
                          {applyState.label}
                        </button>
                      )}
                    </div>
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
                className="h-8 px-5 bg-black text-white rounded-md font-semibold text-[11px] hover:bg-neutral-800"
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
