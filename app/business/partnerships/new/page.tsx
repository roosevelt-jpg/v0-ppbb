'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'

/**
 * Business partnership requests use the same public partnership form fields
 * so inquiries arrive in a consistent format (FEEDBACK_P1.2).
 */
export default function BusinessPartnershipNewRedirect() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user || !hasBusinessAccess(user)) {
      router.replace('/login')
      return
    }
    router.replace('/partnerships/apply')
  }, [user, loading, router])

  return (
    <div className="p-8 text-sm text-neutral-600">
      Opening the shared partnership inquiry form…
    </div>
  )
}
