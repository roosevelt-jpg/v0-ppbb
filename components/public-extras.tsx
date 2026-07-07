'use client'

import { usePathname } from 'next/navigation'
import { WhatsAppButton } from '@/components/whatsapp-button'

const HIDDEN_PREFIXES = ['/dashboard', '/admin', '/business', '/sponsor']

export function PublicExtras() {
  const pathname = usePathname()

  const isPublicPage = !HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (!isPublicPage) return null

  return <WhatsAppButton />
}
