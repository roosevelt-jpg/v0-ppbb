'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { LayoutGrid, List, Search } from 'lucide-react'
import {
  buildDirectoryCards,
  buildDirectoryFacetCounts,
  subscribeToAllJobs,
  subscribeToAllOffers,
  subscribeToApprovedBusinesses,
  type DirectoryBusiness,
  type DirectoryJob,
  type DirectoryOffer,
  type DirectorySort,
  type MarketplaceDirectoryFilter,
} from '@/lib/marketplace-directory'
import {
  BusinessDirectoryCard,
  BusinessDirectoryCardSkeleton,
  BusinessDirectoryEmptyState,
} from '@/components/marketplace/business-directory-card'

const BOOKMARK_KEY = 'pb-directory-bookmarks'

function FilterRadioGroup({
  title,
  options,
  value,
  onChange,
  maxVisible = 8,
}: {
  title: string
  options: { id: string; label: string; count: number }[]
  value: string
  onChange: (id: string) => void
  maxVisible?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? options : options.slice(0, maxVisible)

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4">
      <h3 className="text-sm font-bold text-neutral-900 mb-3">{title}</h3>
      <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {visible.map((opt) => (
          <li key={opt.id}>
            <label className="flex items-center justify-between gap-2 text-sm text-neutral-700 cursor-pointer">
              <span className="inline-flex items-center gap-2 min-w-0">
                <input
                  type="radio"
                  name={title}
                  checked={value === opt.id}
                  onChange={() => onChange(opt.id)}
                  className="accent-neutral-900 shrink-0"
                />
                <span className="truncate">{opt.label}</span>
              </span>
              <span className="text-xs text-neutral-400 shrink-0">({opt.count})</span>
            </label>
          </li>
        ))}
      </ul>
      {options.length > maxVisible ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-semibold text-neutral-900 underline underline-offset-2"
        >
          {expanded ? 'Show less' : 'View more'}
        </button>
      ) : null}
    </div>
  )
}

export function BusinessDirectorySection({
  showPageHeading = true,
}: {
  showPageHeading?: boolean
}) {
  const [businesses, setBusinesses] = useState<DirectoryBusiness[]>([])
  const [offers, setOffers] = useState<DirectoryOffer[]>([])
  const [jobs, setJobs] = useState<DirectoryJob[]>([])
  const [businessesReady, setBusinessesReady] = useState(false)
  const [offersReady, setOffersReady] = useState(false)
  const [jobsReady, setJobsReady] = useState(false)
  const [filter, setFilter] = useState<MarketplaceDirectoryFilter>('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [companyTypeFilter, setCompanyTypeFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState<DirectorySort>('default')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [bookmarks, setBookmarks] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BOOKMARK_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as unknown
        if (Array.isArray(parsed)) setBookmarks(parsed.map(String))
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(
    () =>
      subscribeToApprovedBusinesses((data) => {
        setBusinesses(data)
        setBusinessesReady(true)
      }),
    []
  )

  useEffect(
    () =>
      subscribeToAllOffers((data) => {
        setOffers(data)
        setOffersReady(true)
      }),
    []
  )

  useEffect(
    () =>
      subscribeToAllJobs((data) => {
        setJobs(data)
        setJobsReady(true)
      }),
    []
  )

  const loading = !businessesReady || !offersReady || !jobsReady

  const facets = useMemo(() => buildDirectoryFacetCounts(businesses), [businesses])

  const cards = useMemo(
    () =>
      buildDirectoryCards(businesses, offers, jobs, {
        filter,
        searchTerm,
        location: locationFilter,
        companyType: companyTypeFilter,
        sort,
      }),
    [businesses, offers, jobs, filter, searchTerm, locationFilter, companyTypeFilter, sort]
  )

  const toggleBookmark = (businessId: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(businessId)
        ? prev.filter((id) => id !== businessId)
        : [...prev, businessId]
      try {
        localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const clearFilters = () => {
    setFilter('all')
    setLocationFilter('all')
    setCompanyTypeFilter('all')
    setSearchTerm('')
    setSort('default')
  }

  const categoryOptions = facets.categories.map((c) => ({
    id: c.id,
    label: c.label,
    count: c.count,
  }))

  const locationOptions = [
    { id: 'all', label: 'All Locations', count: businesses.length },
    ...facets.locations,
  ]

  const typeOptions = [
    { id: 'all', label: 'All Types', count: businesses.length },
    ...facets.companyTypes,
  ]

  return (
    <section id="directory" className="min-w-0 space-y-6">
      {showPageHeading ? (
        <div>
          <p className="eyebrow text-muted-foreground mb-2">DIRECTORY</p>
          <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Business directory
          </h2>
          <p className="font-body text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl">
            Browse community businesses. Filter by category, location, and company type.
          </p>
        </div>
      ) : null}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search businesses, location, services…"
          className="w-full min-h-[44px] pl-12 pr-4 py-3 border border-neutral-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/15 bg-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 lg:gap-6">
        <aside className="space-y-4 lg:sticky lg:top-4 h-fit">
          <FilterRadioGroup
            title="Company Category"
            options={categoryOptions}
            value={filter}
            onChange={(id) => setFilter(id as MarketplaceDirectoryFilter)}
          />
          <FilterRadioGroup
            title="Country / Location"
            options={locationOptions}
            value={locationFilter}
            onChange={setLocationFilter}
          />
          <FilterRadioGroup
            title="Type of Company"
            options={typeOptions}
            value={companyTypeFilter}
            onChange={setCompanyTypeFilter}
            maxVisible={10}
          />
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-neutral-200 rounded-lg px-4 py-3">
            <p className="text-sm text-neutral-600">
              Showing results{' '}
              <span className="font-semibold text-neutral-900">{cards.length}</span> in{' '}
              <span className="font-semibold text-neutral-900">{businesses.length}</span> businesses
              list
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as DirectorySort)}
                className="h-9 rounded-md border border-neutral-300 bg-white px-2 text-sm"
              >
                <option value="default">Sort By (Default)</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="jobs-desc">Most vacancies</option>
              </select>
              <div className="inline-flex rounded-md border border-neutral-300 overflow-hidden">
                <button
                  type="button"
                  aria-label="Grid view"
                  onClick={() => setView('grid')}
                  className={`inline-flex h-9 w-9 items-center justify-center ${
                    view === 'grid' ? 'bg-[#111] text-white' : 'bg-white text-neutral-600'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="List view"
                  onClick={() => setView('list')}
                  className={`inline-flex h-9 w-9 items-center justify-center border-l border-neutral-300 ${
                    view === 'list' ? 'bg-[#111] text-white' : 'bg-white text-neutral-600'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div
              className={
                view === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
                  : 'space-y-3'
              }
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <BusinessDirectoryCardSkeleton key={i} view={view} />
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <BusinessDirectoryEmptyState />
          ) : cards.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-200 rounded-lg bg-white">
              <p className="font-body text-neutral-500 mb-4">No businesses match this filter.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center min-h-[44px] px-5 py-3 bg-[#111] text-white rounded-lg font-body text-sm font-semibold hover:bg-neutral-800 transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div
              className={
                view === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
                  : 'space-y-3'
              }
            >
              {cards.map((business) => (
                <BusinessDirectoryCard
                  key={business.id}
                  business={business}
                  view={view}
                  bookmarked={bookmarks.includes(business.id)}
                  onToggleBookmark={toggleBookmark}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
