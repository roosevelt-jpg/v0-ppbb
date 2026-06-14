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
  const isSetupPage = pathname === '/admin/setup'
  React.useEffect(() => {
    if (isSetupPage) {
      setIsAdmin(true)
      return
    }
    const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
      if (!user) {
        router.push('/admin/setup')
        return
      }
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
  if (isSetupPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        {children}
      </div>
    )
  }
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AdminHeader title="Platform Overview" subtitle="Complete ecosystem visibility and management" />
        <main className="flex-1 overflow-auto bg-[#f7f6f2]">
          <div className="w-full p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
