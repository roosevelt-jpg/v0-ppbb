'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { BusinessProfileView } from '@/components/marketplace/business-profile-view'

export default function DirectoryBusinessPage() {
  const params = useParams()
  const businessId = typeof params?.businessId === 'string' ? params.businessId : ''

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 w-full min-w-0">
          {businessId ? (
            <BusinessProfileView businessId={businessId} />
          ) : (
            <p className="font-body text-muted-foreground">Invalid business link.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
