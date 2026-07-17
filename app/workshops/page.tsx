'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Workshops live under Events (FEEDBACK_P1.2). */
export default function WorkshopsRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/events?category=workshop')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Workshops are listed under Events…</p>
    </div>
  )
}
