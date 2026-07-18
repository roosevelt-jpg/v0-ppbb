'use client'

import React from 'react'
import Link from 'next/link'

type Props = {
  imageURL?: string
  href?: string
  alt?: string
  headline?: string
  subline?: string
  ctaLabel?: string
  body?: string
}

/**
 * Vertical volunteer advertising banner beside the events calendar.
 * Brand: black / white (reference layout, PB palette).
 */
export function EventsVolunteerBanner({
  imageURL,
  href = '/forms/volunteer-unpaid-service',
  alt = 'Become a volunteer',
  headline = 'VOLUNTEER',
  subline = 'BECOME A',
  body = 'Join charity days, community events, and give your time where it matters.',
  ctaLabel = 'Welcome as Volunteer',
}: Props) {
  const inner = (
    <div className="relative min-h-[28rem] sm:min-h-[32rem] w-full overflow-hidden rounded-lg border border-[#e4e1da] bg-[#111111] text-white">
      {imageURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageURL}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
      ) : (
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse at 30% 20%, #3a3a3a 0%, transparent 55%), linear-gradient(160deg, #1a1a1a 0%, #0a0a0a 100%)',
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />
      <div className="relative z-10 flex h-full min-h-[28rem] sm:min-h-[32rem] flex-col justify-between p-5 sm:p-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
            {subline}
          </p>
          <h3 className="mt-1 font-headline text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {headline}
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-white/85 max-w-[18rem]">{body}</p>
        <span className="inline-flex w-fit items-center justify-center px-4 py-2.5 bg-white text-black text-xs font-semibold uppercase tracking-wide rounded-sm">
          {ctaLabel}
        </span>
      </div>
    </div>
  )

  const isExternal = href.startsWith('http')
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:opacity-95">
        {inner}
      </a>
    )
  }

  return (
    <Link href={href || '/forms/volunteer-unpaid-service'} className="block hover:opacity-95">
      {inner}
    </Link>
  )
}
