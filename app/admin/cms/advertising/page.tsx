'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'

/**
 * Advertising admin lives under CMS → Volunteer & Ads (Homepage advertising tab).
 * Keep this route as a redirect so old bookmarks still work.
 */
export default function AdminAdvertisingPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/cms/volunteer')
  }, [router])

  return (
    <AdminPageLayout title="Advertising">
      <p className="text-sm text-neutral-600 dark:text-muted-foreground">
        Redirecting to Volunteer &amp; Ads → Homepage advertising…
      </p>
    </AdminPageLayout>
  )
}
