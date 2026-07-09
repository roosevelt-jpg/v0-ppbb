'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Briefcase, MessageCircle, Phone, Tag, UserPlus } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/firebase'
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

interface BusinessProfileViewProps {
  businessId: string
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

  const handleConnect = () => {
    if (!isLoggedInMember) {
      router.push(`/login?returnUrl=/directory/${businessId}`)
      return
    }
    router.push(`/dashboard/messages?to=${businessId}`)
  }

  const handleMessage = () => {
    if (!isLoggedInMember) {
      router.push(`/login?returnUrl=/directory/${businessId}`)
      return
    }
    router.push(`/dashboard/messages?to=${businessId}`)
  }

  const activeOffers = useMemo(() => offers.filter(isActiveOffer), [offers])
  const activeJobs = useMemo(() => jobs.filter(isActiveJob), [jobs])
  const memberDiscounts = useMemo(
    () => activeOffers.filter((o) => o.isMemberDiscount),
    [activeOffers]
  )
  const hasMemberDiscounts = memberDiscounts.length > 0 || discounts.length > 0
  const salesOffers = useMemo(
    () =>
      activeOffers.filter(
        (o) =>
          o.type === 'product' ||
          o.type === 'service' ||
          o.type === 'sale' ||
          !o.type ||
          o.category.toLowerCase().includes('product') ||
          o.category.toLowerCase().includes('service')
      ),
    [activeOffers]
  )

  const galleryImages = useMemo(() => {
    const fromBusiness = business?.productImages || []
    const fromOffers = activeOffers.flatMap((o) => o.images).filter(Boolean)
    return Array.from(new Set([...fromBusiness, ...fromOffers]))
  }, [business, activeOffers])

  const primaryPhone =
    business?.phone ||
    activeOffers.find((o) => o.phone)?.phone ||
    ''

