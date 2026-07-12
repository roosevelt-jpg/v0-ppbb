'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * /join is the public "Join the community" entry.
 * Membership packages are step 1 of the signup flow.
 */
function JoinRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const type = searchParams.get('type')
    const plan = searchParams.get('plan')
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (plan) params.set('plan', plan)
    const qs = params.toString()
    router.replace(qs ? `/signup?${qs}` : '/signup')
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f6f2] text-neutral-500 text-sm">
      Loading membership options…
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f7f6f2] text-neutral-500 text-sm">
          Loading…
        </div>
      }
    >
      <JoinRedirect />
    </Suspense>
  )
}
