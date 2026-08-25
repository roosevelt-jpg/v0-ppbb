'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ContactRequestDetailRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/contact-submissions')
  }, [router])
  return (
    <div className="p-8 text-sm text-neutral-600 dark:text-muted-foreground">Redirecting to Contact Submissions…</div>
  )
}
