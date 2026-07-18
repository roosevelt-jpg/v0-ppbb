'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Search, ShoppingBag } from 'lucide-react'
import {
  isActiveOffer,
  subscribeToAllOffers,
  type DirectoryOffer,
} from '@/lib/marketplace-directory'
import {
  OFFER_MARKETPLACE_TABS,
  matchesOfferMarketplaceTab,
  type OfferMarketplaceTabId,
} from '@/lib/offer-categories'
import { useAuth } from '@/lib/auth-context'

const OFFER_TABS = OFFER_MARKETPLACE_TABS

type OfferTab = OfferMarketplaceTabId

function matchesTab(offer: DirectoryOffer, tab: OfferTab): boolean {
  return matchesOfferMarketplaceTab(offer, tab)
}

function OfferCardSkeleton() {
  return (
    <div className="bg-white border border-[#e4e1da] rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-[16/10] bg-neutral-200" />
      <div className="p-3 space-y-1.5">
        <div className="h-3 bg-neutral-200 rounded w-2/3" />
        <div className="h-4 bg-neutral-200 rounded w-4/5" />
        <div className="h-3 bg-neutral-100 rounded w-1/3" />
        <div className="h-8 bg-neutral-200 rounded w-full mt-2" />
      </div>
    </div>
  )
}

export function MarketplaceOffersSection() {
  const { user } = useAuth()
  const [offers, setOffers] = useState<DirectoryOffer[]>([])
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<OfferTab>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [shopOpen, setShopOpen] = useState(true)
  const [visibleCount, setVisibleCount] = useState(12)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(
    () =>
      subscribeToAllOffers((data) => {
        setOffers(data.filter(isActiveOffer))
        setReady(true)
      }),
    []
  )

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase()
    return offers
      .filter((o) => matchesTab(o, tab))
      .filter((o) => {
        if (!term) return true
        const blob = [o.title, o.description, o.category, o.type, o.businessId].join(' ').toLowerCase()
        return blob.includes(term)
      })
  }, [offers, tab, debouncedSearch])

  const visible = filtered.slice(0, visibleCount)

  return (
    <section className="min-w-0 space-y-6">
      <div>
        <p className="eyebrow text-muted-foreground mb-2">MARKETPLACE</p>
        <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
          Community Marketplace
        </h2>
        <p className="font-body text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl">
          Discover products and services from community businesses. Support local partners and grow together.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search marketplace…"
          className="w-full min-h-[44px] pl-12 pr-4 py-3 border border-[#e4e1da] rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
        />
      </div>

      <div className="w-full overflow-x-auto pb-1">
        <div className="flex gap-2 min-w-max sm:flex-wrap">
          {OFFER_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              data-dashboard-control
              onClick={() => {
                setTab(item.id)
                setVisibleCount(12)
              }}
              className={`min-h-[44px] px-4 py-2 rounded-lg font-body text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap ${
                tab === item.id
                  ? 'bg-black text-white'
                  : 'bg-white text-foreground border border-[#e4e1da] hover:bg-neutral-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-[#e4e1da]">
        <button
          type="button"
          data-dashboard-control
          onClick={() => setShopOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-black text-white font-semibold text-sm min-h-[44px]"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag size={18} />
            SHOP
          </span>
          <ChevronDown className={`transition-transform ${shopOpen ? 'rotate-180' : ''}`} size={18} />
        </button>

        {shopOpen && (
          <div className="p-4 sm:p-6 bg-[#faf9f7]">
            {!ready ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <OfferCardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="font-body text-muted-foreground">
                  No listings in this category yet. Check back soon.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {visible.map((offer) => (
                    <article
                      key={offer.id}
                      className="bg-white border border-[#e4e1da] rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                    >
                      <div className="relative aspect-[16/10] bg-neutral-100 shrink-0">
                        {offer.imageURL ? (
                          <img
                            src={offer.imageURL}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
                            No image
                          </div>
                        )}
                        {offer.isMemberDiscount && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded">
                            {offer.discountPercentage || offer.memberBenefit || ''}% OFF
                          </span>
                        )}
                        {(offer.genderRestriction === 'ladies-only' ||
                          offer.genderRestriction === 'female' ||
                          offer.genderRestriction === 'women-only') && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-pink-600 text-white text-[10px] font-bold rounded">
                            Ladies only
                          </span>
                        )}
                        {(offer.genderRestriction === 'men-only' || offer.genderRestriction === 'male') && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-blue-700 text-white text-[10px] font-bold rounded">
                            Men only
                          </span>
                        )}
                        {offer.isMemberOnly && !user && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="px-3 py-1 bg-white text-black text-xs font-bold rounded">
                              Members only
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col gap-1 flex-1">
                        <p className="text-[11px] text-neutral-500 leading-snug">
                          <span className="capitalize">{offer.type || offer.category}</span>
                          {offer.businessName ? (
                            <>
                              {' '}
                              <span className="text-neutral-400">·</span>{' '}
                              <span className="font-medium text-neutral-700">by {offer.businessName}</span>
                            </>
                          ) : null}
                        </p>
                        <h3 className="font-semibold text-sm text-foreground line-clamp-1 leading-snug">
                          {offer.title}
                        </h3>
                        <p className="text-sm font-medium text-neutral-900">
                          {offer.price != null ? `AED ${offer.price}` : 'Contact for price'}
                        </p>
                        {offer.isMemberDiscount && !user && (
                          <p className="text-[11px] text-amber-700">Sign in to see member prices</p>
                        )}
                        {offer.isMemberOnly && !user && (
                          <p className="text-[11px] text-neutral-600">Sign in to access this listing</p>
                        )}
                        <Link
                          href={`/marketplace/${offer.id}`}
                          className="mt-1.5 block w-full text-center min-h-[36px] py-2 !bg-black !text-white rounded-lg text-xs font-semibold hover:bg-neutral-800"
                        >
                          {offer.isMemberOnly && !user ? 'Sign in to view' : 'View Details'}
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
                {visibleCount < filtered.length && (
                  <div className="text-center mt-8">
                    <button
                      type="button"
                      data-dashboard-control
                      onClick={() => setVisibleCount((c) => c + 12)}
                      className="min-h-[44px] px-6 py-2 bg-white border border-[#e4e1da] rounded-lg font-semibold text-sm text-[#111111] hover:bg-neutral-50"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
