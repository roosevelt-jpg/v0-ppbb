'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { BusinessFeatureLink } from '@/components/business-feature-gate'
import { ShoppingCart, Tag } from 'lucide-react'
import type { BusinessOffer } from '@/lib/types'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardErrorState,
  DashboardEmptyState,
} from '@/components/dashboard-states'
import { subscribeToMarketplaceOffers, filterMarketplaceOffers } from '@/lib/member-dashboard'

export default function MarketplacePage() {
  const [products, setProducts] = useState<BusinessOffer[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cart, setCart] = useState<Array<BusinessOffer & { cartId: number }>>([])

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

  const handleAddToCart = (product: BusinessOffer) => {
    setCart((prev) => {
      if (prev.some((item) => item.id === product.id)) {
        return prev
      }
      return [...prev, { ...product, cartId: Date.now(), qty: 1 }]
    })
  }

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const totalPrice = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0)

  if (loading) return <DashboardSkeleton />
  if (error) return <DashboardErrorState message={error} />

  return (
    <DashboardPageShell title="Marketplace" subtitle="Member offers from community businesses">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card className="p-4 border border-neutral-200 sticky top-4">
            <h3 className="font-bold mb-4 text-neutral-900">Categories</h3>
            <div className="space-y-2">
              {['all', 'merchandise', 'books', 'courses', 'technology', 'hr', 'retail', 'other'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilter(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === cat
                      ? '!bg-black !text-white'
                      : '!bg-white !text-black border border-gray-300 hover:bg-neutral-50'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="md:col-span-3 space-y-4 min-w-0">
          <div className="flex justify-end">
            <BusinessFeatureLink
              featureLabel="List Your Business"
              href="/join?type=business"
              className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 !bg-white !text-black border border-neutral-300 rounded-lg text-sm font-semibold hover:bg-neutral-50"
            >
              List Your Business
            </BusinessFeatureLink>
          </div>

          {filtered.length === 0 ? (
            <DashboardEmptyState title="No products in this category" description="Try another category or check back later." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((product) => {
                const imageUrl = product.imageUrl || product.image?.url
                const price = Number(product.price) || 0
                const discounted =
                  product.discountPercentage && product.originalPrice
                    ? product.originalPrice * (1 - product.discountPercentage / 100)
                    : price
                return (
                  <Card key={product.id} className="overflow-hidden border border-neutral-200 flex flex-col">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt={product.title} className="w-full aspect-[4/3] object-cover" />
                    ) : (
                      <div className="w-full aspect-[4/3] bg-neutral-100 flex items-center justify-center">
                        <Tag className="w-10 h-10 text-neutral-300" />
                      </div>
                    )}
                    <div className="p-4 flex flex-col flex-1">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-neutral-100 text-neutral-700 w-fit capitalize mb-2">
                        {product.category || product.type}
                      </span>
                      <h3 className="font-bold text-neutral-900 line-clamp-2">{product.title}</h3>
                      <p className="text-sm text-neutral-500 mt-1">{product.businessName}</p>
                      {product.description ? (
                        <p className="text-sm text-neutral-600 mt-2 line-clamp-2 flex-1">{product.description}</p>
                      ) : (
                        <div className="flex-1" />
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="font-bold text-lg text-neutral-900">AED {discounted.toLocaleString()}</span>
                        {product.discountPercentage ? (
                          <>
                            <span className="text-xs line-through text-neutral-400">AED {price.toLocaleString()}</span>
                            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                              {product.discountPercentage}% OFF
                            </span>
                          </>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <button type="button" className="flex-1 !bg-black !text-white px-3 py-2 rounded-lg text-sm font-semibold">
                          View Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          disabled={cart.some((c) => c.id === product.id)}
                          className="flex-1 !bg-black !text-white px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-60"
                        >
                          <ShoppingCart size={14} />{' '}
                          {cart.some((c) => c.id === product.id) ? 'In cart' : 'Buy Now'}
                        </button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {cart.length > 0 ? (
        <Card className="p-4 mt-6 border border-neutral-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-neutral-500">{cart.length} items in cart</p>
              <p className="text-2xl font-bold text-neutral-900">AED {totalPrice.toLocaleString()}</p>
            </div>
            <button type="button" className="!bg-black !text-white px-6 py-2 rounded-lg text-sm font-semibold">
              Proceed to Checkout
            </button>
          </div>
          <ul className="divide-y divide-neutral-200">
            {cart.map((item) => (
              <li key={item.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-neutral-900 truncate">{item.title}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFromCart(item.id)}
                  className="text-red-600 hover:underline shrink-0"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </DashboardPageShell>
  )
}
