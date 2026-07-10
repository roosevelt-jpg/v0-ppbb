'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasAdminAccess } from '@/lib/roles'
import { canAccessAdminPath } from '@/lib/admin-invite-permissions'
import { AdminSidebar, adminMenuItems } from '@/components/admin-layout'
import { DashboardTopBar } from '@/components/dashboard-top-bar'
import { getAdminPageTitle, getWelcomeFirstName } from '@/lib/dashboard-page-titles'
import { logoutUser } from '@/lib/auth'
import { recordAdminAuditFromUser } from '@/lib/admin-audit'
import { getUserDisplayName } from '@/lib/user-profile'
import { ContentProtection } from '@/components/content-protection'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, firebaseUser, loading } = useAuth()

  const isSetupPage = pathname === '/admin/setup'
  const isLoginPage = pathname === '/admin/login'
  const isPublicAdminPage = isSetupPage || isLoginPage

  useEffect(() => {
    if (isPublicAdminPage) {
      return
    }

    if (!loading) {
      if (!firebaseUser) {
        const returnUrl = encodeURIComponent(pathname || '/admin')
        router.push(`/admin/login?returnUrl=${returnUrl}`)
        return
      }

      if (!user) {
        return
      }

      if (!hasAdminAccess(user)) {
        router.push('/dashboard')
        return
      }

      if (!canAccessAdminPath(user, pathname)) {
        router.push('/admin')
        return
      }
    }
  }, [user, firebaseUser, loading, router, isPublicAdminPage, pathname])

  // Audit: log significant admin page views (one per route change)
  useEffect(() => {
    if (isPublicAdminPage || loading || !user || !hasAdminAccess(user) || !pathname?.startsWith('/admin')) return
    recordAdminAuditFromUser(user, {
      actionType: 'page_view',
      action: `Viewed ${pathname}`,
      entityType: 'page',
      route: pathname,
      status: 'success',
    })
  }, [pathname, user?.id, isPublicAdminPage, loading])

  const handleLogout = async () => {
    if (user) {
      await recordAdminAuditFromUser(user, {
        actionType: 'logout',
        action: 'Admin logout',
        entityType: 'auth',
        status: 'success',
      })
    }
    await logoutUser()
    router.push('/admin/login')
  }

  // Display name only — email is shown inside profile quick-edit modal
  const displayName = user ? getUserDisplayName(user) : 'Admin'

  // Wait for Firebase Auth + Firestore profile before any admin route guard runs
  if (loading && !isPublicAdminPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (loading && isSetupPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Signed in but profile doc unavailable
  if (!loading && !isPublicAdminPage && firebaseUser && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md px-4">
          <p className="text-red-500 font-semibold text-lg">Profile not found</p>
          <p className="text-muted-foreground mt-2">
            Your account is signed in but no user profile was found. Contact support — do not create a new account.
          </p>
        </div>
      </div>
    )
  }

  // Authenticated non-admin only (never show this for signed-out visitors)
  if (!loading && !isPublicAdminPage && user && !hasAdminAccess(user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-red-500 font-semibold text-lg">Access Denied</p>
          <p className="text-muted-foreground mt-2">Admin role required to access this area.</p>
        </div>
      </div>
    )
  }

  // Scoped admin blocked from this specific route (redirect runs in useEffect)
  if (!loading && !isPublicAdminPage && user && hasAdminAccess(user) && !canAccessAdminPath(user, pathname)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting…</p>
        </div>
      </div>
    )
  }

  // Still resolving auth
  if (!loading && !isPublicAdminPage && !firebaseUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to admin sign in…</p>
        </div>
      </div>
    )
  }

  if (isPublicAdminPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        {children}
      </div>
    )
  }

  const adminTitleRoutes = adminMenuItems.map((item) => ({
    href: item.href,
    title: item.label,
  }))
  const pageTitle = getAdminPageTitle(pathname || '/admin', adminTitleRoutes)
  const welcome = user ? `Welcome, ${getWelcomeFirstName(displayName)}!` : undefined

  // For other admin pages, render with sidebar
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <DashboardTopBar
          title={pageTitle}
          welcome={welcome}
          onLogout={handleLogout}
          logoutLabel="Logout"
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background" data-dashboard-surface="light">
          <ContentProtection>
            <div className="p-4 sm:p-6 lg:p-8 max-w-[80rem] mx-auto w-full min-w-0">
              {children}
            </div>
          </ContentProtection>
        </main>
      </div>
    </div>
  )
}

