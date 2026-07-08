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
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="max-w-[80rem] mx-auto w-full min-w-0 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 lg:items-stretch animate-pulse">
        <div className="order-2 lg:order-1 lg:col-span-5 space-y-4">
          <div className="h-3 w-48 bg-neutral-200 rounded" />
          <div className="h-10 w-full max-w-md bg-neutral-200 rounded" />
          <div className="h-20 w-full bg-neutral-200 rounded" />
          <div className="flex gap-3">
            <div className="h-10 w-36 bg-neutral-200 rounded" />
            <div className="h-10 w-24 bg-neutral-200 rounded" />
          </div>
        </div>
        <div className="order-1 lg:order-2 lg:col-span-7 aspect-[16/10] sm:aspect-[4/3] lg:aspect-auto lg:h-full bg-neutral-200 rounded-2xl min-h-0" />
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
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 bg-background overflow-x-hidden">
      <div className="max-w-[80rem] mx-auto w-full min-w-0 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 lg:items-stretch">
        <div className="order-2 lg:order-1 lg:col-span-5 min-w-0 flex flex-col lg:h-full">
          <p className="eyebrow text-muted-foreground mb-2 break-words">{hero.eyebrow}</p>
          <h1 className="font-headline text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-foreground break-words max-w-[36rem]">
            {hero.headline}
          </h1>
          <p className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed mb-5 w-full max-w-[36rem] break-words">
            {hero.body}
          </p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-auto">
            {hero.buttons.map((button, i) => (
              <HeroButtonLink key={`${button.href}-${i}`} button={button} />
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-7 min-w-0 w-full flex flex-col lg:h-full lg:min-h-0">
          <HeroImageCarousel images={hero.images} slider={hero.slider} />
        </div>
      </div>
    </section>
  )
}
