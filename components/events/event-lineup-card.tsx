'use client'

import React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, Clock, MapPin } from 'lucide-react'
import type { EventsPageConfig, EventsCategory } from '@/lib/events-config'
import { getCategoryColor, getCategoryName } from '@/lib/events-config'
import type { NormalizedEvent } from '@/lib/event-utils'
import {
  getEventStartDate,
  getEventTimeRangeLabel,
  getGenderBadgeLabel,
} from '@/lib/event-utils'
import { getEventPriceCornerLabel } from '@/lib/event-host'

interface EventLineupCardProps {
  event: NormalizedEvent
  pageConfig: EventsPageConfig
  categories: EventsCategory[]
}

export function EventLineupCard({ event, pageConfig, categories }: EventLineupCardProps) {
  const startDate = getEventStartDate(event)
  const categoryColor = getCategoryColor(categories, event.category)
  const categoryName = getCategoryName(categories, event.category)
  const genderLabel = getGenderBadgeLabel(event.genderRestriction)
  const priceCorner = getEventPriceCornerLabel(event as unknown as Record<string, unknown>)
  const businessName = typeof (event as { businessName?: string }).businessName === 'string'
    ? (event as { businessName?: string }).businessName
    : ''
  const ownerName = typeof (event as { ownerName?: string }).ownerName === 'string'
    ? (event as { ownerName?: string }).ownerName
    : ''
  const logoUrl =
    typeof (event as { businessLogoUrl?: string }).businessLogoUrl === 'string'
      ? (event as { businessLogoUrl?: string }).businessLogoUrl
      : ''

  return (
    <article className="bg-white rounded-xl border border-[#e4e1da] overflow-hidden min-w-0 flex flex-col h-full">
      <div className="relative w-full aspect-[16/10] bg-neutral-100 overflow-hidden">
        {event.bannerURL ? (
          <img
            src={event.bannerURL}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span
            className="px-2 py-1 rounded text-[0.65rem] sm:text-xs font-semibold text-white"
            style={{ backgroundColor: categoryColor }}
          >
            {categoryName}
          </span>
          <span className="px-2 py-1 rounded text-[0.65rem] sm:text-xs font-semibold bg-black/75 text-white">
            {genderLabel}
          </span>
        </div>
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded text-[0.65rem] sm:text-xs font-semibold bg-black text-white">
          {priceCorner}
        </div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1 min-w-0">
        {(logoUrl || businessName || ownerName) && (
          <div className="flex items-center gap-2.5 mb-3 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName || 'Host'}
                className="h-9 w-9 rounded-full object-cover border border-neutral-200 shrink-0 bg-white"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {(businessName || ownerName || 'E').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              {businessName ? (
                <p className="text-sm font-semibold text-foreground truncate">{businessName}</p>
              ) : null}
              {ownerName && ownerName !== businessName ? (
                <p className="text-xs text-muted-foreground truncate">{ownerName}</p>
              ) : null}
            </div>
          </div>
        )}

        <h3 className="font-headline text-lg sm:text-xl font-bold text-foreground break-words mb-1">
          {event.title}
        </h3>
        <p className="font-body text-sm font-medium mb-3 break-words" style={{ color: categoryColor }}>
          {categoryName}
        </p>

        <div className="space-y-2 mb-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2 min-w-0">
            <Calendar className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="break-words">{format(startDate, 'EEE, MMM d, yyyy')}</span>
          </div>
          <div className="flex items-start gap-2 min-w-0">
            <Clock className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="break-words">{getEventTimeRangeLabel(event)}</span>
          </div>
          <div className="flex items-start gap-2 min-w-0">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="break-words">{event.locationName}</span>
          </div>
        </div>

        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {event.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 rounded-full bg-[#f7f6f2] text-[0.65rem] sm:text-xs font-medium text-foreground capitalize"
              >
                {tag.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-col sm:flex-row gap-2">
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center justify-center min-h-[44px] flex-1 px-4 py-2 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-neutral-800 transition-colors text-center"
          >
            {pageConfig.registerButtonLabel}
          </Link>
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center justify-center min-h-[44px] flex-1 px-4 py-2 border border-[#e4e1da] rounded-lg font-body text-sm font-semibold hover:bg-neutral-50 transition-colors text-center"
          >
            {pageConfig.detailsButtonLabel}
          </Link>
        </div>
      </div>
    </article>
  )
}
