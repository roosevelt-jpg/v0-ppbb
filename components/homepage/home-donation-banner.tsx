'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  subscribeToHomepage,
  DEFAULT_HOMEPAGE,
  HomepageConfig,
  HomepageBannerButton,
} from '@/lib/homepage-config'
import { subscribeToGlobalSettings, DEFAULT_GLOBAL_SETTINGS } from '@/lib/platform-config'

function isWhatsAppBannerButton(button: HomepageBannerButton): boolean {
  const label = button.label.toLowerCase()
  const href = button.href.toLowerCase()
  return (
    href === '__whatsapp__' ||
    href.includes('whatsapp') ||
    label.includes('whatsapp') ||
    label.includes('contact us')
  )
}

function BannerButton({
  button,
  textColor,
  whatsappHref,
}: {
  button: HomepageBannerButton
  textColor: string
  whatsappHref: string
}) {
  const useWhatsApp = isWhatsAppBannerButton(button)
  const href = useWhatsApp && whatsappHref ? whatsappHref : button.href
  const label = useWhatsApp ? 'Join Our Whatsapp' : button.label
  const style = useWhatsApp ? 'primary' : button.style
  const external = useWhatsApp || /^https?:\/\//i.test(href)

  const base =
    'inline-flex items-center justify-center font-body text-sm font-semibold transition-colors min-h-[44px] px-5 py-3 rounded-lg'

  if (useWhatsApp && !whatsappHref) {
    return null
  }

  const className =
    style === 'primary'
      ? `${base} bg-black text-white hover:bg-gray-800`
      : style === 'secondary'
        ? `${base} bg-white text-black border border-gray-300 hover:bg-gray-50`
        : `${base} underline underline-offset-4 hover:opacity-80`

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style === 'text' ? { color: textColor } : undefined}
      >
        {label}
      </a>
    )
  }

  return (
    <Link
      href={href}
      className={className}
      style={style === 'text' ? { color: textColor } : undefined}
    >
      {label}
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
  const [whatsappHref, setWhatsappHref] = useState(DEFAULT_GLOBAL_SETTINGS.whatsappLink)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsub = subscribeToHomepage((data) => {
      setConfig(data)
      setReady(true)
    })
    return unsub
  }, [])

  useEffect(() => subscribeToGlobalSettings((s) => setWhatsappHref(s.whatsappLink || '')), [])

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
            <BannerButton
              key={`${button.href}-${i}`}
              button={button}
              textColor={donationBanner.textColor}
              whatsappHref={whatsappHref}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
