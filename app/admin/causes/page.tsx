'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy route — Charity Cases are managed at /admin/charity (charityCases collection). */
export default function DonationCausesRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/charity')
  }, [router])
  return (
    <div className="p-8 text-sm text-neutral-600 dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
      Redirecting to Charity Cases…
    </div>
  )
}
