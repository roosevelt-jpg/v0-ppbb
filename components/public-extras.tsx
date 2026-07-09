'use client'

import { usePathname } from 'next/navigation'
import { WhatsAppButton } from '@/components/whatsapp-button'
import { isDashboardRoute } from '@/lib/dashboard-routes'

export function PublicExtras() {
  const pathname = usePathname()

  if (isDashboardRoute(pathname)) return null

  return <WhatsAppButton />
}
