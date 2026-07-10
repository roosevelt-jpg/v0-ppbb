'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { MemberSidebar, MemberHeader } from '@/components/member-layout'
import { DashboardErrorBoundary } from '@/components/dashboard-error-boundary'
import {
  hasAdminAccess,
  isMemberDashboardPathAllowed,
} from '@/lib/roles'
import { ContentProtection } from '@/components/content-protection'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/login')
      return
    }

    // Admins belong in the admin console for management surfaces
    if (hasAdminAccess(user) && pathname?.startsWith('/dashboard')) {
      // Allow admins to use member views for personal donations etc., but
      // block known admin-management URLs that must not sit under member UX.
      const blocked = [
        '/dashboard/recordings',
        '/dashboard/admin',
        '/dashboard/security',
        '/dashboard/audit',
      ]
      if (blocked.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
        router.replace('/admin')
        return
      }
    }

    // Part 10A — basic members (and everyone else in this layout) may only open allowlisted paths
    if (!isMemberDashboardPathAllowed(pathname)) {
      router.replace('/dashboard')
    }
  }, [loading, user, pathname, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (!isMemberDashboardPathAllowed(pathname)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-neutral-500">Redirecting…</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background min-w-0">
      <MemberSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <main className="flex-1 min-w-0 overflow-auto flex flex-col">
        <MemberHeader open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="flex-1 min-w-0 overflow-auto" data-dashboard-surface="light">
          <ContentProtection>
            <DashboardErrorBoundary key={pathname}>{children}</DashboardErrorBoundary>
          </ContentProtection>
        </div>
      </main>
    </div>
  )
}
