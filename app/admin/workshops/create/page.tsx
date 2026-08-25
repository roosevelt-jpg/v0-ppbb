'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminWorkshopsCreateRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/events/create')
  }, [router])

  return (
    <div className="p-8 text-sm text-neutral-600 dark:text-muted-foreground">
      Create a Workshop via Events → use category Workshop. Redirecting…
    </div>
  )
}
