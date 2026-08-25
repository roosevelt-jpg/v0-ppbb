'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'

/** Team create is inline on /admin/team — keep this route as a redirect. */
export default function AdminTeamCreateRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/team')
  }, [router])

  return (
    <AdminPageLayout title="Team Members">
      <p className="text-sm text-neutral-600 dark:text-muted-foreground">Redirecting to team management…</p>
    </AdminPageLayout>
  )
}