  const loading = !businessReady || !offersReady || !jobsReady || !discountsReady

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
        <div className="h-24 w-full bg-neutral-200 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-neutral-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (notFound || !business) {
    return (
      <div className="text-center py-16 px-4">
        <h1 className="font-headline text-3xl font-bold text-foreground mb-3">
          Business not found
        </h1>
        <p className="font-body text-muted-foreground mb-6 max-w-md mx-auto">
          This listing may be pending approval or no longer active.
        </p>
        <Link
          href="/marketplace"
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to marketplace
        </Link>
      </div>
    )
  }

  const initial = (business.name.trim().charAt(0) || 'B').toUpperCase()

  return (
    <div className="space-y-8 sm:space-y-10 min-w-0">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to marketplace
      </Link>

      {/* Banner + logo */}
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
            <div className="absolute inset-0 bg-[#f7f6f2]" />
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12 px-1 relative z-10">
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden bg-white border-4 border-white shadow-sm shrink-0">
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
          <div className="min-w-0 flex-1 pb-1">
            <p className="eyebrow text-muted-foreground mb-1">
              {business.category || 'Business'}
            </p>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold text-foreground break-words">
              {business.name}
            </h1>
            {business.ownerName && (
              <p className="font-body text-sm text-muted-foreground mt-1">
                {business.ownerName}
              </p>
            )}
          </div>
        </div>
      </div>

      {business.description && (
        <div className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl break-words">
          <RichTextContent html={business.description} />
        </div>
      )}

      {business.services.length > 0 && (
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
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <button
          type="button"
          onClick={handleConnect}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800"
        >
          <UserPlus className="w-4 h-4" />
          {isLoggedInMember ? 'Connect' : 'Sign in to Connect'}
        </button>
        <button
          type="button"
          onClick={handleMessage}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 bg-white text-black border border-[#e4e1da] rounded-lg font-body text-sm font-semibold hover:bg-neutral-50"
        >
          <MessageCircle className="w-4 h-4" />
          Message
        </button>
        {salesOffers.length > 0 && (
          primaryPhone ? (
            <a
              href={`tel:${primaryPhone.replace(/\s+/g, '')}`}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800"
            >
              <Phone className="w-4 h-4" />
              Call / Book
            </a>
          ) : (
            <a
              href="#listings"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800"
            >
              <Tag className="w-4 h-4" />
              Call / Book
            </a>
          )
        )}
        {activeJobs.length > 0 && (
          <a
            href="#jobs"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 bg-white text-black border border-[#e4e1da] rounded-lg font-body text-sm font-semibold hover:bg-neutral-50"
          >
            <Briefcase className="w-4 h-4" />
            Apply
          </a>
        )}
      </div>

      {/* Gallery */}
      {galleryImages.length > 0 && (
        <section>
          <h2 className="font-headline text-2xl font-bold text-foreground mb-4">
            Products &amp; services
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {galleryImages.map((url) => (
              <div
                key={url}
                className="relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Member discounts — logged-in only */}
      {!authLoading && isLoggedInMember && hasMemberDiscounts && (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 sm:p-6">
          <p className="eyebrow text-emerald-800 mb-2">MEMBER DISCOUNTS</p>
          <h2 className="font-headline text-2xl font-bold text-foreground mb-4">
            Exclusive for members
          </h2>
          <ul className="space-y-3">
            {memberDiscounts.map((offer) => (
              <li key={offer.id} className="font-body text-sm sm:text-base text-foreground">
                <span className="font-semibold">{offer.title}</span>
                {(offer.discountPercentage || offer.memberBenefit) && (
                  <span className="text-emerald-800 ml-2">
                    {offer.discountPercentage || offer.memberBenefit}% off
                  </span>
                )}
                {offer.description && (
                  <p className="text-muted-foreground mt-0.5">{offer.description}</p>
                )}
              </li>
            ))}
            {discounts.map((d) => (
              <li key={d.id} className="font-body text-sm sm:text-base text-foreground">
                <span className="font-semibold">{d.title}</span>
                <span className="text-emerald-800 ml-2">
                  {d.discountType === 'fixed' ? `${d.currency || 'AED'} ${d.discountValue}` : `${d.discountValue}%`} off
                </span>
                {d.discountCode && (
                  <span className="ml-2 text-xs font-mono bg-white px-2 py-0.5 rounded border">{d.discountCode}</span>
                )}
                {d.description && <p className="text-muted-foreground mt-0.5">{d.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!authLoading && !isLoggedInMember && hasMemberDiscounts && (
        <section className="rounded-lg border border-[#e4e1da] bg-[#f7f6f2] p-4 sm:p-6">
          <p className="eyebrow text-muted-foreground mb-2">MEMBER DISCOUNTS</p>
          <h2 className="font-headline text-xl font-bold text-foreground mb-2">
            Member pricing available
          </h2>
          <p className="font-body text-sm text-muted-foreground mb-4">
            Sign in to see PB member discounts for this business.
          </p>
          <Link
            href={`/login?returnUrl=/directory/${businessId}`}
            className="inline-flex items-center justify-center min-h-[44px] px-5 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800"
          >
            Sign in
          </Link>
        </section>
      )}

      {/* All listings */}
      <section id="listings" className="space-y-6 scroll-mt-24">
        <h2 className="font-headline text-2xl sm:text-3xl font-bold text-foreground">
          Listings
        </h2>

        {activeOffers.length === 0 && activeJobs.length === 0 ? (
          <p className="font-body text-muted-foreground">
            No active listings from this business yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {activeOffers.map((offer) => (
              <article
                key={offer.id}
                className="border border-[#e4e1da] rounded-lg overflow-hidden bg-white flex flex-col"
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
                    <span className="inline-flex px-2 py-1 rounded bg-neutral-100 text-xs font-body font-semibold capitalize">
                      {offer.type || offer.category || 'Offer'}
                    </span>
                    {offer.isMemberDiscount && (
                      <span className="inline-flex px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-body font-semibold">
                        Member discount
                      </span>
                    )}
                  </div>
                  <h3 className="font-headline text-lg font-bold text-foreground break-words">
                    {offer.title}
                  </h3>
                  {offer.description && (
                    <p className="font-body text-sm text-muted-foreground line-clamp-3">
                      {offer.description}
                    </p>
                  )}
                  {typeof offer.price === 'number' && (
                    <p className="font-body font-semibold mt-auto pt-2">
                      AED {offer.price}
                      {typeof offer.originalPrice === 'number' && offer.originalPrice > offer.price ? (
                        <span className="ml-2 text-neutral-400 line-through font-normal text-sm">
                          AED {offer.originalPrice}
                        </span>
                      ) : null}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {activeJobs.length > 0 && (
        <section id="jobs" className="space-y-4 scroll-mt-24">
          <h2 className="font-headline text-2xl font-bold text-foreground">Open roles</h2>
          <div className="space-y-3">
            {activeJobs.map((job) => (
              <article
                key={job.id}
                className="border border-[#e4e1da] rounded-lg p-4 sm:p-5 bg-white"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-headline text-lg font-bold text-foreground break-words">
                      {job.title}
                    </h3>
                    {(job.jobType || job.category) && (
                      <p className="font-body text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                        {job.jobType || job.category}
                      </p>
                    )}
                    {job.description && (
                      <p className="font-body text-sm text-muted-foreground mt-2 line-clamp-3">
                        {job.description}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/opportunities/${job.id}`}
                    className="inline-flex shrink-0 items-center justify-center min-h-[44px] px-4 py-2 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800"
                  >
                    Apply
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
