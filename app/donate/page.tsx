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
  mergeCharityCaseLists,
} from '@/lib/charity-cases'
import {
  DONATION_PAYMENT_TYPES,
  type DonationPaymentType,
  resolvePartnerPaymentLink,
} from '@/lib/donation-payment-links'

interface CharityPartner {
  id: string
  name: string
  description?: string
  paymentLink?: string
  zakatPaymentLink?: string
  sadaqahPaymentLink?: string
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
  const [selectedPartner, setSelectedPartner] = useState<CharityPartner | null>(null)
  const [modalStep, setModalStep] = useState<'partner' | 'type'>('partner')
  const [loading, setLoading] = useState(true)
  const [causeFromQuery, setCauseFromQuery] = useState<string | null>(null)

  useEffect(() => {
    try {
      setCauseFromQuery(new URLSearchParams(window.location.search).get('cause'))
    } catch {
      setCauseFromQuery(null)
    }
  }, [])

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
      setCauses(mergeCharityCaseLists(fromCases, fromLegacy))
      causesLoaded = true
      checkDone()
    }

    const unsubCases = onSnapshot(
      query(collection(db, 'charityCases'), where('status', '==', 'active')),
      (snapshot) => {
        fromCases = snapshot.docs.map((d) =>
          normalizeCharityCase(d.id, d.data() as Record<string, unknown>, 'charityCases')
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
          normalizeCharityCase(d.id, d.data() as Record<string, unknown>, 'causes')
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

  useEffect(() => {
    if (!causeFromQuery || causes.length === 0 || selectedCause) return
    const match = causes.find((c) => c.id === causeFromQuery)
    if (match) setSelectedCause(match)
  }, [causeFromQuery, causes, selectedCause])

  const resolvePaymentLink = (
    cause: CharityCase,
    partner: CharityPartner | null | undefined,
    donationType: DonationPaymentType
  ) => {
    const fallback = donationsConfig.beitAlKhairURL || ''
    if (partner) {
      return resolvePartnerPaymentLink(partner, donationType, fallback)
    }
    if (cause.partnerId) {
      const assigned = partners.find((p) => p.id === cause.partnerId)
      if (assigned) return resolvePartnerPaymentLink(assigned, donationType, fallback)
    }
    return fallback
  }

  const buildConfirmHref = (
    cause: CharityCase,
    partner: CharityPartner | null | undefined,
    donationType: DonationPaymentType
  ) => {
    const paymentLink = resolvePaymentLink(cause, partner, donationType)
    const params = new URLSearchParams({
      cause: cause.id,
      causeName: cause.title,
      causeDescription: cause.description.slice(0, 500),
      paymentLink,
      donationType,
    })
    if (partner) {
      params.set('partner', partner.id)
      params.set('partnerName', partner.name)
    } else if (donationsConfig.beitAlKhairURL) {
      params.set('partnerName', 'Beit Al Khair')
    }
    return `/donate-confirm?${params.toString()}`
  }

  const openDonateModal = (cause: CharityCase) => {
    setSelectedCause(cause)
    setSelectedPartner(null)
    setModalStep('partner')
  }

  const closeDonateModal = () => {
    setSelectedCause(null)
    setSelectedPartner(null)
    setModalStep('partner')
  }

  const choosePartner = (partner: CharityPartner | null) => {
    setSelectedPartner(partner)
    setModalStep('type')
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          className="w-full h-28 sm:h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-28 sm:h-32 bg-neutral-100 flex items-center justify-center">
                          <Heart className="w-7 h-7 text-neutral-300" />
                        </div>
                      )}
                      <div className="p-3 flex flex-col flex-1 gap-1.5">
                        <span
                          className="inline-block self-start bg-neutral-100 text-neutral-800 text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {cause.category}
                        </span>
                        <h3
                          className="text-base sm:text-lg leading-snug text-neutral-900 line-clamp-2"
                          style={{ fontFamily: 'Cormorant Garamond, serif' }}
                        >
                          {cause.title}
                        </h3>
                        <p
                          className="text-neutral-600 text-xs leading-snug line-clamp-2 flex-1"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {truncateAtWord(cause.description, 90)}
                        </p>

                        <div className="pt-1">
                          <div
                            className="flex justify-between text-xs mb-1"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            <span className="font-semibold">
                              AED {cause.amountRaised.toLocaleString()}
                            </span>
                            <span className="text-neutral-500">
                              AED {cause.targetAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-1.5">
                            <div
                              className="bg-neutral-900 h-1.5 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-neutral-500 mt-0.5">{pct}% funded</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => openDonateModal(cause)}
                          className="w-full h-8 min-h-0 bg-black hover:bg-neutral-900 text-white rounded-md font-semibold flex items-center justify-center gap-1.5 text-[11px] mt-1"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          Donate Now <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {selectedCause && (
            <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-3 z-50 overflow-y-auto">
              <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto">
                <div className="p-3.5 sm:p-4 border-b border-neutral-100">
                  <h2
                    className="text-lg sm:text-xl flex items-center gap-2 text-neutral-900 leading-snug"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    <Heart className="w-4 h-4 text-red-500 shrink-0" />
                    Donate to: {selectedCause.title}
                  </h2>
                  <p
                    className="text-neutral-600 mt-1 text-xs line-clamp-2"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {selectedCause.description}
                  </p>
                </div>

                <div className="p-3.5 sm:p-4 space-y-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {modalStep === 'partner' ? (
                    <div>
                      <h3 className="text-sm font-semibold mb-1">1. Select payment partner</h3>
                      <p className="text-neutral-600 text-xs mb-2.5">
                        Next you will choose Zakat or Sadaqah — each uses its own payment link.
                      </p>

                      {assignedPartner ? (
                        <button
                          type="button"
                          onClick={() => choosePartner(assignedPartner)}
                          className="w-full text-left block border-2 border-neutral-900 rounded-md p-2.5 hover:bg-neutral-50 transition-all"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm truncate">{assignedPartner.name}</h4>
                              {assignedPartner.description ? (
                                <p className="text-xs text-neutral-600 mt-0.5 line-clamp-1">
                                  {assignedPartner.description}
                                </p>
                              ) : null}
                              <span className="inline-block mt-1.5 text-[10px] bg-black text-white px-1.5 py-0.5 rounded">
                                Primary partner for this cause
                              </span>
                            </div>
                            <ArrowRight className="w-4 h-4 shrink-0" />
                          </div>
                        </button>
                      ) : partners.length > 0 ? (
                        <div className="space-y-2">
                          {partners.map((partner) => (
                            <button
                              key={partner.id}
                              type="button"
                              onClick={() => choosePartner(partner)}
                              className="w-full text-left block border border-neutral-200 rounded-md p-2.5 hover:border-neutral-900 hover:bg-neutral-50 transition-all"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm truncate">{partner.name}</h4>
                                  {partner.description ? (
                                    <p className="text-xs text-neutral-600 line-clamp-1">
                                      {partner.description}
                                    </p>
                                  ) : null}
                                </div>
                                <ArrowRight className="w-4 h-4 shrink-0" />
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : fallbackUrl ? (
                        <button
                          type="button"
                          onClick={() => choosePartner(null)}
                          className="w-full text-left block border-2 border-neutral-900 rounded-md p-2.5 hover:bg-neutral-50 transition-all"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-sm">Beit Al Khair</h4>
                              <p className="text-xs text-neutral-600 mt-0.5">
                                Official payment partner.
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 shrink-0" />
                          </div>
                        </button>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded p-2.5">
                          <p className="text-amber-900 font-semibold text-sm mb-0.5">
                            Payment link not configured
                          </p>
                          <p className="text-amber-800 text-xs">
                            Ask an admin to set Zakat/Sadaqah payment links on a charity partner.
                          </p>
                        </div>
                      )}

                      {assignedPartner &&
                        partners.filter((p) => p.id !== assignedPartner.id).length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            <p className="text-xs font-semibold text-neutral-600">Alternatives</p>
                            {partners
                              .filter((p) => p.id !== assignedPartner.id)
                              .map((partner) => (
                                <button
                                  key={partner.id}
                                  type="button"
                                  onClick={() => choosePartner(partner)}
                                  className="w-full text-left block border rounded-md px-2.5 py-2 hover:bg-neutral-50"
                                >
                                  <div className="flex justify-between items-center gap-2">
                                    <span className="font-medium text-xs truncate">
                                      {partner.name}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                                  </div>
                                </button>
                              ))}
                          </div>
                        )}
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => setModalStep('partner')}
                        className="text-xs font-semibold text-neutral-600 underline mb-2"
                      >
                        ← Change partner
                      </button>
                      <h3 className="text-sm font-semibold mb-1">2. Zakat or Sadaqah?</h3>
                      <p className="text-neutral-600 text-xs mb-2.5">
                        {selectedPartner
                          ? `Paying via ${selectedPartner.name}. Each type opens a different payment link.`
                          : 'Choose the donation type to open the matching payment link.'}
                      </p>
                      <div className="space-y-2">
                        {DONATION_PAYMENT_TYPES.map((t) => {
                          const href = buildConfirmHref(selectedCause, selectedPartner, t.id)
                          const link = resolvePaymentLink(selectedCause, selectedPartner, t.id)
                          const disabled = !link
                          return disabled ? (
                            <div
                              key={t.id}
                              className="border border-neutral-200 rounded-md p-2.5 opacity-50"
                            >
                              <p className="font-bold text-sm">{t.label}</p>
                              <p className="text-xs text-neutral-500">{t.description}</p>
                              <p className="text-[10px] text-amber-700 mt-1">
                                No payment link configured for this type
                              </p>
                            </div>
                          ) : (
                            <Link
                              key={t.id}
                              href={href}
                              className="block border-2 border-neutral-900 rounded-md p-2.5 hover:bg-neutral-50 transition-all"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="font-bold text-sm">{t.label}</p>
                                  <p className="text-xs text-neutral-600">{t.description}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 shrink-0" />
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 sm:p-3.5 border-t bg-neutral-50">
                  <button
                    type="button"
                    onClick={closeDonateModal}
                    className="w-full h-8 min-h-0 bg-black hover:bg-neutral-800 text-white rounded-md font-semibold text-[11px]"
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
