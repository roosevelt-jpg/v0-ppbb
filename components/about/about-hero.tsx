'use client'

import React, { useEffect, useState } from 'react'
import { subscribeToAbout, DEFAULT_ABOUT, AboutConfig } from '@/lib/about-config'

export function AboutHero() {
  const [config, setConfig] = useState<AboutConfig>(DEFAULT_ABOUT)
  const [ready, setReady] = useState(false)

  useEffect(() => subscribeToAbout((data) => {
    setConfig(data)
    setReady(true)
  }), [])

  if (!ready) {
    return (
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 bg-[#f7f6f2] animate-pulse overflow-x-hidden">
        <div className="max-w-[72rem] mx-auto space-y-4">
          <div className="h-3 w-20 bg-neutral-200 rounded" />
          <div className="h-10 w-full max-w-[40rem] bg-neutral-200 rounded" />
          <div className="h-16 w-full max-w-[36rem] bg-neutral-200 rounded" />
        </div>
      </section>
    )
  }

  const { hero } = config

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 bg-[#f7f6f2] overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto w-full min-w-0">
        <p className="eyebrow text-muted-foreground mb-2 break-words">{hero.eyebrow}</p>
        <h1 className="font-headline text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-foreground break-words max-w-[42rem]">
          {hero.headline}
        </h1>
        <p className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[42rem] break-words">
          {hero.body}
        </p>
      </div>
    </section>
  )
}
