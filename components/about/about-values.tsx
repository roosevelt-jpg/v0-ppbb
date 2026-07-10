'use client'

import React, { useEffect, useState } from 'react'
import { subscribeToAbout, DEFAULT_ABOUT, AboutConfig } from '@/lib/about-config'

export function AboutValues() {
  const [config, setConfig] = useState<AboutConfig>(DEFAULT_ABOUT)
  const [ready, setReady] = useState(false)

  useEffect(() => subscribeToAbout((data) => {
    setConfig(data)
    setReady(true)
  }), [])

  if (!ready) {
    return (
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 bg-[#f7f6f2] animate-pulse overflow-x-hidden">
        <div className="max-w-[72rem] mx-auto space-y-6">
          <div className="h-8 w-64 bg-neutral-200 rounded mx-auto" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-neutral-200 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  const { values } = config

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 bg-[#f7f6f2] overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto w-full min-w-0">
        <p className="eyebrow text-muted-foreground text-center mb-2 break-words">{values.eyebrow}</p>
        <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 break-words">
          {values.headline}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-10 sm:mb-12">
          {values.differentiators.map((item, i) => (
            <div
              key={`${item.number}-${i}`}
              className="bg-white p-4 sm:p-5 rounded-lg border border-[#e4e1da] min-w-0"
            >
              <span className="eyebrow text-muted-foreground text-[0.65rem] mb-2 block">
                {item.number}
              </span>
              <h3 className="font-headline text-lg font-bold mb-1.5 break-words">{item.title}</h3>
              <p className="font-body text-xs sm:text-sm text-muted-foreground leading-snug break-words">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <h3 className="font-headline text-2xl sm:text-3xl font-bold text-center mb-5 sm:mb-6 break-words">
          {values.valuesHeading}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {values.values.map((item, i) => (
            <div
              key={`${item.title}-${i}`}
              className="bg-white p-4 sm:p-5 rounded-lg border border-[#e4e1da] min-w-0"
            >
              <h4 className="font-bold text-base sm:text-lg mb-1.5 break-words">{item.title}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
