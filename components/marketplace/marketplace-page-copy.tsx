'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  subscribeToMarketplaceConfig,
  DEFAULT_MARKETPLACE_CONFIG,
  MarketplacePlatformConfig,
} from '@/lib/marketplace-config'

export function MarketplacePageCopy() {
  const [config, setConfig] = useState<MarketplacePlatformConfig>(DEFAULT_MARKETPLACE_CONFIG)
  const [ready, setReady] = useState(false)

  useEffect(
    () =>
      subscribeToMarketplaceConfig((data) => {
        setConfig(data)
        setReady(true)
      }),
    []
  )

  if (!ready) {
    return (
      <div className="space-y-10 sm:space-y-14 animate-pulse">
        <section className="space-y-3">
          <div className="h-3 w-48 bg-neutral-200 rounded" />
          <div className="h-10 w-full max-w-[40rem] bg-neutral-200 rounded" />
          <div className="h-16 w-full max-w-[36rem] bg-neutral-200 rounded" />
        </section>
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-48 bg-neutral-200 rounded-lg" />
          <div className="h-48 bg-neutral-200 rounded-lg" />
        </section>
      </div>
    )
  }

  const { pageConfig: pc } = config

  return (
    <div className="space-y-10 sm:space-y-14 md:space-y-16">
      {/* Hero */}
      <section className="min-w-0">
        <p className="eyebrow text-muted-foreground mb-2 break-words">{pc.eyebrow}</p>
        <h1 className="font-headline text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-foreground break-words max-w-[42rem]">
          {pc.headline}
        </h1>
        <p className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[42rem] break-words">
          {pc.body}
        </p>
      </section>

      {/* Membership */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center min-w-0">
        <div className="min-w-0 order-2 lg:order-1">
          <p className="eyebrow text-muted-foreground mb-2 break-words">{pc.membershipEyebrow}</p>
          <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-3 text-foreground break-words">
            {pc.membershipHeadline}
          </h2>
          <p className="font-body text-base text-muted-foreground leading-relaxed mb-6 break-words">
            {pc.membershipBody}
          </p>
          {pc.membershipCTA && pc.membershipCTAHref && (
            <Link
              href={pc.membershipCTAHref}
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              {pc.membershipCTA}
            </Link>
          )}
        </div>
        <div className="order-1 lg:order-2 min-w-0">
          <div className="relative w-full overflow-hidden rounded-lg aspect-[4/3] bg-neutral-100">
            {pc.membershipImageURL ? (
              <img
                src={pc.membershipImageURL}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[#f7f6f2]" aria-hidden />
            )}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="min-w-0">
        <p className="eyebrow text-muted-foreground mb-2 break-words">{pc.benefitsEyebrow}</p>
        <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-6 sm:mb-8 text-foreground break-words">
          {pc.benefitsHeadline}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {pc.benefits.map((benefit, index) => (
            <div key={`${benefit.title}-${index}`} className="min-w-0">
              <h3 className="font-headline text-xl font-bold text-foreground mb-2 break-words">
                {benefit.title}
              </h3>
              <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed break-words">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
