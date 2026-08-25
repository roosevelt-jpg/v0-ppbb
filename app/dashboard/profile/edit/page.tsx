'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * This used to be a second, independently-built profile-edit form that had
 * drifted out of sync with /dashboard/profile — different fields, different
 * save logic. Consolidated into the one at /dashboard/profile (which now
 * covers everything this page had), so this just sends people there.
 */
export default function ProfileEditPageRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/profile')
  }, [router])
  return (
    <div className="p-8 text-sm text-neutral-500 dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
      Redirecting…
    </div>
  )
}
