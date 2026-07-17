'use client'

import React, { Suspense } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { OpportunitiesList } from '@/components/opportunities-list'

function OpportunitiesLoading() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 bg-neutral-100 rounded-lg animate-pulse" />
      ))}
    </div>
  )
}

export default function OpportunitiesPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-foreground text-balance">
              Jobs &amp; Opportunities
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Discover jobs, internships, gigs, and volunteer roles. Use the filters below to search
              by location, role type, work type, and industry — then apply when signed in.
            </p>
          </div>
          <Suspense fallback={<OpportunitiesLoading />}>
            <OpportunitiesList />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
