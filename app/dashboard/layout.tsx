'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { MemberSidebar, MemberHeader } from '@/components/member-layout'
import { User } from '@/lib/types'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
      if (!firebaseUser) {
        router.push('/login')
        return
      }

      try {
        const userDocSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDocSnap.exists()) {
          setUser(userDocSnap.data() as User)
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('[v0] Error fetching user:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  if (isLoading) {
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
          <p className="text-red-500">Unable to load user data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <MemberSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <main className="flex-1 overflow-auto flex flex-col">
        <MemberHeader
          title="Welcome back, " 
          subtitle={`${user.firstName} • Active member`}
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
