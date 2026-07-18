'use client'

import React from 'react'
import { Calendar } from 'lucide-react'
import { getEventBannerURL } from '@/lib/event-utils'

type Size = 'sm' | 'md' | 'lg'

const SIZE_CLASS: Record<Size, string> = {
  sm: 'h-12 w-16',
  md: 'h-28 w-full',
  lg: 'h-36 w-full',
}

/**
 * Event banner thumbnail for dashboard cards (member / business / admin).
 * Always renders a visual — real banner when available, otherwise a branded placeholder.
 */
export function EventBannerThumb({
  event,
  title,
  size = 'md',
  className = '',
  rounded = 'rounded-lg',
}: {
  event: Record<string, unknown> | null | undefined
  title?: string
  size?: Size
  className?: string
  rounded?: string
}) {
  const src = event ? getEventBannerURL(event) : ''
  const alt = title || (typeof event?.title === 'string' ? event.title : 'Event')

  return (
    <div
      className={`relative overflow-hidden bg-neutral-100 shrink-0 ${SIZE_CLASS[size]} ${rounded} ${className}`.trim()}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-300"
          aria-hidden
        >
          <Calendar className="h-5 w-5 text-neutral-500" strokeWidth={1.75} />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            Event
          </span>
        </div>
      )}
    </div>
  )
}
