'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useRouter } from 'next/navigation'

/**
 * Sponsors are Business Members, not a third user type.
 * Directory listing → Business Members; sponsor requests → Sponsor Inquiries.
 */
export default function AdminSponsorsRedirectPage() {
  const router = useRouter()

  React.useEffect(() => {
    router.replace('/admin/contact-submissions?category=partnership')
  }, [router])

  return (
    <div className="p-8 text-center text-sm text-neutral-500 dark:text-muted-foreground">
      Redirecting to Sponsor Inquiries… Sponsors are business members; requests are handled in
      inquiries, not a separate user tab.
    </div>
  )
}
