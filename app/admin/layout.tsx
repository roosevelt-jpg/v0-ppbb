'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { AdminSidebar, AdminHeader } from '@/components/admin-layout'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user is admin (in production, verify role from Firestore)
      // For now, we'll allow logged-in users
      setIsAdmin(true)
    })

    return () => unsubscribe()
  }, [router])

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">Access denied. Admin role required.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
