'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { MemberSidebar, MemberHeader } from '@/components/member-layout'
import { User } from '@/lib/types'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

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

  const memberUser = user as User

  return (
    <div className="flex h-screen bg-background">
      <MemberSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />
      <main className="flex-1 overflow-auto flex flex-col">
        <MemberHeader
          title="Dashboard"
          subtitle={`${memberUser.firstName ?? 'Member'} • Active member`}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
        />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
