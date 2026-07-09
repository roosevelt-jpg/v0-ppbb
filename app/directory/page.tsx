'use client'

import React from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { BusinessDirectorySection } from '@/components/marketplace/business-directory-section'

export default function DirectoryPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">Business Directory</h1>
          <p className="text-muted-foreground mt-2">Discover verified businesses in the Passive Blessings community.</p>
        </div>
        <BusinessDirectorySection />
      </main>
      <Footer />
    </div>
  )
}
