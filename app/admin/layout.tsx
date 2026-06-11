'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { AdminSidebar, AdminHeader } from '@/components/admin-layout'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null)

  // Check if this is the setup page
  const isSetupPage = pathname === '/admin/setup'

  React.useEffect(() => {
    // Skip auth check for setup page
    if (isSetupPage) {
      setIsAdmin(true)
      return
    }

    const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
      if (!user) {
        // Not authenticated - redirect to setup page for admin
        router.push('/admin/setup')
        return
      }

      // For admin pages, redirect first-time users or non-admins to setup
      // In production, verify admin role from Firestore
      setIsAdmin(true)
    })

    return () => unsubscribe()
  }, [router, isSetupPage])

  if (isAdmin === null && !isSetupPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin && !isSetupPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">Access denied. Admin role required.</p>
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

  // For other admin pages, render with sidebar and header
  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader title="Platform Overview" subtitle="Complete ecosystem visibility and management" />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

