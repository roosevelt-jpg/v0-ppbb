import type { Metadata } from 'next'
import { ContactPageClient } from './contact-page-client'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Passive Blessings — questions, support, volunteer and partnership inquiries.',
}

export default function ContactPage() {
  return <ContactPageClient />
}
