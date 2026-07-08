'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AdminSidebar } from '@/components/admin-layout'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSelector } from '@/components/language-selector'
import { LogOut } from 'lucide-react'
import { logoutUser } from '@/lib/auth'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [currentDateTime, setCurrentDateTime] = useState<string>('')

  // Check if this is the setup page
  const isSetupPage = pathname === '/admin/setup'

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
    // Skip auth check for setup page
    if (isSetupPage) {
      return
    }

    // Only redirect if NOT loading and user doesn't have proper access
    // Don't redirect WHILE loading - allow the loading state to show
    if (!loading) {
      // Auth check is complete
      if (!user) {
        // Not authenticated - redirect to admin setup for 3-step login
        router.push('/admin/setup')
        return
      }

      if (user.role !== 'admin' && user.role !== 'super_admin') {
        // User is authenticated but not an admin or super admin
        router.push('/dashboard')
        return
      }
    }
    
    // User is authenticated and is an admin or super admin - allow access
    // Or we're still loading and waiting for auth check
  }, [user, loading, router, isSetupPage])

  const handleLogout = async () => {
    await logoutUser()
    router.push('/login')
  }

  // Get user's first name or display email as fallback
  const displayName = user && 'firstName' in user ? user.firstName || (user as any).email : (user as any)?.email || 'Admin'

  // Show loading state ONLY on setup page during initial auth check
  // On other pages, allow rendering with sidebar visible while auth validates
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

  // Show access denied if not admin or super admin (only after loading complete)
  if (!loading && !isSetupPage && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-red-500 font-semibold text-lg">Access Denied</p>
          <p className="text-muted-foreground mt-2">Admin role required to access this area.</p>
        </div>
      </div>
    )
  }

  // For setup page, render without sidebar
  if (isSetupPage) {
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

