'use client'

import React from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { MarketplacePageCopy } from '@/components/marketplace/marketplace-page-copy'
import { MarketplaceOffersSection } from '@/components/marketplace/marketplace-offers-section'
import { BusinessDirectorySection } from '@/components/marketplace/business-directory-section'

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 w-full min-w-0 space-y-12 sm:space-y-16">
          <MarketplacePageCopy />
          <MarketplaceOffersSection />
          {/* Directory at end of page per FEEDBACK_P1.2 */}
          <BusinessDirectorySection />
        </div>
      </main>
      <Footer />
    </div>
  )
}
