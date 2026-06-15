'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AdminSidebar } from '@/components/admin-layout'
import { ThemeToggle } from '@/components/theme-toggle'
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

  // Check if this is the setup page
  const isSetupPage = pathname === '/admin/setup'

  useEffect(() => {
    // Skip auth check for setup page
    if (isSetupPage) {
      return
    }

    // Wait for auth context to load
    if (loading) {
      return
    }

    // Check authentication and authorization
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
    
    // User is authenticated and is an admin or super admin - allow access
  }, [user, loading, router, isSetupPage])

  const handleLogout = async () => {
    await logoutUser()
    router.push('/login')
  }

  // Show loading state while checking auth
  if (loading && !isSetupPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Show access denied if not admin or super admin
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
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b flex items-center justify-between px-6" style={{ borderColor: '#e4e1da' }}>
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground">
              {user?.email}
            </h2>
            <span className="px-3 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: '#f0ede8', color: '#666' }}>
              {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

