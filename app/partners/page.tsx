import type { Metadata } from 'next'
import { PartnersPageClient } from './partners-page-client'

export const metadata: Metadata = {
  title: 'Partners',
  description:
    'Partner with Passive Blessings — government, corporate, and grassroots collaborations that multiply community impact.',
}

export default function PartnersPage() {
  return <PartnersPageClient />
}
