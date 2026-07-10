'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Part 10A — Recordings removed from member dashboard; redirect away. */
export default function MemberRecordingsRemoved() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard')
  }, [router])
  return (
    <div className="p-8 text-sm text-neutral-500" style={{ fontFamily: 'Inter, sans-serif' }}>
      Recordings are not available in the member dashboard. Redirecting…
    </div>
  )
}
