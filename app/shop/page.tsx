'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import {
  subscribeToShopConfig,
  ShopPlatformConfig,
  DEFAULT_SHOP_CONFIG,
} from '@/lib/shop-config'
import {
  subscribeToPublishedMerch,
  ShopMerchProduct,
} from '@/lib/shop-merch'
import { ArrowRight, ShoppingBag } from 'lucide-react'

export default function ShopPage() {
  const [config, setConfig] = useState<ShopPlatformConfig>(DEFAULT_SHOP_CONFIG)
  const [products, setProducts] = useState<ShopMerchProduct[]>([])
  const [configLoaded, setConfigLoaded] = useState(false)
  const [productsLoaded, setProductsLoaded] = useState(false)

  useEffect(() => {
    const unsubConfig = subscribeToShopConfig((cfg) => {
      setConfig(cfg)
      setConfigLoaded(true)
    })
    const unsubProducts = subscribeToPublishedMerch((list) => {
      setProducts(list)
      setProductsLoaded(true)
    })
    const timeout = setTimeout(() => {
      setConfigLoaded(true)
      setProductsLoaded(true)
    }, 6000)
    return () => {
      unsubConfig()
      unsubProducts()
      clearTimeout(timeout)
    }
  }, [])

  const loading = !configLoaded || !productsLoaded
  const page = config.pageConfig

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      <Navbar />
      <main className="flex-1 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto w-full">
          {/* Hero */}
          <header className="text-center mb-10 sm:mb-12 max-w-2xl mx-auto">
            <p
              className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Merchandise
            </p>
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-neutral-200 rounded w-3/4 mx-auto" />
                <div className="h-4 bg-neutral-200 rounded w-full" />
              </div>
            ) : (
              <>
                <h1
                  className="text-3xl sm:text-4xl lg:text-5xl text-neutral-900 mb-4"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                >
                  {page.headline}
                </h1>
                <p
                  className="text-base sm:text-lg text-neutral-600 leading-relaxed"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {page.body}
                </p>
              </>
            )}
          </header>

          {/* Donate-via-purchase banner */}
          <section className="mb-10 sm:mb-14 w-full">
            {loading ? (
              <div className="h-36 sm:h-28 bg-neutral-200 rounded-lg animate-pulse" />
            ) : (
              <div className="relative overflow-hidden rounded-lg bg-neutral-900 text-white px-5 py-8 sm:px-10 sm:py-10">
                <div
                  className="absolute inset-0 opacity-30 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(ellipse at 20% 50%, rgba(180,140,90,0.35), transparent 55%), radial-gradient(ellipse at 90% 20%, rgba(255,255,255,0.08), transparent 40%)',
                  }}
                />
                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div className="max-w-xl">
                    <p
                      className="text-xs tracking-[0.2em] uppercase text-neutral-400 mb-2"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {page.donateBannerEyebrow}
                    </p>
                    <h2
                      className="text-2xl sm:text-3xl text-white"
                      style={{ fontFamily: 'Cormorant Garamond, serif' }}
                    >
                      {page.donateBannerHeadline}
                    </h2>
                  </div>
                  <Link
                    href={page.donateBannerCTAHref || '/transparency'}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 bg-white text-black px-6 py-2.5 rounded text-sm font-semibold hover:bg-neutral-100 shrink-0"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {page.donateBannerCTA}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* Product grid */}
          <section>
            <h2
              className="text-xl sm:text-2xl text-neutral-900 mb-6"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Collection
            </h2>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[4/5] bg-neutral-200 rounded-lg mb-3" />
                    <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-neutral-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div
                className="text-center py-16 px-4 bg-white border border-neutral-200 rounded-lg"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-700 font-medium mb-1">No merch published yet</p>
                <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto">
                  When an offer is created with category Merchandise and status Published, it will
                  appear here instantly.
                </p>
                <Link
                  href="/donate"
                  className="inline-flex min-h-[44px] items-center justify-center px-5 bg-black text-white text-sm font-semibold rounded hover:bg-neutral-900"
                >
                  Support a cause instead
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                {products.map((product) => (
                  <article
                    key={product.id}
                    className="bg-white border border-neutral-100 rounded-lg overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[4/5] bg-neutral-100 overflow-hidden">
                      {product.imageURL ? (
                        <img
                          src={product.imageURL}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-10 h-10 text-neutral-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <h3
                        className="text-lg text-neutral-900 mb-1"
                        style={{ fontFamily: 'Cormorant Garamond, serif' }}
                      >
                        {product.title}
                      </h3>
                      {product.variant ? (
                        <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
                          {product.variant}
                        </p>
                      ) : null}
                      <p className="text-sm font-semibold text-neutral-900 mt-auto">
                        {product.currency} {product.price.toLocaleString()}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
