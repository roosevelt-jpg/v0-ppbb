'use client'

import React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, MapPin } from 'lucide-react'
import type { EventsPageConfig, EventsCategory } from '@/lib/events-config'
import { getCategoryColor, getCategoryName } from '@/lib/events-config'
import type { NormalizedEvent } from '@/lib/event-utils'
import {
  getEventStartDate,
  getEventTimeRangeLabel,
  getGenderBadgeLabel,
} from '@/lib/event-utils'
import { getEventPriceCornerLabel, hostFromEventDoc } from '@/lib/event-host'
import { EventBannerThumb } from '@/components/events/event-banner-thumb'

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
  const timeLabel = getEventTimeRangeLabel(event)
  const whenLabel = `${format(startDate, 'MMM d')}${timeLabel ? ` · ${timeLabel}` : ''}`
  const location =
    !event.locationName || /^https?:\/\//i.test(event.locationName)
      ? event.locationName
        ? 'View map'
        : 'Location TBA'
      : event.locationName

  return (
    <article className="bg-white rounded-lg border border-[#e4e1da] overflow-hidden min-w-0 flex flex-col h-full w-full shadow-sm hover:shadow-md transition">
      <div className="relative w-full shrink-0">
        <EventBannerThumb
          event={event as never}
          title={event.title}
          size="md"
          rounded="rounded-none"
        />
        <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1 max-w-[70%]">
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
            style={{ backgroundColor: categoryColor }}
          >
            {categoryName}
          </span>
          {genderLabel && genderLabel !== 'Mixed' ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black/75 text-white">
              {genderLabel}
            </span>
          ) : null}
        </div>
        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black text-white">
          {priceCorner}
        </div>
      </div>

      <div className="p-2.5 flex flex-col gap-1 flex-1 min-w-0">
        {(logoUrl || businessName || ownerName) && (
          <div className="flex items-center gap-1.5 min-w-0">
            {logoUrl && businessName !== 'Admin' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={businessName || 'Host'}
                className="h-5 w-5 rounded-full object-cover border border-neutral-200 shrink-0 bg-white"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-neutral-900 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                {(businessName || ownerName || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <p className="text-[11px] font-medium text-neutral-600 truncate">
              {businessName === 'Admin' ? 'Admin' : businessName || ownerName || 'Host'}
            </p>
          </div>
        )}

        <h3 className="font-headline text-sm font-bold text-foreground leading-tight line-clamp-2">
          {event.title}
        </h3>

        <div className="space-y-0.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1 min-w-0">
            <Calendar className="w-3 h-3 shrink-0" />
            <span className="truncate">{whenLabel}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        </div>

        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded bg-[#f7f6f2] text-[10px] font-medium text-foreground capitalize"
              >
                {tag.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-1.5 sm:flex-row sm:gap-1">
          <Link
            href={`/events/${event.id}`}
            className="inline-flex min-h-[40px] sm:min-h-0 sm:h-7 items-center justify-center flex-1 px-2 bg-black !text-white rounded-md text-xs sm:text-[11px] font-semibold hover:bg-neutral-800"
          >
            {pageConfig.registerButtonLabel}
          </Link>
          <Link
            href={`/events/${event.id}`}
            className="inline-flex min-h-[40px] sm:min-h-0 sm:h-7 items-center justify-center flex-1 px-2 border border-[#e4e1da] bg-white !text-neutral-900 rounded-md text-xs sm:text-[11px] font-semibold hover:bg-neutral-50"
          >
            {pageConfig.detailsButtonLabel}
          </Link>
        </div>
      </div>
    </article>
  )
}
