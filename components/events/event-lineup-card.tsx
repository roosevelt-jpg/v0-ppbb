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
import { getEventPriceCornerLabel, hostFromEventDoc } from '@/lib/event-host'

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
  const host = hostFromEventDoc(event as unknown as Record<string, unknown>)
  const businessName = host?.businessName || ''
  const ownerName = host?.ownerName || ''
  const logoUrl = host?.businessLogoUrl || ''

  return (
    <article className="bg-white rounded-lg border border-[#e4e1da] overflow-hidden min-w-0 flex flex-col h-full max-w-sm mx-auto w-full md:max-w-none">
      <div className="relative w-full aspect-[16/9] bg-neutral-100 overflow-hidden">
        {event.bannerURL ? (
          <img
            src={event.bannerURL}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <span
            className="px-1.5 py-0.5 rounded text-[0.6rem] font-semibold text-white"
            style={{ backgroundColor: categoryColor }}
          >
            {categoryName}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[0.6rem] font-semibold bg-black/75 text-white">
            {genderLabel}
          </span>
        </div>
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[0.6rem] font-semibold bg-black text-white">
          {priceCorner}
        </div>
      </div>

      <div className="p-3 sm:p-3.5 flex flex-col flex-1 min-w-0">
        {(logoUrl || businessName || ownerName) && (
          <div className="flex items-center gap-2 mb-2 min-w-0">
            {logoUrl && businessName !== 'Admin' ? (
              <img
                src={logoUrl}
                alt={businessName || 'Host'}
                className="h-7 w-7 rounded-full object-cover border border-neutral-200 shrink-0 bg-white"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-neutral-900 text-white text-[0.65rem] font-bold flex items-center justify-center shrink-0">
                {(businessName || ownerName || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {businessName === 'Admin' ? 'Admin' : businessName || 'Host'}
              </p>
              {businessName !== 'Admin' && ownerName && ownerName !== businessName ? (
                <p className="text-[0.65rem] text-muted-foreground truncate">{ownerName}</p>
              ) : null}
            </div>
          </div>
        )}

        <h3 className="font-headline text-base sm:text-lg font-bold text-foreground break-words mb-0.5 leading-snug">
          {event.title}
        </h3>
        <p
          className="font-body text-xs font-medium mb-2 break-words"
          style={{ color: categoryColor }}
        >
          {categoryName}
        </p>

        <div className="space-y-1.5 mb-2 text-xs text-muted-foreground">
          <div className="flex items-start gap-1.5 min-w-0">
            <Calendar className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="break-words">{format(startDate, 'EEE, MMM d, yyyy')}</span>
          </div>
          <div className="flex items-start gap-1.5 min-w-0">
            <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="break-words">{getEventTimeRangeLabel(event)}</span>
          </div>
          <div className="flex items-start gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="break-words">{event.locationName}</span>
          </div>
        </div>

        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {event.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded-full bg-[#f7f6f2] text-[0.6rem] font-medium text-foreground capitalize"
              >
                {tag.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex gap-1.5">
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center justify-center min-h-[36px] flex-1 px-3 py-1.5 bg-black text-white rounded-md font-body text-xs font-semibold hover:bg-neutral-800 transition-colors text-center"
          >
            {pageConfig.registerButtonLabel}
          </Link>
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center justify-center min-h-[36px] flex-1 px-3 py-1.5 border border-[#e4e1da] rounded-md font-body text-xs font-semibold hover:bg-neutral-50 transition-colors text-center"
          >
            {pageConfig.detailsButtonLabel}
          </Link>
        </div>
      </div>
    </article>
  )
}
