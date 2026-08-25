'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import MembershipPage from '@/app/dashboard/membership/page'

/**
 * Business-portal membership / invoices / cancel renewal.
 * Reuses the member membership page UI inside the business shell.
 */
export default function BusinessMembershipPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (loading) return
    if (!user || !hasBusinessAccess(user)) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return <div className="p-8 text-neutral-500 dark:text-muted-foreground">Loading membership…</div>
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-neutral-950">
      <div className="bg-white dark:bg-card border-b border-[#e4e1da] dark:border-border px-4 py-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-foreground">Business membership</h1>
            <p className="text-sm text-neutral-600 dark:text-muted-foreground">
              Plan, renewal, invoices, and stop automatic renewal
            </p>
          </div>
          <Link
            href="/business/payments"
            className="text-sm underline text-neutral-700 dark:text-neutral-200 hover:text-black"
          >
            Marketplace payments →
          </Link>
        </div>
      </div>
      <MembershipPage />
    </div>
  )
}
