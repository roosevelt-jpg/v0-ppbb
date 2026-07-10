'use client'

import React from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PartnersPageCopy } from '@/components/partners/partners-page-copy'

export function PartnersPageClient() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 w-full min-w-0">
          <PartnersPageCopy />
        </div>
      </main>
      <Footer />
    </div>
  )
}
