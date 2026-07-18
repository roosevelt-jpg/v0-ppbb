'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Minus, Plus, ShoppingCart, Tag, Trash2, X } from 'lucide-react'
import type { BusinessOffer } from '@/lib/types'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardErrorState,
  DashboardEmptyState,
} from '@/components/dashboard-states'
import { subscribeToMarketplaceOffers, filterMarketplaceOffers } from '@/lib/member-dashboard'
import {
  OFFER_MARKETPLACE_TABS,
  type OfferMarketplaceTabId,
} from '@/lib/offer-categories'
import { BusinessDirectorySection } from '@/components/marketplace/business-directory-section'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'

type CartItem = {
  key: string
  productId: string
  title: string
  businessName: string
  price: number
  imageUrl?: string
  qty: number
}

function cartKeyFor(product: BusinessOffer): string {
  if (product.id) return String(product.id)
  return `${product.businessId || product.businessName || 'biz'}:${product.title || 'item'}`
}

function unitPrice(product: BusinessOffer): number {
  const price = Number(product.price) || 0
  if (product.discountPercentage && product.originalPrice) {
    return product.originalPrice * (1 - product.discountPercentage / 100)
  }
  return price
}

export default function MarketplacePage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<BusinessOffer[]>([])
  const [filter, setFilter] = useState<OfferMarketplaceTabId | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  const isBusinessMember = hasBusinessAccess(user)

  useEffect(() => {
    const unsubscribe = subscribeToMarketplaceOffers(
      (rows) => {
        setProducts(rows)
        setLoading(false)
        setError(null)
      },
      (msg) => {
        console.error('[v0] Marketplace error:', msg)
        setError('Failed to load marketplace.')
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const filtered = useMemo(() => filterMarketplaceOffers(products, filter), [products, filter])

  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  const handleAddToCart = (product: BusinessOffer) => {
    const key = cartKeyFor(product)
    setCart((prev) => {
      if (prev.some((item) => item.key === key)) return prev
      return [
        ...prev,
        {
          key,
          productId: String(product.id || key),
          title: product.title || 'Product',
          businessName: product.businessName || '',
          price: unitPrice(product),
          imageUrl: product.imageUrl || product.image?.url,
          qty: 1,
        },
      ]
    })
    setCartOpen(true)
  }

  const updateQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.key === key ? { ...item, qty: Math.max(0, item.qty + delta) } : item
        )
        .filter((item) => item.qty > 0)
    )
  }

  const handleRemoveFromCart = (key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key))
  }

  const clearCart = () => {
    setCart([])
    setCartOpen(false)
  }

  const inCart = (product: BusinessOffer) => cart.some((c) => c.key === cartKeyFor(product))

  if (loading) return <DashboardSkeleton />
  if (error) return <DashboardErrorState message={error} />

  return (
    <DashboardPageShell title="Marketplace" subtitle="Products, services, and the business directory">
      <div className={`space-y-12 ${cart.length > 0 ? 'pb-40' : ''}`}>
        <div className="flex flex-wrap justify-end gap-2">
          {cart.length > 0 ? (
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold"
            >
              <ShoppingCart size={16} />
              Cart ({itemCount})
            </button>
          ) : null}
          {/* Already on member marketplace — never send business members back to join packages */}
          <Link
            href={isBusinessMember ? '/business/dashboard' : '/business/signup'}
            className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 bg-white text-black border border-neutral-300 rounded-lg text-sm font-semibold hover:bg-neutral-50"
          >
            {isBusinessMember ? 'Business portal' : 'List your business'}
          </Link>
        </div>

        {/* Same filters as public /marketplace offers */}
        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Products & services</p>
            <h2 className="text-xl font-bold text-neutral-900">Community marketplace</h2>
            <p className="text-sm text-neutral-600 mt-1">
              Filter by type (Product / Service) or industry — discounts are not a category.
            </p>
          </div>

          <div className="w-full overflow-x-auto pb-1">
            <div className="flex gap-2 min-w-max sm:flex-wrap">
              {OFFER_MARKETPLACE_TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`min-h-[44px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap ${
                    filter === item.id
                      ? 'bg-black text-white'
                      : 'bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <DashboardEmptyState
              title="No listings in this filter"
              description="Try Products, Services, or another industry category."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((product) => {
                const imageUrl = product.imageUrl || product.image?.url
                const price = Number(product.price) || 0
                const discounted = unitPrice(product)
                const alreadyInCart = inCart(product)
                return (
                  <Card
                    key={product.id || cartKeyFor(product)}
                    className="overflow-hidden border border-neutral-200 flex flex-col"
                  >
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={product.title}
                        className="w-full aspect-[4/3] object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-[4/3] bg-neutral-100 flex items-center justify-center">
                        <Tag className="w-10 h-10 text-neutral-300" />
                      </div>
                    )}
                    <div className="p-4 flex flex-col flex-1">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-neutral-100 text-neutral-700 w-fit capitalize mb-2">
                        {product.type || 'Product'}
                      </span>
                      <h3 className="font-bold text-neutral-900 line-clamp-2">{product.title}</h3>
                      <p className="text-sm text-neutral-500 mt-1">{product.businessName}</p>
                      {product.description ? (
                        <p className="text-sm text-neutral-600 mt-2 line-clamp-2 flex-1">
                          {product.description}
                        </p>
                      ) : (
                        <div className="flex-1" />
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="font-bold text-lg text-neutral-900">
                          AED {discounted.toLocaleString()}
                        </span>
                        {product.discountPercentage ? (
                          <span className="text-xs line-through text-neutral-400">
                            AED {price.toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Link
                          href={product.id ? `/marketplace/${product.id}` : '#'}
                          className="flex-1 min-h-[44px] inline-flex items-center justify-center bg-white text-black border border-neutral-300 px-3 py-2 rounded-lg text-sm font-semibold"
                        >
                          View Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 min-h-[44px] bg-black text-white px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-1"
                        >
                          <ShoppingCart size={14} />
                          {alreadyInCart ? 'View cart' : 'Buy Now'}
                        </button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        {/* Same business directory as public /marketplace */}
        <BusinessDirectorySection />
      </div>

      {cart.length > 0 ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button type="button" onClick={() => setCartOpen((o) => !o)} className="text-left">
              <p className="text-sm text-neutral-500">
                {itemCount} item{itemCount === 1 ? '' : 's'} in cart
                {cartOpen ? ' · hide' : ' · tap to manage'}
              </p>
              <p className="text-2xl font-bold text-neutral-900">
                AED {totalPrice.toLocaleString()}
              </p>
            </button>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="min-h-[44px] px-4 py-2 border border-neutral-300 rounded-lg text-sm font-semibold"
              >
                Manage cart
              </button>
              <button
                type="button"
                className="min-h-[44px] bg-black text-white px-6 py-2 rounded-lg text-sm font-semibold"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>

          {cartOpen ? (
            <div className="max-w-7xl mx-auto px-4 pb-4 border-t border-neutral-100">
              <div className="flex items-center justify-between py-3">
                <h3 className="font-semibold text-neutral-900">Your cart</h3>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Clear all
                  </button>
                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="p-2 rounded-lg hover:bg-neutral-100"
                    aria-label="Close cart"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <ul className="divide-y divide-neutral-200 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <li key={item.key} className="py-3 flex items-center gap-3">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-14 h-14 rounded-lg object-cover border border-neutral-200 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-neutral-100 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-900 truncate">{item.title}</p>
                      <p className="text-xs text-neutral-500 truncate">{item.businessName}</p>
                      <p className="text-sm font-semibold mt-0.5">
                        AED {(item.price * item.qty).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQty(item.key, -1)}
                        className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center border border-neutral-300 rounded-lg"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.key, 1)}
                        className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center border border-neutral-300 rounded-lg"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item.key)}
                      className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                      aria-label={`Remove ${item.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </DashboardPageShell>
  )
}
