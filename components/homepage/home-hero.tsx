'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  subscribeToHomepage,
  DEFAULT_HOMEPAGE,
  HomepageConfig,
  HeroButton,
} from '@/lib/homepage-config'
import { HeroImageCarousel } from '@/components/homepage/hero-image-carousel'

function HeroButtonLink({ button }: { button: HeroButton }) {
  const base = 'inline-flex items-center justify-center font-body text-sm font-semibold transition-colors'
  if (button.style === 'primary') {
    return (
      <Link
        href={button.href}
        className={`${base} px-5 py-3 min-h-[44px] bg-black text-white rounded-lg hover:bg-gray-800`}
      >
        {button.label}
      </Link>
    )
  }
  if (button.style === 'secondary') {
    return (
      <Link
        href={button.href}
        className={`${base} px-5 py-3 min-h-[44px] bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-50`}
      >
        {button.label}
      </Link>
    )
  }
  return (
    <Link href={button.href} className={`${base} py-3 min-h-[44px] text-black underline underline-offset-4 hover:text-gray-700`}>
      {button.label}
    </Link>
  )
}

function HeroSkeleton() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="max-w-[80rem] mx-auto w-full min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center animate-pulse">
        <div className="space-y-4">
          <div className="h-3 w-48 bg-neutral-200 rounded" />
          <div className="h-10 w-full max-w-md bg-neutral-200 rounded" />
          <div className="h-20 w-full bg-neutral-200 rounded" />
          <div className="flex gap-3">
            <div className="h-10 w-36 bg-neutral-200 rounded" />
            <div className="h-10 w-24 bg-neutral-200 rounded" />
          </div>
        </div>
        <div className="aspect-[4/5] bg-neutral-200 rounded-2xl" />
      </div>
    </section>
  )
}

export function HomeHero() {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsub = subscribeToHomepage((data) => {
      setConfig(data)
      setReady(true)
    })
    return unsub
  }, [])

  if (!ready) return <HeroSkeleton />

  const { hero } = config

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16 bg-background overflow-x-hidden">
      <div className="max-w-[80rem] mx-auto w-full min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="order-2 lg:order-1 min-w-0">
          <p className="eyebrow text-muted-foreground mb-4 break-words">{hero.eyebrow}</p>
          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-foreground break-words">
            {hero.headline}
          </h1>
          <p className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 w-full max-w-[36rem] break-words">
            {hero.body}
          </p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {hero.buttons.map((button, i) => (
              <HeroButtonLink key={`${button.href}-${i}`} button={button} />
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2 relative min-w-0 w-full">
          <HeroImageCarousel images={hero.images} slider={hero.slider} />
        </div>
      </div>
    </section>
  )
}
