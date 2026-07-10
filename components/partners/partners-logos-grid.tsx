'use client'

import React, { useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import { subscribeToActivePartners, type Partner } from '@/lib/partners'

export function PartnersLogosGrid({
  eyebrow,
  headline,
  description,
}: {
  eyebrow: string
  headline: string
  description: string
}) {
  const [partners, setPartners] = useState<Partner[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => subscribeToActivePartners((data) => {
    setPartners(data)
    setReady(true)
  }), [])

  return (
    <section className="min-w-0 border-t border-[#e4e1da] pt-10 sm:pt-12">
      <p className="eyebrow text-muted-foreground mb-2 break-words">{eyebrow}</p>
      <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground mb-2 break-words">
        {headline}
      </h2>
      <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[42rem] break-words mb-6 sm:mb-8">
        {description}
      </p>

      {!ready ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 sm:h-32 rounded-lg bg-neutral-200" />
          ))}
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-10 sm:py-12 px-4 border border-dashed border-[#e4e1da] rounded-lg">
          <Building2 className="w-10 h-10 mx-auto text-neutral-400 mb-3" />
          <p className="font-headline text-lg font-bold text-foreground mb-1">No partners listed yet</p>
          <p className="font-body text-sm text-muted-foreground max-w-sm mx-auto">
            When partners are added in Admin → Partners &amp; Logos, they appear here in real time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {partners.map((partner) => {
            const content = (
              <>
                <div className="relative w-full h-14 sm:h-16 flex items-center justify-center mb-3">
                  {partner.logoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={partner.logoURL}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="font-headline text-2xl font-bold text-neutral-400">
                      {(partner.name.trim().charAt(0) || 'P').toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="font-body text-xs sm:text-sm font-semibold text-foreground text-center break-words leading-snug">
                  {partner.name}
                </p>
              </>
            )

            const className =
              'flex flex-col items-center justify-center min-h-[7.5rem] sm:min-h-[8.5rem] rounded-lg border border-[#e4e1da] bg-white p-4 hover:border-neutral-400 transition-colors'

            if (partner.websiteURL) {
              return (
                <a
                  key={partner.id}
                  href={partner.websiteURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {content}
                </a>
              )
            }

            return (
              <div key={partner.id} className={className}>
                {content}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
