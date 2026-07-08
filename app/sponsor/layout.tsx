'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { DashboardHeader } from '@/components/dashboard-header'
import { SiteLogo } from '@/components/site-logo'

export default function SponsorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
      if (!user) {
        router.push('/login')
        return
      }
      setIsAuthenticated(true)
    })

    return () => unsubscribe()
  }, [router])

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Access denied.</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-48 min-h-screen flex flex-col border-r" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
        {/* Logo */}
        <div className="p-6 border-b flex flex-col items-center justify-center" style={{ borderColor: '#e4e1da', minHeight: '100px' }}>
          <SiteLogo background="light" href="/sponsor" heightClass="h-auto" maxWidth={140} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {[
            { label: 'Dashboard', href: '/sponsor' },
            { label: 'Profile', href: '/sponsor/profile' },
            { label: 'Marketplace', href: '/sponsor/marketplace' },
            { label: 'Analytics', href: '/sponsor/analytics' },
            { label: 'Certificates', href: '/sponsor/certificates' },
            { label: 'Partnerships', href: '/sponsor/partnerships' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg transition-colors text-sm font-medium"
              style={{
                color: '#333333',
                '&:hover': { backgroundColor: '#f7f6f2' },
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader title="Sponsor Dashboard" subtitle="Manage sponsorships and partnerships" />
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
