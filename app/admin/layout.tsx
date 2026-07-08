'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasAdminAccess } from '@/lib/roles'
import { canAccessAdminPath } from '@/lib/admin-invite-permissions'
import { AdminSidebar } from '@/components/admin-layout'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSelector } from '@/components/language-selector'
import { ProfileMenuButton } from '@/components/profile-quick-edit'
import { LogOut } from 'lucide-react'
import { logoutUser } from '@/lib/auth'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, firebaseUser, loading } = useAuth()
  const [currentDateTime, setCurrentDateTime] = useState<string>('')

  // Public admin auth pages — no dashboard shell or route guard
  const isSetupPage = pathname === '/admin/setup'
  const isLoginPage = pathname === '/admin/login'
  const isPublicAdminPage = isSetupPage || isLoginPage

  // Update date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }
      setCurrentDateTime(now.toLocaleDateString('en-US', options))
    }

    updateDateTime()
    const interval = setInterval(updateDateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Skip auth check for invite setup and admin login pages
    if (isPublicAdminPage) {
      return
    }

    // Only redirect if NOT loading and user doesn't have proper access
    // Don't redirect WHILE loading - allow the loading state to show
    if (!loading) {
      // Not signed in — admin-specific login (never generic /login)
      if (!firebaseUser) {
        const returnUrl = encodeURIComponent(pathname || '/admin')
        router.push(`/admin/login?returnUrl=${returnUrl}`)
        return
      }

      // Signed in but Firestore profile missing (do not send to account creation)
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
    
    // User is authenticated and is an admin or super admin - allow access
    // Or we're still loading and waiting for auth check
  }, [user, firebaseUser, loading, router, isPublicAdminPage, pathname])

  const handleLogout = async () => {
    await logoutUser()
    router.push('/admin/login')
  }

  // Get user's first name or display email as fallback
  const displayName = user && 'firstName' in user ? user.firstName || (user as any).email : (user as any)?.email || 'Admin'

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

  // For other admin pages, render with sidebar
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header
          className="min-h-16 border-b flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-0"
          style={{ borderColor: '#e4e1da' }}
        >
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <div className="flex flex-col min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-foreground truncate">
                {displayName}
              </h2>
              <p className="text-xs text-muted-foreground hidden sm:block truncate">{currentDateTime}</p>
            </div>
            <span
              className="hidden md:inline-flex px-3 py-1 text-xs font-medium rounded-full flex-shrink-0"
              style={{ backgroundColor: '#f0ede8', color: '#666' }}
            >
              {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <LanguageSelector />
            <ThemeToggle />
            <ProfileMenuButton />
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[80rem] mx-auto w-full min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

