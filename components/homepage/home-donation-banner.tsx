'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  subscribeToHomepage,
  DEFAULT_HOMEPAGE,
  HomepageConfig,
  HomepageBannerButton,
} from '@/lib/homepage-config'

function BannerButton({ button, textColor }: { button: HomepageBannerButton; textColor: string }) {
  const base =
    'inline-flex items-center justify-center font-body text-sm font-semibold transition-colors min-h-[44px] px-5 py-3 rounded-lg'

  if (button.style === 'primary') {
    return (
      <Link href={button.href} className={`${base} bg-black text-white hover:bg-gray-800`}>
        {button.label}
      </Link>
    )
  }

  if (button.style === 'secondary') {
    return (
      <Link
        href={button.href}
        className={`${base} bg-white text-black border border-gray-300 hover:bg-gray-50`}
      >
        {button.label}
      </Link>
    )
  }

  return (
    <Link
      href={button.href}
      className={`${base} underline underline-offset-4 hover:opacity-80`}
      style={{ color: textColor }}
    >
      {button.label}
    </Link>
  )
}

function BannerSkeleton() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 animate-pulse overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto bg-neutral-800 rounded-2xl h-64" />
    </section>
  )
}

export function HomeDonationBanner() {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsub = subscribeToHomepage((data) => {
      setConfig(data)
      setReady(true)
    })
    return unsub
  }, [])

  if (!ready) return <BannerSkeleton />

  const { donationBanner } = config

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 overflow-x-hidden">
      <div
        className="max-w-[72rem] mx-auto w-full min-w-0 rounded-2xl px-5 sm:px-8 py-8 sm:py-10 text-center"
        style={{
          backgroundColor: donationBanner.backgroundColor,
          color: donationBanner.textColor,
        }}
      >
        <p className="eyebrow mb-2 opacity-80 break-words">{donationBanner.eyebrow}</p>
        <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold mb-3 break-words">
          {donationBanner.headline}
        </h2>
        <p className="font-body text-sm sm:text-base max-w-[42rem] mx-auto mb-5 opacity-90 leading-snug break-words">
          {donationBanner.body}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {donationBanner.buttons.map((button, i) => (
            <BannerButton key={`${button.href}-${i}`} button={button} textColor={donationBanner.textColor} />
          ))}
        </div>
      </div>
    </section>
  )
}
