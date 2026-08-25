'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Workshops are managed as Events with category Workshop (FEEDBACK_P1.2). */
export default function AdminWorkshopsRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/events')
  }, [router])

  return (
    <div className="p-8 text-sm text-neutral-600 dark:text-muted-foreground">
      Workshops are created under Events (use category Workshop). Redirecting…
    </div>
  )
}
