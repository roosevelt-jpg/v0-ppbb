'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  subscribeToHomepage,
  DEFAULT_HOMEPAGE,
  HomepageConfig,
} from '@/lib/homepage-config'

function PillarsSkeleton() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 bg-[#f7f6f2] dark:bg-neutral-950 animate-pulse overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto w-full min-w-0">
        <div className="h-3 w-32 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto mb-2" />
        <div className="h-10 w-64 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-lg border border-[#e4e1da] dark:border-neutral-800 overflow-hidden">
              <div className="aspect-[16/10] bg-neutral-200 dark:bg-neutral-800" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-8 bg-neutral-200 dark:bg-neutral-800 rounded" />
                <div className="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded" />
                <div className="h-12 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function HomePillars() {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsub = subscribeToHomepage((data) => {
      setConfig(data)
      setReady(true)
    })
    return unsub
  }, [])

  if (!ready) return <PillarsSkeleton />

  const { pillars } = config

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 bg-[#f7f6f2] dark:bg-neutral-950 overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto w-full min-w-0">
        <p className="eyebrow text-muted-foreground text-center mb-2 break-words">{pillars.eyebrow}</p>
        <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-5 sm:mb-6 md:mb-7 break-words">
          {pillars.headline}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {pillars.items.map((pillar, idx) => (
            <article
              key={`${pillar.number}-${idx}`}
              className="bg-white dark:bg-neutral-900 rounded-lg border border-[#e4e1da] dark:border-neutral-800 overflow-hidden hover:shadow-md transition-shadow flex flex-col min-w-0"
            >
              {pillar.imageURL ? (
                <img
                  src={pillar.imageURL}
                  alt=""
                  className="w-full aspect-[16/10] object-cover"
                />
              ) : (
                <div className="w-full aspect-[16/10] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border-b border-[#e4e1da] dark:border-neutral-800">
                  <span className="text-xs text-muted-foreground px-4 text-center">Pillar image</span>
                </div>
              )}
              <div className="p-3 sm:p-4 flex flex-col flex-1 min-w-0">
                <span className="eyebrow text-muted-foreground text-[0.65rem] mb-1">{pillar.number}</span>
                <h3 className="font-headline text-lg sm:text-xl font-bold mb-1.5 break-words">{pillar.title}</h3>
                <p className="font-body text-xs sm:text-sm text-muted-foreground leading-snug mb-3 flex-1 break-words">
                  {pillar.description}
                </p>
                <Link
                  href={pillar.ctaHref}
                  className="inline-flex items-center justify-center min-h-[44px] font-body text-sm font-semibold text-foreground hover:underline underline-offset-4"
                >
                  {pillar.ctaLabel}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
