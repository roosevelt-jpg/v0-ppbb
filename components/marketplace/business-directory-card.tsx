'use client'

import React from 'react'
import Link from 'next/link'
import {
  BadgeCheck,
  Bookmark,
  MapPin,
  Percent,
  ShoppingBag,
  Store,
} from 'lucide-react'
import type { DirectoryBusinessCardData } from '@/lib/marketplace-directory'
import { BusinessFeatureLink } from '@/components/business-feature-gate'

interface BusinessDirectoryCardProps {
  business: DirectoryBusinessCardData
  view?: 'grid' | 'list'
  bookmarked?: boolean
  onToggleBookmark?: (businessId: string) => void
}

/**
 * Public short card — name, services, location, sponsor tick.
 * No phone/email on the card; contacts stay behind membership on the detail page.
 */
export function BusinessDirectoryCard({
  business,
  view = 'grid',
  bookmarked = false,
  onToggleBookmark,
}: BusinessDirectoryCardProps) {
  const initial = (business.name.trim().charAt(0) || 'B').toUpperCase()
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
          className={`absolute top-3 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
            bookmarked
              ? 'text-neutral-900 bg-neutral-100'
              : 'text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
        </button>
      ) : null}

      <div className={`flex items-start gap-3 ${isList ? 'min-w-0 flex-1' : 'mb-3 pr-8'}`}>
        <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
          {business.logoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logoURL}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center font-headline text-lg font-bold text-neutral-500">
              {initial}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-headline text-base sm:text-lg font-bold text-neutral-900 leading-snug break-words inline-flex items-center gap-1.5 flex-wrap">
            {business.name}
            {business.isSponsor ? (
              <span
                title="PB sponsor"
                className="inline-flex items-center text-[#1D9BF0]"
                aria-label="PB sponsor"
              >
                <BadgeCheck className="w-5 h-5 fill-[#1D9BF0] text-white" />
              </span>
            ) : null}
          </h3>
          {business.ownerName ? (
            <p className="font-body text-sm text-neutral-500 mt-0.5 break-words">
              {business.ownerName}
            </p>
          ) : null}
          {business.location ? (
            <p className="font-body text-xs text-neutral-500 mt-1 inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="break-words">{business.location}</span>
            </p>
          ) : null}
        </div>
      </div>

      {!isList && business.description ? (
        <p className="font-body text-sm text-neutral-500 leading-relaxed line-clamp-2 mb-3 break-words">
          {business.description}
        </p>
      ) : null}

      {business.services.length > 0 ? (
        <div className={`flex flex-wrap gap-1.5 ${isList ? '' : 'mb-3'}`}>
          {business.services.slice(0, 4).map((service) => (
            <span
              key={service}
              className="inline-flex items-center px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-body text-[11px]"
            >
              {service}
            </span>
          ))}
          {business.services.length > 4 ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-neutral-100 text-neutral-500 font-body text-[11px]">
              +{business.services.length - 4}
            </span>
          ) : null}
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
          {business.activeOffersCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-neutral-600">
              <ShoppingBag className="w-3.5 h-3.5" />
              {business.activeOffersCount}{' '}
              {business.activeOffersCount === 1 ? 'offer' : 'offers'}
            </span>
          ) : null}
          {business.hasMemberDiscount ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <Percent className="w-3.5 h-3.5" />
              PB member discount
            </span>
          ) : null}
        </div>

        <Link
          href={`/directory/${business.id}`}
          className="inline-flex w-full items-center justify-center min-h-[44px] px-4 bg-[#111] text-white rounded-lg font-body text-sm font-semibold hover:bg-neutral-800"
        >
          Learn More / Support
        </Link>
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
        <div className="h-14 w-14 rounded-full bg-neutral-200 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 w-2/3 bg-neutral-200 rounded" />
          <div className="h-3 w-1/3 bg-neutral-200 rounded" />
        </div>
      </div>
      {view === 'grid' ? <div className="h-10 w-full bg-neutral-200 rounded" /> : null}
      <div className="h-11 w-full bg-neutral-200 rounded-lg" />
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
        href="/dashboard/membership?upgrade=business"
        className="inline-flex items-center justify-center min-h-[44px] px-5 py-3 bg-[#111] text-white rounded-lg font-body text-sm font-semibold hover:bg-neutral-800 transition-colors"
      >
        List your business
      </BusinessFeatureLink>
    </div>
  )
}
