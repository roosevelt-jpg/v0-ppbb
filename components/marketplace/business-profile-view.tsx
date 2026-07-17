'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Calendar,
  ExternalLink,
  Facebook,
  Instagram,
  Linkedin,
  MapPin,
  MessageCircle,
  Phone,
  Tag,
  Twitter,
  UserPlus,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { getDmInboxPath } from '@/lib/roles'
import { auth, db } from '@/lib/firebase'
import {
  isActiveJob,
  isActiveOffer,
  subscribeToBusinessJobs,
  subscribeToBusinessOffers,
  subscribeToDirectoryBusiness,
  type DirectoryBusiness,
  type DirectoryJob,
  type DirectoryOffer,
} from '@/lib/marketplace-directory'
import { subscribeToActiveBusinessDiscounts, type BusinessDiscount } from '@/lib/business-discounts'
import { RichTextContent } from '@/components/rich-text-content'
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore'
import { format } from 'date-fns'

interface BusinessProfileViewProps {
  businessId: string
}

type ProfileEvent = {
  id: string
  title: string
  startDate?: unknown
  location?: string
  imageURL?: string
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      const d = (value as { toDate: () => Date }).toDate()
      return Number.isNaN(d.getTime()) ? null : d
    } catch {
      return null
    }
  }
  const d = new Date(value as string | number)
  return Number.isNaN(d.getTime()) ? null : d
}

function OverviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-2.5 border-b border-neutral-100 last:border-0 text-sm">
      <span className="text-neutral-500 shrink-0">{label}</span>
      <span className="font-semibold text-neutral-900 text-right break-words">{value || '—'}</span>
    </div>
  )
}

