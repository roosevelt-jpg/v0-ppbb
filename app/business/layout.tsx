'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { BusinessProfile } from '@/lib/types'
import Link from 'next/link'
import { LogOut, Settings, BarChart3, Briefcase, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import { logoutUser } from '@/lib/auth'

const businessMenuItems = [
  { label: 'Overview', href: '/business', icon: BarChart3 },
  { label: 'Opportunities', href: '/business/opportunities', icon: Briefcase },
  { label: 'Analytics', href: '/business/analytics', icon: TrendingUp },
  { label: 'Members', href: '/business/members', icon: Users },
  { label: 'Settings', href: '/business/settings', icon: Settings },
]

function BusinessSidebar() {
  const router = useRouter()

  const handleLogout = async () => {
    await logoutUser()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Logo size="md" href="/business" />
        <p className="text-xs text-muted-foreground mt-2">Business Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {businessMenuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-foreground hover:bg-secondary"
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        <ThemeToggle />
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [business, setBusiness] = React.useState<BusinessProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/login')
        return
      }

      try {
        const userDocSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDocSnap.exists() && userDocSnap.data().role === 'business') {
          setBusiness(userDocSnap.data() as BusinessProfile)
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('[v0] Error fetching business profile:', error)
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
        <p className="text-muted-foreground">Loading business portal...</p>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Access denied. Business account required.</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <BusinessSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
