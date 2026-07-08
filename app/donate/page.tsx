'use client'

import React, { useEffect, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import Link from 'next/link'
import { Heart, ArrowRight, CheckCircle, HandHeart } from 'lucide-react'
import {
  subscribeToDonationsConfig,
  DonationsPlatformConfig,
  DEFAULT_DONATIONS_CONFIG,
} from '@/lib/donations-config'
import {
  CharityCase,
  normalizeCharityCase,
  truncateAtWord,
  progressPercent,
} from '@/lib/charity-cases'

interface CharityPartner {
  id: string
  name: string
  description?: string
  paymentLink?: string
  logo?: string
  status?: string
  isActive?: boolean
}

function partnerIsActive(p: CharityPartner): boolean {
  if (p.isActive === false) return false
  if (p.status && p.status !== 'active') return false
  return true
}

export default function DonationPage() {
  const [causes, setCauses] = useState<CharityCase[]>([])
  const [partners, setPartners] = useState<CharityPartner[]>([])
  const [donationsConfig, setDonationsConfig] =
    useState<DonationsPlatformConfig>(DEFAULT_DONATIONS_CONFIG)
  const [selectedCause, setSelectedCause] = useState<CharityCase | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let causesLoaded = false
    let partnersLoaded = false
    let configLoaded = false

    const checkDone = () => {
      if (causesLoaded && partnersLoaded && configLoaded) setLoading(false)
    }

    // Canonical: charityCases. Legacy: causes (merge so older admin publishes still appear).
    let fromCases: CharityCase[] = []
    let fromLegacy: CharityCase[] = []
    let casesSnapDone = false
    let legacySnapDone = false

    const mergeAndSet = () => {
      if (!casesSnapDone || !legacySnapDone) return
      const byId = new Map<string, CharityCase>()
      for (const c of fromLegacy) byId.set(c.id, c)
      for (const c of fromCases) byId.set(c.id, c) // charityCases wins on id collision
      setCauses(Array.from(byId.values()))
      causesLoaded = true
      checkDone()
    }

    const unsubCases = onSnapshot(
      query(collection(db, 'charityCases'), where('status', '==', 'active')),
      (snapshot) => {
        fromCases = snapshot.docs.map((d) =>
          normalizeCharityCase(d.id, d.data() as Record<string, unknown>)
        )
        casesSnapDone = true
        mergeAndSet()
      },
      (error) => {
        console.error('[donate] charityCases snapshot error:', error)
        casesSnapDone = true
        mergeAndSet()
      }
    )

    const unsubLegacy = onSnapshot(
      query(collection(db, 'causes'), where('status', '==', 'active')),
      (snapshot) => {
        fromLegacy = snapshot.docs.map((d) =>
          normalizeCharityCase(d.id, d.data() as Record<string, unknown>)
        )
        legacySnapDone = true
        mergeAndSet()
      },
      (error) => {
        console.error('[donate] legacy causes snapshot error:', error)
        legacySnapDone = true
        mergeAndSet()
      }
    )

    const unsubPartners = onSnapshot(
      collection(db, 'charityPartners'),
      (snapshot) => {
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<CharityPartner, 'id'>) }))
          .filter(partnerIsActive)
        setPartners(data)
        partnersLoaded = true
        checkDone()
      },
      (error) => {
        console.error('[donate] charityPartners snapshot error:', error)
        partnersLoaded = true
        checkDone()
      }
    )

    const unsubConfig = subscribeToDonationsConfig((cfg) => {
      setDonationsConfig(cfg)
      configLoaded = true
      checkDone()
    })

    const timeout = setTimeout(() => setLoading(false), 6000)

    return () => {
      unsubCases()
      unsubLegacy()
      unsubPartners()
      unsubConfig()
      clearTimeout(timeout)
    }
  }, [])

  const resolvePaymentLink = (cause: CharityCase, partner?: CharityPartner | null) => {
    if (partner?.paymentLink) return partner.paymentLink
    if (cause.partnerId) {
      const assigned = partners.find((p) => p.id === cause.partnerId)
      if (assigned?.paymentLink) return assigned.paymentLink
    }
    return donationsConfig.beitAlKhairURL || ''
  }

  const buildConfirmHref = (cause: CharityCase, partner?: CharityPartner | null) => {
    const paymentLink = resolvePaymentLink(cause, partner)
    const params = new URLSearchParams({
      cause: cause.id,
      causeName: cause.title,
      causeDescription: cause.description.slice(0, 500),
      paymentLink,
    })
    if (partner) {
      params.set('partner', partner.id)
      params.set('partnerName', partner.name)
    } else if (donationsConfig.beitAlKhairURL) {
      params.set('partnerName', 'Beit Al Khair')
    }
    return `/donate-confirm?${params.toString()}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50">
        <Navbar />
        <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto w-full space-y-8 animate-pulse">
            <div className="h-10 bg-neutral-200 rounded w-2/3 mx-auto" />
            <div className="h-4 bg-neutral-200 rounded w-full max-w-xl mx-auto" />
            <div className="h-32 bg-neutral-200 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-neutral-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const assignedPartner = selectedCause?.partnerId
    ? partners.find((p) => p.id === selectedCause.partnerId)
    : null
  const fallbackUrl = donationsConfig.beitAlKhairURL

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      <Navbar />
      <div className="flex-1 py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-10 sm:mb-12 w-full">
            <p
              className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {donationsConfig.pageEyebrow}
            </p>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-normal mb-4 text-neutral-900"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              {donationsConfig.pageHeadline}
            </h1>
            <p
              className="text-base sm:text-lg text-neutral-600 w-full mx-auto leading-relaxed max-w-2xl px-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {donationsConfig.pageBody}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5 sm:p-8 mb-10 sm:mb-12 border-l-4 border-neutral-900">
            <h2
              className="text-xl sm:text-2xl mb-3 flex items-center gap-2 text-neutral-900"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              {donationsConfig.legalPartnershipTitle}
            </h2>
            <p
              className="text-neutral-700 leading-relaxed"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {donationsConfig.legalPartnershipBody}
            </p>
          </div>

          <div className="mb-12">
            <h2
              className="text-2xl sm:text-3xl mb-6 text-neutral-900"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Choose a Cause
            </h2>

            {causes.length === 0 ? (
              <div className="text-center py-14 px-4 bg-white rounded-lg border border-neutral-200">
                <HandHeart className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <p
                  className="text-neutral-600 mb-2"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  No active causes at the moment
                </p>
                <p className="text-sm text-neutral-500 mb-6">
                  When an admin publishes a cause, it will appear here instantly.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex min-h-[44px] items-center justify-center px-5 bg-black text-white text-sm font-medium rounded"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Contact us about giving
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {causes.map((cause) => {
                  const pct = progressPercent(cause.amountRaised, cause.targetAmount)
                  return (
                    <div
                      key={cause.id}
                      className="bg-white rounded-lg shadow-sm overflow-hidden border border-neutral-100 flex flex-col"
                    >
                      {cause.bannerImage ? (
                        <img
                          src={cause.bannerImage}
                          alt={cause.title}
                          className="w-full h-44 sm:h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-44 sm:h-48 bg-neutral-100 flex items-center justify-center">
                          <Heart className="w-10 h-10 text-neutral-300" />
                        </div>
                      )}
                      <div className="p-4 sm:p-5 flex flex-col flex-1">
                        <span
                          className="inline-block self-start bg-neutral-100 text-neutral-800 text-[10px] tracking-wider uppercase font-semibold px-2.5 py-1 rounded mb-2"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {cause.category}
                        </span>
                        <h3
                          className="text-lg sm:text-xl mb-2 text-neutral-900"
                          style={{ fontFamily: 'Cormorant Garamond, serif' }}
                        >
                          {cause.title}
                        </h3>
                        <p
                          className="text-neutral-600 text-sm mb-4 flex-1"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {truncateAtWord(cause.description)}
                        </p>

                        <div className="mb-4">
                          <div
                            className="flex justify-between text-sm mb-1"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            <span className="font-semibold">
                              AED {cause.amountRaised.toLocaleString()}
                            </span>
                            <span className="text-neutral-500">
                              AED {cause.targetAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-2">
                            <div
                              className="bg-neutral-900 h-2 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">{pct}% funded</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedCause(cause)}
                          className="w-full min-h-[44px] bg-black hover:bg-neutral-900 text-white py-2.5 rounded font-semibold flex items-center justify-center gap-2 text-sm"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          Donate Now <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {selectedCause && (
            <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
                <div className="p-5 sm:p-6 border-b border-neutral-100">
                  <h2
                    className="text-xl sm:text-2xl flex items-center gap-2 text-neutral-900"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    <Heart className="w-5 h-5 text-red-500 shrink-0" />
                    Donate to: {selectedCause.title}
                  </h2>
                  <p
                    className="text-neutral-600 mt-2 text-sm sm:text-base"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {selectedCause.description}
                  </p>
                </div>

                <div className="p-5 sm:p-6 space-y-5" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <div>
                    <h3 className="text-base font-semibold mb-2">Select payment partner</h3>
                    <p className="text-neutral-600 text-sm mb-4">
                      You will enter your amount, then be redirected to an official partner to
                      complete payment. Afterward, return here to upload proof.
                    </p>

                    {assignedPartner ? (
                      <Link
                        href={buildConfirmHref(selectedCause, assignedPartner)}
                        className="block border-2 border-neutral-900 rounded-lg p-4 hover:bg-neutral-50 transition-all min-h-[44px]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold">{assignedPartner.name}</h4>
                            <p className="text-sm text-neutral-600 mt-1">
                              {assignedPartner.description}
                            </p>
                            <span className="inline-block mt-2 text-xs bg-black text-white px-2 py-1 rounded">
                              Primary partner for this cause
                            </span>
                          </div>
                          <ArrowRight className="w-5 h-5 shrink-0" />
                        </div>
                      </Link>
                    ) : partners.length > 0 ? (
                      <div className="space-y-3">
                        {partners.map((partner) => (
                          <Link
                            key={partner.id}
                            href={buildConfirmHref(selectedCause, partner)}
                            className="block border border-neutral-200 rounded-lg p-4 hover:border-neutral-900 hover:bg-neutral-50 transition-all min-h-[44px]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-bold">{partner.name}</h4>
                                <p className="text-sm text-neutral-600">{partner.description}</p>
                              </div>
                              <ArrowRight className="w-5 h-5 shrink-0" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : fallbackUrl ? (
                      <Link
                        href={buildConfirmHref(selectedCause, null)}
                        className="block border-2 border-neutral-900 rounded-lg p-4 hover:bg-neutral-50 transition-all min-h-[44px]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold">Beit Al Khair</h4>
                            <p className="text-sm text-neutral-600 mt-1">
                              You will be redirected to our official payment partner.
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 shrink-0" />
                        </div>
                      </Link>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded p-4">
                        <p className="text-amber-900 font-semibold mb-1">Payment link not configured</p>
                        <p className="text-amber-800 text-sm">
                          Please ask an admin to set a charity partner payment link or the Beit Al
                          Khair URL in CMS → Donations.
                        </p>
                      </div>
                    )}

                    {assignedPartner && partners.filter((p) => p.id !== assignedPartner.id).length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-semibold text-neutral-600">Alternatives</p>
                        {partners
                          .filter((p) => p.id !== assignedPartner.id)
                          .map((partner) => (
                            <Link
                              key={partner.id}
                              href={buildConfirmHref(selectedCause, partner)}
                              className="block border rounded-lg p-3 hover:bg-neutral-50 min-h-[44px]"
                            >
                              <div className="flex justify-between items-center gap-2">
                                <span className="font-medium text-sm">{partner.name}</span>
                                <ArrowRight className="w-4 h-4" />
                              </div>
                            </Link>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 sm:p-6 border-t bg-neutral-50">
                  <button
                    type="button"
                    onClick={() => setSelectedCause(null)}
                    className="w-full min-h-[44px] bg-white text-black border border-neutral-300 hover:bg-neutral-100 py-2.5 rounded font-semibold text-sm"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-12 text-center space-y-3">
            <Link
              href="/dashboard/charity-requests?apply=1"
              className="inline-flex min-h-[44px] items-center justify-center px-6 bg-black text-white text-sm font-semibold rounded hover:bg-neutral-900"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Request Charity Support
            </Link>
            <p className="text-xs text-neutral-500" style={{ fontFamily: 'Inter, sans-serif' }}>
              Confidential applications are reviewed by our welfare team
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
