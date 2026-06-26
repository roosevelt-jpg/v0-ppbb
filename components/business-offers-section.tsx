'use client'

import React from 'react'
import { getAllActiveOffers } from '@/lib/business-queries'
import { BusinessOffer } from '@/lib/types'
import { Tag, Store } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  product: 'Product',
  service: 'Service',
  discount: 'Discount',
  promotion: 'Promotion',
}

export function BusinessOffersSection({ title = 'From Our Businesses' }: { title?: string }) {
  const [offers, setOffers] = React.useState<BusinessOffer[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    getAllActiveOffers()
      .then((data) => {
        if (active) setOffers(data)
      })
      .catch((err) => console.error('[v0] Failed to load business offers:', err))
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="mt-16 pt-12 border-t border-gray-200">
        <h2 className="text-3xl font-bold mb-8">{title}</h2>
        <p className="text-gray-500">Loading offers...</p>
      </div>
    )
  }

  if (offers.length === 0) return null

  return (
    <div className="mt-16 pt-12 border-t border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <Store className="w-6 h-6" />
        <h2 className="text-3xl font-bold">{title}</h2>
      </div>
      <p className="text-gray-600 mb-8">
        Products, services, and exclusive offers from community business partners
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {offers.map((offer) => {
          const imageUrl = offer.imageUrl || offer.image?.url
          return (
            <div
              key={offer.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={offer.title} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-gray-100">
                  <Tag className="w-10 h-10 text-gray-300" />
                </div>
              )}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-block bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 rounded capitalize">
                    {TYPE_LABELS[offer.type] || offer.type}
                  </span>
                  {offer.discountPercentage ? (
                    <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                      {offer.discountPercentage}% off
                    </span>
                  ) : null}
                </div>

                <h3 className="font-bold mb-1 line-clamp-2">{offer.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">{offer.description}</p>

                <div className="flex items-center justify-between mb-2">
                  {typeof offer.price === 'number' && offer.price > 0 ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold">AED {offer.price}</span>
                      {offer.originalPrice ? (
                        <span className="text-sm text-gray-400 line-through">
                          AED {offer.originalPrice}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-gray-700">See details</span>
                  )}
                </div>

                <p className="text-xs text-gray-500">by {offer.businessName}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
