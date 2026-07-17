'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Contact Requests consolidated into Contact Submissions (FEEDBACK_P1.2). */
export default function ContactRequestsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/contact-submissions')
  }, [router])
  return (
    <div className="p-8 text-sm text-neutral-600">
      Redirecting to Contact Submissions…
    </div>
  )
}
