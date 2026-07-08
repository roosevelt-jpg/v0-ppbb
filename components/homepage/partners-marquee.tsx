'use client'

import React, { useEffect, useState } from 'react'
import { subscribeToHomepage, DEFAULT_HOMEPAGE, HomepageConfig } from '@/lib/homepage-config'
import { subscribeToActivePartners, Partner } from '@/lib/partners'

function PartnerLogo({ partner }: { partner: Partner }) {
  const inner = partner.logoURL ? (
    <img
      src={partner.logoURL}
      alt={partner.name}
      className="h-10 sm:h-12 w-auto max-w-[140px] object-contain grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100"
    />
  ) : (
    <span className="font-body text-xs sm:text-sm font-semibold text-neutral-600 whitespace-nowrap px-4 py-2 border border-neutral-200 rounded-lg bg-white">
      {partner.name}
    </span>
  )

  if (partner.websiteURL) {
    return (
      <a
        href={partner.websiteURL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 flex items-center justify-center"
      >
        {inner}
      </a>
    )
  }

  return <div className="flex-shrink-0 flex items-center justify-center">{inner}</div>
}

export function PartnersMarquee() {
  const [homepage, setHomepage] = useState<HomepageConfig>(DEFAULT_HOMEPAGE)
  const [partners, setPartners] = useState<Partner[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsubHome = subscribeToHomepage(setHomepage)
    const unsubPartners = subscribeToActivePartners((data) => {
      setPartners(data)
      setReady(true)
    })
    return () => {
      unsubHome()
      unsubPartners()
    }
  }, [])

  if (!ready) {
    return (
      <section className="w-full py-10 bg-[#f7f6f2] overflow-x-hidden">
        <div className="w-full px-4 animate-pulse flex gap-12 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-28 bg-neutral-200 rounded flex-shrink-0" />
          ))}
        </div>
      </section>
    )
  }

  if (partners.length === 0) return null

  const { speed, gap } = homepage.marquee
  const duration = `${speed}s`
  const loop = [...partners, ...partners]

  return (
    <section className="w-full py-10 sm:py-12 bg-[#f7f6f2] overflow-x-hidden" aria-label="Partners">
      <div className="w-full overflow-hidden">
        <div
          className="partners-marquee-track flex items-center"
          style={
            {
              '--marquee-duration': duration,
              gap: `${gap}px`,
            } as React.CSSProperties
          }
        >
          {loop.map((partner, i) => (
            <PartnerLogo key={`${partner.id}-${i}`} partner={partner} />
          ))}
        </div>
      </div>
    </section>
  )
}
