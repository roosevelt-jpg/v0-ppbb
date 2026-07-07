'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  subscribeToHomepage,
  DEFAULT_HOMEPAGE,
  HomepageConfig,
  HeroButton,
  splitImageCaption,
} from '@/lib/homepage-config'

function HeroButtonLink({ button }: { button: HeroButton }) {
  const base = 'inline-flex items-center justify-center font-body text-sm font-semibold transition-colors'
  if (button.style === 'primary') {
    return (
      <Link
        href={button.href}
        className={`${base} px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800`}
      >
        {button.label}
      </Link>
    )
  }
  if (button.style === 'secondary') {
    return (
      <Link
        href={button.href}
        className={`${base} px-5 py-2.5 bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-50`}
      >
        {button.label}
      </Link>
    )
  }
  return (
    <Link href={button.href} className={`${base} text-black underline underline-offset-4 hover:text-gray-700`}>
      {button.label}
    </Link>
  )
}

function HeroSkeleton() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center animate-pulse">
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
  const caption = splitImageCaption(hero.imageCaption)

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16 bg-background">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="order-2 lg:order-1">
          <p className="eyebrow text-muted-foreground mb-4">{hero.eyebrow}</p>
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 text-foreground">
            {hero.headline}
          </h1>
          <p className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
            {hero.body}
          </p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {hero.buttons.map((button, i) => (
              <HeroButtonLink key={`${button.href}-${i}`} button={button} />
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2 relative">
          {hero.imageURL ? (
            <img
              src={hero.imageURL}
              alt=""
              className="w-full aspect-[4/5] object-cover rounded-2xl"
            />
          ) : (
            <div className="w-full aspect-[4/5] bg-neutral-100 rounded-2xl flex items-center justify-center border border-neutral-200">
              <p className="text-sm text-muted-foreground font-body px-6 text-center">
                Hero image — upload from Admin → CMS → Homepage
              </p>
            </div>
          )}
          {hero.imageCaption && (
            <p className="caption-mixed mt-3 text-xs sm:text-sm text-muted-foreground">
              <span className="eyebrow text-[0.65rem] sm:text-xs">{caption.prefix}</span>
              {caption.italic && (
                <>
                  {' '}
                  <em className="font-headline text-sm sm:text-base">{caption.italic}</em>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