export function BusinessProfileView({ businessId }: BusinessProfileViewProps) {
  const router = useRouter()
  const { user, firebaseUser, loading: authLoading } = useAuth()
  const isLoggedInMember = Boolean(firebaseUser || user)

  const [business, setBusiness] = useState<DirectoryBusiness | null>(null)
  const [offers, setOffers] = useState<DirectoryOffer[]>([])
  const [jobs, setJobs] = useState<DirectoryJob[]>([])
  const [discounts, setDiscounts] = useState<BusinessDiscount[]>([])
  const [businessReady, setBusinessReady] = useState(false)
  const [offersReady, setOffersReady] = useState(false)
  const [jobsReady, setJobsReady] = useState(false)
  const [discountsReady, setDiscountsReady] = useState(false)
  const [events, setEvents] = useState<ProfileEvent[]>([])
  const [eventsReady, setEventsReady] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [leadTracked, setLeadTracked] = useState(false)

  useEffect(
    () =>
      subscribeToDirectoryBusiness(businessId, (data) => {
        setBusiness(data)
        setNotFound(!data)
        setBusinessReady(true)
      }),
    [businessId]
  )

  useEffect(
    () =>
      subscribeToBusinessOffers(businessId, (data) => {
        setOffers(data)
        setOffersReady(true)
      }),
    [businessId]
  )

  useEffect(
    () =>
      subscribeToBusinessJobs(businessId, (data) => {
        setJobs(data)
        setJobsReady(true)
      }),
    [businessId]
  )

  useEffect(
    () =>
      subscribeToActiveBusinessDiscounts(businessId, (data) => {
        setDiscounts(data)
        setDiscountsReady(true)
      }),
    [businessId]
  )

  useEffect(() => {
    if (!businessId) return
    let byBusinessId: ProfileEvent[] = []
    let byCreatedBy: ProfileEvent[] = []
    let byOwnerId: ProfileEvent[] = []
    const ownerId = business?.ownerId || ''

    const mapDocs = (docs: { id: string; data: () => Record<string, unknown> }[]) =>
      docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          title: String(data.title || 'Event'),
          startDate: data.startDate || data.date || data.eventDate,
          location:
            typeof data.location === 'string'
              ? data.location
              : String(
                  (data.location as { formattedAddress?: string } | undefined)?.formattedAddress ||
                    data.locationLabel ||
                    ''
                ),
          imageURL: String(data.imageURL || data.coverImage || data.bannerURL || ''),
        }
      })

    const isPublicEvent = (status: string) => {
      const s = status.toLowerCase()
      return (
        s === 'published' ||
        s === 'active' ||
        s === 'upcoming' ||
        s === 'open' ||
        s === ''
      )
    }

    const emit = () => {
      const map = new Map<string, ProfileEvent>()
      for (const ev of [...byBusinessId, ...byCreatedBy, ...byOwnerId]) {
        if (!map.has(ev.id)) map.set(ev.id, ev)
      }
      const merged = Array.from(map.values()).sort((a, b) => {
        const at = toDate(a.startDate)?.getTime() || 0
        const bt = toDate(b.startDate)?.getTime() || 0
        return bt - at
      })
      setEvents(merged.slice(0, 12))
      setEventsReady(true)
    }

    const unsubA = onSnapshot(
      query(collection(db, 'events'), where('businessId', '==', businessId), limit(20)),
      (snap) => {
        byBusinessId = mapDocs(snap.docs).filter((ev) => {
          const raw = snap.docs.find((d) => d.id === ev.id)?.data() as { status?: string } | undefined
          return isPublicEvent(String(raw?.status || 'published'))
        })
        emit()
      },
      () => {
        byBusinessId = []
        emit()
      }
    )

    const unsubB = onSnapshot(
      query(collection(db, 'events'), where('createdBy', '==', businessId), limit(20)),
      (snap) => {
        byCreatedBy = mapDocs(snap.docs).filter((ev) => {
          const raw = snap.docs.find((d) => d.id === ev.id)?.data() as { status?: string } | undefined
          return isPublicEvent(String(raw?.status || 'published'))
        })
        emit()
      },
      () => {
        byCreatedBy = []
        emit()
      }
    )

    let unsubC: (() => void) | undefined
    if (ownerId && ownerId !== businessId) {
      unsubC = onSnapshot(
        query(collection(db, 'events'), where('createdBy', '==', ownerId), limit(20)),
        (snap) => {
          byOwnerId = mapDocs(snap.docs).filter((ev) => {
            const raw = snap.docs.find((d) => d.id === ev.id)?.data() as
              | { status?: string; businessId?: string }
              | undefined
            if (!isPublicEvent(String(raw?.status || 'published'))) return false
            // Prefer events tied to this business when businessId is set
            if (raw?.businessId && raw.businessId !== businessId) return false
            return true
          })
          emit()
        },
        () => {
          byOwnerId = []
          emit()
        }
      )
    } else {
      byOwnerId = []
      emit()
    }

    return () => {
      unsubA()
      unsubB()
      unsubC?.()
    }
  }, [businessId, business?.ownerId])

  useEffect(() => {
    if (!firebaseUser || leadTracked || !businessId) return
    void (async () => {
      try {
        const token = await auth.currentUser?.getIdToken()
        if (!token) return
        await fetch('/api/business/leads/track', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ businessId, sourceType: 'profile_view' }),
        })
        setLeadTracked(true)
      } catch {
        /* non-blocking */
      }
    })()
  }, [firebaseUser, businessId, leadTracked])

  const openEncryptedChat = () => {
    if (!isLoggedInMember) {
      router.push(`/login?returnUrl=${encodeURIComponent(`/directory/${businessId}`)}`)
      return
    }
    const recipientId = (business?.ownerId || '').trim()
    if (!recipientId) {
      alert('This business has no messaging contact yet. Please try again later.')
      return
    }
    const myId = user?.id || firebaseUser?.uid || ''
    if (myId && recipientId === myId) {
      alert('This is your business profile. Members will message you in Messages.')
      return
    }
    // Always open member/business DM thread with the business owner — never admin chatbot
    const inbox = getDmInboxPath(user)
    router.push(`${inbox}?to=${encodeURIComponent(recipientId)}`)
  }

  const handleConnect = () => {
    openEncryptedChat()
  }

  const handleMessage = () => {
    openEncryptedChat()
  }

  const activeOffers = useMemo(() => offers.filter(isActiveOffer), [offers])
  const activeJobs = useMemo(() => {
    return [...jobs.filter(isActiveJob)].sort((a, b) => {
      const at = a.publishedAt?.getTime() || 0
      const bt = b.publishedAt?.getTime() || 0
      return bt - at
    })
  }, [jobs])
  const latestOffers = useMemo(() => activeOffers.slice(0, 12), [activeOffers])
  const latestJobs = useMemo(() => activeJobs.slice(0, 12), [activeJobs])
  const galleryImages = useMemo(() => {
    const fromBusiness = business?.productImages || []
    const fromOffers = activeOffers.flatMap((o) => {
      if (o.images?.length) return o.images
      return o.imageURL ? [o.imageURL] : []
    })
    return Array.from(new Set([...fromBusiness, ...fromOffers].filter(Boolean)))
  }, [business, activeOffers])
  const memberDiscounts = useMemo(
    () => activeOffers.filter((o) => o.isMemberDiscount),
    [activeOffers]
  )
  const hasMemberDiscounts = memberDiscounts.length > 0 || discounts.length > 0

  const primaryPhone =
    business?.phone || activeOffers.find((o) => o.phone)?.phone || ''

  const lastJobPosted = latestJobs[0]?.publishedAt || null
  const memberSince = business?.createdAt || null

  const loading = !businessReady || !offersReady || !jobsReady || !discountsReady || !eventsReady

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 sm:h-56 md:h-64 w-full bg-neutral-200 rounded-lg" />
        <div className="flex items-end gap-4 -mt-12 px-1">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-neutral-300 border-4 border-white" />
          <div className="flex-1 space-y-2 pb-2">
            <div className="h-8 w-2/3 bg-neutral-200 rounded" />
            <div className="h-4 w-1/3 bg-neutral-200 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div className="h-48 bg-neutral-200 rounded-lg" />
          <div className="h-64 bg-neutral-200 rounded-lg" />
        </div>
      </div>
    )
  }

  if (notFound || !business) {
    return (
      <div className="text-center py-16 px-4">
        <h1 className="font-headline text-3xl font-bold text-foreground mb-3">Business not found</h1>
        <p className="font-body text-muted-foreground mb-6 max-w-md mx-auto">
          This listing may be pending approval or no longer active.
        </p>
        <Link
          href="/directory"
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 bg-[#111] text-white rounded-lg font-body text-sm font-semibold hover:bg-neutral-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to directory
        </Link>
      </div>
    )
  }

  const initial = (business.name.trim().charAt(0) || 'B').toUpperCase()
  const websiteHref = business.website
    ? business.website.startsWith('http')
      ? business.website
      : `https://${business.website}`
    : ''
  const social = business.socialLinks || {}

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0">
      <Link
        href="/directory"
        className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to directory
      </Link>

      {/* Banner + identity — logo may overlap banner; name sits below on light background */}
      <div>
        <div className="relative w-full overflow-hidden rounded-lg aspect-[21/9] sm:aspect-[3/1] bg-neutral-100">
          {business.bannerURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.bannerURL}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-100" />
          )}
        </div>

        <div className="relative z-10 px-1">
          <div className="-mt-10 sm:-mt-12 mb-3">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden bg-white border-4 border-white shadow-md shrink-0">
              {business.logoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.logoURL}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 font-headline text-2xl font-bold text-neutral-500">
                  {initial}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-1">
            <div className="min-w-0 flex-1">
              <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 break-words inline-flex items-center gap-2 flex-wrap">
                {business.name}
                {business.isSponsor ? (
                  <span
                    title="PB sponsor"
                    className="inline-flex items-center text-[#1D9BF0]"
                    aria-label="PB sponsor"
                  >
                    <BadgeCheck className="w-6 h-6 fill-[#1D9BF0] text-white" />
                  </span>
                ) : null}
              </h1>
              {business.ownerName ? (
                <p className="mt-1 text-sm text-neutral-500">{business.ownerName}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600">
                {business.location ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {business.location}
                  </span>
                ) : null}
                {business.category ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Tag className="w-4 h-4 shrink-0" />
                    {business.category}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end shrink-0">
              {websiteHref ? (
                <div className="text-sm">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Website
                  </p>
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-neutral-900 hover:underline break-all"
                  >
                    {business.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              ) : null}
              {(social.facebook || social.twitter || social.linkedin || social.instagram) && (
                <div className="text-sm">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
                    Follow Company
                  </p>
                  <div className="flex items-center gap-2">
                    {social.facebook ? (
                      <a
                        href={social.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#111] text-white"
                        aria-label="Facebook"
                      >
                        <Facebook className="w-4 h-4" />
                      </a>
                    ) : null}
                    {social.twitter ? (
                      <a
                        href={social.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#111] text-white"
                        aria-label="Twitter"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                    ) : null}
                    {social.linkedin ? (
                      <a
                        href={social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#111] text-white"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    ) : null}
                    {social.instagram ? (
                      <a
                        href={social.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#111] text-white"
                        aria-label="Instagram"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 lg:gap-8">
        {/* Main column — ordered: tags → gallery → products → jobs → events */}
        <div className="min-w-0 space-y-8">
          {business.description ? (
            <section>
              <h2 className="font-headline text-xl sm:text-2xl font-bold text-neutral-900 mb-3">
                About Company
              </h2>
              <div className="font-body text-sm sm:text-base text-neutral-600 leading-relaxed break-words">
                <RichTextContent html={business.description} />
              </div>
            </section>
          ) : null}

          {/* 3. Services Offered as tags */}
          {business.services.length > 0 ? (
            <section id="services">
              <h2 className="font-headline text-xl sm:text-2xl font-bold text-neutral-900 mb-3">
                Services Offered
              </h2>
              <div className="flex flex-wrap gap-2">
                {business.services.map((service) => (
                  <span
                    key={service}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-800 font-body text-sm"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {/* 4. Image Gallery of the Services */}
          <section id="gallery">
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-neutral-900 mb-4">
              Image Gallery
            </h2>
            {galleryImages.length === 0 ? (
              <p className="text-sm text-neutral-500">No service images uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {galleryImages.map((url) => (
                  <div
                    key={url}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100 border border-neutral-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 5. Services / Product Listing */}
          <section id="offers" className="scroll-mt-24">
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
              Services / Product Listing
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              Offers posted by this business
            </p>
            {latestOffers.length === 0 ? (
              <p className="text-sm text-neutral-500">No products or services listed yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {latestOffers.map((offer) => (
                  <article
                    key={offer.id}
                    className="border border-neutral-200 rounded-lg overflow-hidden bg-white flex flex-col"
                  >
                    {offer.imageURL ? (
                      <div className="relative aspect-[16/10] bg-neutral-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={offer.imageURL}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="p-4 flex flex-col flex-1 gap-2">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex px-2 py-0.5 rounded bg-neutral-100 text-[11px] font-semibold capitalize">
                          {offer.type || offer.category || 'Offer'}
                        </span>
                        {offer.isMemberDiscount ? (
                          <span className="inline-flex px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                            Member discount
                          </span>
                        ) : null}
                      </div>
                      <h3 className="font-bold text-neutral-900 break-words">{offer.title}</h3>
                      {offer.description ? (
                        <p className="text-sm text-neutral-500 line-clamp-2">{offer.description}</p>
                      ) : null}
                      <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                        {typeof offer.price === 'number' ? (
                          <p className="font-semibold text-sm">
                            AED {offer.price}
                            {typeof offer.originalPrice === 'number' &&
                            offer.originalPrice > offer.price ? (
                              <span className="ml-2 text-neutral-400 line-through font-normal text-xs">
                                AED {offer.originalPrice}
                              </span>
                            ) : null}
                          </p>
                        ) : (
                          <span />
                        )}
                        <Link
                          href={`/marketplace/${offer.id}`}
                          className="inline-flex items-center justify-center h-8 px-3 rounded-md bg-[#111] text-white text-xs font-semibold"
                        >
                          View offer
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* 6. Jobs Listed by this business */}
          <section id="jobs" className="scroll-mt-24">
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
              Jobs Listed
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              Open roles posted by this business
            </p>
            {latestJobs.length === 0 ? (
              <p className="text-sm text-neutral-500">No jobs listed yet.</p>
            ) : (
              <div className="space-y-3">
                {latestJobs.map((job) => (
                  <article
                    key={job.id}
                    className="border border-neutral-200 rounded-lg bg-white p-4 sm:p-5 flex gap-3 sm:gap-4"
                  >
                    <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-md overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                      {business.logoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={business.logoURL}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-neutral-500">
                          {initial}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-neutral-900 break-words">{job.title}</h3>
                          <p className="text-xs text-neutral-500 mt-0.5">{business.name}</p>
                        </div>
                        <Link
                          href={`/opportunities/${job.id}`}
                          className="shrink-0 inline-flex items-center justify-center h-9 px-3 rounded-md bg-[#111] text-white text-xs font-semibold"
                        >
                          View
                        </Link>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
                        {(job.location || business.location) && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {job.location || business.location}
                          </span>
                        )}
                        {job.jobType || job.category ? (
                          <span className="capitalize">{job.jobType || job.category}</span>
                        ) : null}
                        {job.experience ? <span>Experience: {job.experience}</span> : null}
                        {job.salary ? <span>Salary: {job.salary}</span> : null}
                        {job.publishedAt ? (
                          <span>Published: {format(job.publishedAt, 'dd MMM yyyy')}</span>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* 7. Events Listed by this business */}
          <section id="events" className="scroll-mt-24">
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
              Events Listed
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              Events hosted or listed by this business
            </p>
            {events.length === 0 ? (
              <p className="text-sm text-neutral-500">No events listed yet.</p>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => {
                  const start = toDate(ev.startDate)
                  return (
                    <article
                      key={ev.id}
                      className="border border-neutral-200 rounded-lg bg-white p-4 sm:p-5 flex gap-3 items-start"
                    >
                      {ev.imageURL ? (
                        <div className="relative h-12 w-12 rounded-md overflow-hidden bg-neutral-100 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ev.imageURL}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-neutral-100 shrink-0">
                          <Calendar className="w-4 h-4 text-neutral-700" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-neutral-900 break-words">{ev.title}</h3>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
                          {start ? <span>{format(start, 'dd MMM yyyy')}</span> : null}
                          {ev.location ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ev.location}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Link
                        href={`/events/${ev.id}`}
                        className="shrink-0 inline-flex items-center justify-center h-9 px-3 rounded-md bg-[#111] text-white text-xs font-semibold"
                      >
                        View
                      </Link>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          {/* Member discounts */}
          {!authLoading && isLoggedInMember && hasMemberDiscounts ? (
            <section className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 mb-2">
                Member discounts
              </p>
              <h2 className="font-headline text-xl font-bold text-neutral-900 mb-3">
                Exclusive for members
              </h2>
              <ul className="space-y-3">
                {memberDiscounts.map((offer) => (
                  <li key={offer.id} className="text-sm text-neutral-800">
                    <span className="font-semibold">{offer.title}</span>
                    {(offer.discountPercentage || offer.memberBenefit) && (
                      <span className="text-emerald-800 ml-2">
                        {offer.discountPercentage || offer.memberBenefit}% off
                      </span>
                    )}
                  </li>
                ))}
                {discounts.map((d) => (
                  <li key={d.id} className="text-sm text-neutral-800">
                    <span className="font-semibold">{d.title}</span>
                    <span className="text-emerald-800 ml-2">
                      {d.discountType === 'fixed'
                        ? `${d.currency || 'AED'} ${d.discountValue}`
                        : `${d.discountValue}%`}{' '}
                      off
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {!authLoading && !isLoggedInMember && hasMemberDiscounts ? (
            <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 sm:p-6">
              <h2 className="font-headline text-lg font-bold text-neutral-900 mb-2">
                Member pricing available
              </h2>
              <p className="text-sm text-neutral-500 mb-4">
                Sign in to see PB member discounts for this business.
              </p>
              <Link
                href={`/login?returnUrl=/directory/${businessId}`}
                className="inline-flex items-center justify-center min-h-[44px] px-5 py-3 bg-[#111] text-white rounded-lg text-sm font-semibold"
              >
                Sign in
              </Link>
            </section>
          ) : null}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-4 h-fit">
          <div className="border border-neutral-200 rounded-lg bg-white p-4 sm:p-5">
            <h2 className="font-bold text-neutral-900 mb-2">Company Overview</h2>
            <OverviewRow label="Company Name" value={business.name} />
            <OverviewRow label="Category" value={business.category || business.companyType} />
            <OverviewRow label="Location" value={business.location} />
            <OverviewRow
              label="Member Since"
              value={memberSince ? format(memberSince, 'dd MMM yyyy') : '—'}
            />
            <OverviewRow label="Company Size" value={business.teamSize || '—'} />
            <OverviewRow label="Open Jobs" value={String(activeJobs.length)} />
            <OverviewRow label="Events Listed" value={String(events.length)} />
            <OverviewRow
              label="Last Job Posted"
              value={lastJobPosted ? format(lastJobPosted, 'dd MMM yyyy') : '—'}
            />
            <OverviewRow label="Active Offers" value={String(activeOffers.length)} />
          </div>

          <a
            href="#jobs"
            className="flex w-full items-center justify-center min-h-[48px] rounded-lg bg-[#111] text-white text-sm font-semibold hover:bg-neutral-800"
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Job Available {activeJobs.length}
          </a>

          {websiteHref ? (
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center min-h-[48px] rounded-lg border border-neutral-300 bg-white text-neutral-900 text-sm font-semibold hover:bg-neutral-50"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Go to website
            </a>
          ) : null}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleConnect}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 bg-[#111] text-white rounded-lg text-sm font-semibold"
            >
              <UserPlus className="w-4 h-4" />
              {isLoggedInMember ? 'Connect' : 'Sign in to Connect'}
            </button>
            <button
              type="button"
              onClick={handleMessage}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 bg-white text-neutral-900 border border-neutral-300 rounded-lg text-sm font-semibold"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </button>
            {primaryPhone && isLoggedInMember ? (
              <a
                href={`tel:${primaryPhone.replace(/\s+/g, '')}`}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 bg-white text-neutral-900 border border-neutral-300 rounded-lg text-sm font-semibold"
              >
                <Phone className="w-4 h-4" />
                Call / Book
              </a>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
