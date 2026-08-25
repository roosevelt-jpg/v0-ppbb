'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useRouter } from 'next/navigation'

/** Partnership admin inbox consolidated into Contact Submissions. */
export default function AdminPartnershipsRedirectPage() {
  const router = useRouter()

  React.useEffect(() => {
    router.replace('/admin/contact-submissions?category=partnership')
  }, [router])

  return (
    <div className="p-8 text-center text-sm text-neutral-500 dark:text-muted-foreground">
      Redirecting to Contact Submissions → Sponsorship / Partnership Inquiries…
    </div>
  )
}
