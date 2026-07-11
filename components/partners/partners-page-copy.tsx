'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  subscribeToPartnersConfig,
  DEFAULT_PARTNERS_CONFIG,
  PartnersPlatformConfig,
  getInquiryCategoryHref,
} from '@/lib/partners-page-config'
import { PartnersLogosGrid } from '@/components/partners/partners-logos-grid'
import { GetInTouchForm } from '@/components/partners/get-in-touch-form'

export function PartnersPageCopy() {
  const router = useRouter()
  const [config, setConfig] = useState<PartnersPlatformConfig>(DEFAULT_PARTNERS_CONFIG)
  const [ready, setReady] = useState(false)
  const [inquiryCategoryId, setInquiryCategoryId] = useState('')

  useEffect(
    () =>
      subscribeToPartnersConfig((data) => {
        setConfig(data)
        setReady(true)
      }),
    []
  )

  const categories = config.pageConfig.inquiryCategories

  useEffect(() => {
    if (categories.length > 0 && !inquiryCategoryId) {
      setInquiryCategoryId(categories[0].id)
    }
  }, [categories, inquiryCategoryId])

  const selected = useMemo(
    () => categories.find((c) => c.id === inquiryCategoryId) || categories[0],
    [categories, inquiryCategoryId]
  )

  if (!ready) {
    return (
      <div className="space-y-12 sm:space-y-16 animate-pulse">
        <section className="space-y-3">
          <div className="h-3 w-64 bg-neutral-200 rounded" />
          <div className="h-10 w-full max-w-[36rem] bg-neutral-200 rounded" />
          <div className="h-16 w-full max-w-[40rem] bg-neutral-200 rounded" />
        </section>
        <section className="h-40 bg-neutral-200 rounded-lg" />
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-neutral-200 rounded-lg" />
          ))}
        </section>
      </div>
    )
  }

  const pc = config.pageConfig

  const openInquiry = () => {
    if (!selected) {
      alert('No inquiry category available.')
      return
    }
    const href = getInquiryCategoryHref(selected)
    if (!href) {
      alert(
        'This inquiry category is not linked to a form yet. Please ask an admin to map it under CMS → Partners.'
      )
      return
    }
    if (/^https?:\/\//i.test(href)) {
      window.open(href, '_blank', 'noopener,noreferrer')
      return
    }
    router.push(href)
  }

  return (
    <div className="space-y-12 sm:space-y-16 md:space-y-20 min-w-0">
      <section className="min-w-0">
        <p className="eyebrow text-muted-foreground mb-2 break-words">{pc.eyebrow}</p>
        <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4 text-foreground break-words max-w-[42rem]">
          {pc.headline}
        </h1>
        <p className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[42rem] break-words">
          {pc.body}
        </p>
      </section>

      <section className="min-w-0 rounded-lg border border-[#e4e1da] bg-[#f7f6f2] p-5 sm:p-8">
        <p className="eyebrow text-muted-foreground mb-2 break-words">{pc.sponsorshipDeckEyebrow}</p>
        <h2 className="font-headline text-2xl sm:text-3xl font-bold text-foreground mb-3 break-words">
          {pc.sponsorshipDeckHeadline}
        </h2>
        <p className="font-body text-base text-muted-foreground leading-relaxed mb-6 max-w-[42rem] break-words">
          {pc.sponsorshipDeckBody}
        </p>
        {pc.sponsorshipDeckPDFUrl ? (
          <a
            href={pc.sponsorshipDeckPDFUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center min-h-[44px] px-5 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            {pc.sponsorshipDeckCTA}
          </a>
        ) : (
          <a
            href="#inquiry"
            className="inline-flex items-center justify-center min-h-[44px] px-5 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            {pc.sponsorshipDeckCTA}
          </a>
        )}
      </section>

      <section className="min-w-0">
        <p className="eyebrow text-muted-foreground mb-2 break-words">{pc.tracksEyebrow}</p>
        <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-6 sm:mb-8 break-words">
          {pc.tracksHeadline}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {pc.tracks.map((track, index) => (
            <div key={`${track.title}-${index}`} className="min-w-0">
              <h3 className="font-headline text-xl font-bold text-foreground mb-2 break-words">
                {track.title}
              </h3>
              <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed break-words">
                {track.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="inquiry" className="min-w-0 scroll-mt-24">
        <p className="eyebrow text-muted-foreground mb-2 break-words">{pc.inquiryEyebrow}</p>
        <h2 className="font-headline text-2xl sm:text-3xl font-bold text-foreground mb-3 break-words max-w-[36rem]">
          {pc.inquiryHeadline}
        </h2>
        <p className="font-body text-base text-muted-foreground leading-relaxed mb-6 max-w-[42rem] break-words">
          {pc.inquiryBody}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 max-w-xl">
          <div className="flex-1 min-w-0 w-full">
            <label htmlFor="inquiry-category" className="block text-sm font-medium mb-1 font-body">
              Inquiry category
            </label>
            <select
              id="inquiry-category"
              value={selected?.id || ''}
              onChange={(e) => setInquiryCategoryId(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={openInquiry}
            className="w-full sm:w-auto min-h-[44px] px-5 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800 transition-colors shrink-0"
          >
            {pc.inquiryCTA}
          </button>
        </div>
      </section>

      <PartnersLogosGrid
        eyebrow={pc.trustedByLabel}
        headline={pc.trustedBySubLabel}
        description={pc.trustedByDescription}
      />

      <GetInTouchForm />
    </div>
  )
}
