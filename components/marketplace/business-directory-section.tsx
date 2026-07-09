'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  buildDirectoryCards,
  MARKETPLACE_DIRECTORY_TABS,
  subscribeToAllJobs,
  subscribeToAllOffers,
  subscribeToApprovedBusinesses,
  type DirectoryBusiness,
  type DirectoryJob,
  type DirectoryOffer,
  type MarketplaceDirectoryFilter,
} from '@/lib/marketplace-directory'
import {
  BusinessDirectoryCard,
  BusinessDirectoryCardSkeleton,
  BusinessDirectoryEmptyState,
} from '@/components/marketplace/business-directory-card'

export function BusinessDirectorySection() {
  const [businesses, setBusinesses] = useState<DirectoryBusiness[]>([])
  const [offers, setOffers] = useState<DirectoryOffer[]>([])
  const [jobs, setJobs] = useState<DirectoryJob[]>([])
  const [businessesReady, setBusinessesReady] = useState(false)
  const [offersReady, setOffersReady] = useState(false)
  const [jobsReady, setJobsReady] = useState(false)
  const [filter, setFilter] = useState<MarketplaceDirectoryFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')

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

  const cards = useMemo(
    () => buildDirectoryCards(businesses, offers, jobs, filter, searchTerm),
    [businesses, offers, jobs, filter, searchTerm]
  )

  return (
    <section id="directory" className="min-w-0 space-y-6 sm:space-y-8">
      <div>
        <p className="eyebrow text-muted-foreground mb-2">DIRECTORY</p>
        <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
          Business directory
        </h2>
        <p className="font-body text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl">
          Discover member-owned businesses across the community.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search businesses…"
          className="w-full min-h-[44px] pl-12 pr-4 py-3 border border-[#e4e1da] rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
        />
      </div>

      <div className="w-full overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
          {MARKETPLACE_DIRECTORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`min-h-[44px] px-4 py-2 rounded-lg font-body text-xs sm:text-sm font-semibold tracking-wide transition-colors whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-black text-white'
                  : 'bg-white text-foreground border border-[#e4e1da] hover:bg-neutral-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <BusinessDirectoryCardSkeleton key={i} />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <BusinessDirectoryEmptyState />
      ) : cards.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[#e4e1da] rounded-lg">
          <p className="font-body text-muted-foreground mb-4">
            No businesses match this filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter('all')
              setSearchTerm('')
            }}
            className="inline-flex items-center justify-center min-h-[44px] px-5 py-3 bg-white text-black border border-[#e4e1da] rounded-lg font-body text-sm font-semibold hover:bg-neutral-50 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {cards.map((business) => (
            <BusinessDirectoryCard key={business.id} business={business} />
          ))}
        </div>
      )}
    </section>
  )
}
