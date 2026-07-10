import React, { Suspense } from 'react'
import { MarketplaceOfferDetail } from '@/components/marketplace/marketplace-offer-detail'

export default function MarketplaceOfferDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-neutral-500">Loading…</div>}>
      <MarketplaceOfferDetail />
    </Suspense>
  )
}
