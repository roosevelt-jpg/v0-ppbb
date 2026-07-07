'use client'

import React from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <p className="eyebrow text-muted-foreground mb-4">Pillar 05 — Partnerships &amp; Collaborations</p>
          <h1 className="font-headline text-4xl sm:text-5xl font-bold mb-4 text-foreground">
            Build alongside us.
          </h1>
          <p
            className="text-lg text-muted-foreground mb-8 leading-relaxed w-full"
            style={{ maxWidth: '42rem' }}
          >
            From governmental programmes to corporate sponsorships to grassroots collaborations —
            every partnership multiplies what we can do.
          </p>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed w-full" style={{ maxWidth: '42rem' }}>
            Full partners page content will be wired from the CMS in a future update.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-5 py-2.5 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Get in touch
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
