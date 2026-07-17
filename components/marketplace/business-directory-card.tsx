'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Briefcase,
  MapPin,
  Percent,
  Phone,
  Store,
} from 'lucide-react'
import type { DirectoryBusinessCardData } from '@/lib/marketplace-directory'
import { BusinessFeatureLink } from '@/components/business-feature-gate'
import { useAuth } from '@/lib/auth-context'

interface BusinessDirectoryCardProps {
  business: DirectoryBusinessCardData
  view?: 'grid' | 'list'
  bookmarked?: boolean
  onToggleBookmark?: (businessId: string) => void
}

export function BusinessDirectoryCard({
  business,
  view = 'grid',
  bookmarked = false,
  onToggleBookmark,
}: BusinessDirectoryCardProps) {
  const { user } = useAuth()
  const initial = (business.name.trim().charAt(0) || 'B').toUpperCase()
  const isLoggedInMember = Boolean(user)
  const phone = (business.phone || '').trim()
  const canCall = isLoggedInMember && phone.length > 0
  const isList = view === 'list'

  return (
    <article
      className={`relative flex h-full min-w-0 border border-neutral-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow ${
        isList ? 'flex-row items-center gap-4 p-4 sm:p-5' : 'flex-col p-5 sm:p-6'
      }`}
    >
      {onToggleBookmark ? (
        <button
          type="button"
          aria-label={bookmarked ? 'Remove bookmark' : 'Save business'}
          onClick={() => onToggleBookmark(business.id)}
          className={`absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
            bookmarked ? 'text-neutral-900 bg-neutral-100' : 'text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
        </button>
      ) : null}

      <div className={`flex items-start gap-3 ${isList ? 'min-w-0 flex-1' : 'mb-4 pr-8'}`}>
        <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
          {business.logoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logoURL}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center font-headline text-xl font-bold text-neutral-500">
              {initial}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-headline text-base sm:text-lg font-bold text-neutral-900 leading-snug break-words inline-flex items-center gap-1.5 flex-wrap">
            {business.name}
            {business.isSponsor ? (
              <span title="Verified sponsor" className="inline-flex items-center text-[#1D9BF0]" aria-label="Verified sponsor">
                <BadgeCheck className="w-4 h-4 fill-[#1D9BF0] text-white" />
              </span>
            ) : null}
          </h3>
          {business.location ? (
            <p className="font-body text-xs text-neutral-500 mt-1 inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="break-words">{business.location}</span>
            </p>
          ) : (
            <p className="font-body text-xs text-neutral-400 mt-1">Location not listed</p>
          )}
          {!isList && business.description ? (
            <p className="font-body text-sm text-neutral-500 leading-relaxed line-clamp-2 mt-2 break-words">
              {business.description}
            </p>
          ) : null}
        </div>
      </div>

      {!isList && business.services.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {business.services.slice(0, 3).map((service) => (
            <span
              key={service}
              className="inline-flex items-center px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-body text-[11px]"
            >
              {service}
            </span>
          ))}
        </div>
      ) : null}

      <div
        className={`mt-auto flex ${
          isList
            ? 'flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0'
            : 'flex-col gap-3'
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-body">
          <span className="inline-flex items-center gap-1 font-semibold text-neutral-800">
            <Briefcase className="w-3.5 h-3.5" />
            Vacancies: {business.activeJobsCount}
          </span>
          {business.activeOffersCount > 0 ? (
            <span className="text-neutral-500">{business.activeOffersCount} offers</span>
          ) : null}
          {business.hasMemberDiscount ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <Percent className="w-3.5 h-3.5" />
              Member discount
            </span>
          ) : null}
        </div>

        <div className={`flex gap-2 ${isList ? '' : 'grid grid-cols-1 sm:grid-cols-2'}`}>
          {canCall ? (
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="inline-flex items-center justify-center min-h-[40px] px-3 border border-neutral-300 text-neutral-900 rounded-md font-body text-xs font-semibold hover:bg-neutral-50 gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </a>
          ) : null}
          <Link
            href={`/directory/${business.id}`}
            className={`inline-flex items-center justify-center min-h-[40px] px-3 bg-[#111] text-white rounded-md font-body text-xs font-semibold hover:bg-neutral-800 gap-1.5 ${
              canCall ? '' : 'sm:col-span-2'
            }`}
          >
            View Details
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export function BusinessDirectoryCardSkeleton({ view = 'grid' }: { view?: 'grid' | 'list' }) {
  return (
    <div
      className={`border border-neutral-200 rounded-lg animate-pulse bg-white ${
        view === 'list' ? 'flex gap-4 p-4' : 'p-5 sm:p-6 space-y-4'
      }`}
    >
      <div className="flex items-start gap-4 flex-1">
        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-neutral-200 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 w-2/3 bg-neutral-200 rounded" />
          <div className="h-3 w-1/3 bg-neutral-200 rounded" />
        </div>
      </div>
      {view === 'grid' ? <div className="h-10 w-full bg-neutral-200 rounded" /> : null}
      <div className="h-10 w-28 bg-neutral-200 rounded-md" />
    </div>
  )
}

export function BusinessDirectoryEmptyState() {
  return (
    <div className="text-center py-12 sm:py-16 px-4 border border-dashed border-neutral-200 rounded-lg bg-white">
      <Store className="w-10 h-10 mx-auto text-neutral-400 mb-4" />
      <h3 className="font-headline text-2xl font-bold text-neutral-900 mb-2">No businesses yet</h3>
      <p className="font-body text-sm sm:text-base text-neutral-500 max-w-md mx-auto mb-6">
        Approved community businesses will appear here. List your business to join the directory.
      </p>
      <BusinessFeatureLink
        featureLabel="List your business"
        href="/join?type=business"
        className="inline-flex items-center justify-center min-h-[44px] px-5 py-3 bg-[#111] text-white rounded-lg font-body text-sm font-semibold hover:bg-neutral-800 transition-colors"
      >
        List your business
      </BusinessFeatureLink>
    </div>
  )
}
