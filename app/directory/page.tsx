'use client'

import React from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { BusinessDirectorySection } from '@/components/marketplace/business-directory-section'

export default function DirectoryPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <BusinessDirectorySection />
      </main>
      <Footer />
    </div>
  )
}
