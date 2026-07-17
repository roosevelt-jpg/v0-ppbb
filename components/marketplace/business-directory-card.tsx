'use client'

import React from 'react'
import Link from 'next/link'
import { Briefcase, BadgeCheck, MapPin, Percent, Phone, ShoppingBag, Store } from 'lucide-react'
import type { DirectoryBusinessCardData } from '@/lib/marketplace-directory'
import { BusinessFeatureLink } from '@/components/business-feature-gate'
import { useAuth } from '@/lib/auth-context'

interface BusinessDirectoryCardProps {
  business: DirectoryBusinessCardData
}

export function BusinessDirectoryCard({ business }: BusinessDirectoryCardProps) {
  const { user } = useAuth()
  const initial = (business.name.trim().charAt(0) || 'B').toUpperCase()
  const isLoggedInMember = Boolean(user)
  const phone = (business.phone || '').trim()
  const canCall = isLoggedInMember && phone.length > 0

  return (
    <article className="flex flex-col h-full min-w-0 border border-[#e4e1da] rounded-lg p-5 sm:p-6 bg-white">
      <div className="flex items-start gap-4 mb-4">
        <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden bg-neutral-100 border border-[#e4e1da] shrink-0">
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
          <h3 className="font-headline text-xl font-bold text-foreground leading-snug break-words inline-flex items-center gap-1.5 flex-wrap">
            {business.name}
            {business.isSponsor ? (
              <span
                title="Verified sponsor"
                className="inline-flex items-center text-[#1D9BF0]"
                aria-label="Verified sponsor"
              >
                <BadgeCheck className="w-5 h-5 fill-[#1D9BF0] text-white" />
              </span>
            ) : null}
          </h3>
          {business.ownerName && (
            <p className="font-body text-sm text-muted-foreground mt-0.5 break-words">
              {business.ownerName}
            </p>
          )}
          {business.location ? (
            <p className="font-body text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="break-words">{business.location}</span>
            </p>
          ) : null}
        </div>
      </div>

      {business.description && (
        <p className="font-body text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4 break-words">
          {business.description}
        </p>
      )}

      {business.services.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {business.services.slice(0, 4).map((service) => (
            <span
              key={service}
              className="inline-flex items-center px-2 py-1 rounded bg-neutral-100 text-neutral-700 font-body text-xs"
            >
              {service}
            </span>
          ))}
          {business.services.length > 4 && (
            <span className="inline-flex items-center px-2 py-1 rounded bg-neutral-100 text-neutral-500 font-body text-xs">
              +{business.services.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto space-y-3">
        <div className="flex flex-wrap gap-3 text-xs font-body text-muted-foreground">
          {business.activeJobsCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              {business.activeJobsCount} open{' '}
              {business.activeJobsCount === 1 ? 'job' : 'jobs'}
            </span>
          )}
          {business.activeOffersCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              {business.activeOffersCount}{' '}
              {business.activeOffersCount === 1 ? 'offer' : 'offers'}
            </span>
          )}
          {business.hasMemberDiscount && (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <Percent className="w-3.5 h-3.5" />
              PB member discount
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {canCall ? (
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="inline-flex w-full items-center justify-center min-h-[44px] px-4 py-2.5 border border-black text-black rounded-lg font-body text-sm font-semibold hover:bg-neutral-50 transition-colors gap-1.5"
            >
              <Phone className="w-4 h-4" />
              Call / Book
            </a>
          ) : (
            <Link
              href={isLoggedInMember ? `/directory/${business.id}` : `/login?redirect=/directory/${business.id}`}
              className="inline-flex w-full items-center justify-center min-h-[44px] px-4 py-2.5 border border-black text-black rounded-lg font-body text-sm font-semibold hover:bg-neutral-50 transition-colors"
            >
              {isLoggedInMember ? 'Message' : 'Sign in to Call / Book'}
            </Link>
          )}
          <Link
            href={`/directory/${business.id}`}
            className="inline-flex w-full items-center justify-center min-h-[44px] px-4 py-2.5 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Learn More
          </Link>
        </div>
      </div>
    </article>
  )
}

export function BusinessDirectoryCardSkeleton() {
  return (
    <div className="border border-[#e4e1da] rounded-lg p-5 sm:p-6 animate-pulse space-y-4">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-neutral-200 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 w-2/3 bg-neutral-200 rounded" />
          <div className="h-3 w-1/3 bg-neutral-200 rounded" />
        </div>
      </div>
      <div className="h-10 w-full bg-neutral-200 rounded" />
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-neutral-200 rounded" />
        <div className="h-6 w-20 bg-neutral-200 rounded" />
      </div>
      <div className="h-11 w-full bg-neutral-200 rounded-lg" />
    </div>
  )
}

export function BusinessDirectoryEmptyState() {
  return (
    <div className="text-center py-12 sm:py-16 px-4 border border-dashed border-[#e4e1da] rounded-lg">
      <Store className="w-10 h-10 mx-auto text-neutral-400 mb-4" />
      <h3 className="font-headline text-2xl font-bold text-foreground mb-2">
        No businesses yet
      </h3>
      <p className="font-body text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-6">
        Approved community businesses will appear here. List your business to join the
        directory.
      </p>
      <BusinessFeatureLink
        featureLabel="List your business"
        href="/join?type=business"
        className="inline-flex items-center justify-center min-h-[44px] px-5 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800 transition-colors"
      >
        List your business
      </BusinessFeatureLink>
    </div>
  )
}
