'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { DashboardTopBar } from '@/components/dashboard-top-bar'
import { SiteLogo } from '@/components/site-logo'
import { logoutUser } from '@/lib/auth'

const SPONSOR_NAV = [
  { label: 'Dashboard', href: '/sponsor' },
  { label: 'Profile', href: '/sponsor/profile' },
  { label: 'Marketplace', href: '/sponsor/marketplace' },
  { label: 'Analytics', href: '/sponsor/analytics' },
  { label: 'Certificates', href: '/sponsor/certificates' },
  { label: 'Partnerships', href: '/sponsor/partnerships' },
]

function SponsorSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="px-4 py-4 border-b border-[#e4e1da] flex flex-col items-center justify-center">
        <SiteLogo background="light" variant="sidebar" href="/sponsor" />
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {SPONSOR_NAV.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/sponsor' && pathname?.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`block px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#111111] text-[#f7f6f2]'
                  : 'text-[#333333] hover:bg-[#f7f6f2]'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default function SponsorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login')
        return
      }
      setIsAuthenticated(true)
    })

    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await logoutUser()
    router.push('/login')
  }

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

  const mobileMenu = (
    <button
      type="button"
      data-dashboard-control
      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      className="md:hidden inline-flex items-center justify-center min-h-[32px] min-w-[32px] rounded-md bg-transparent text-neutral-700 hover:bg-neutral-100"
      aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
    >
      {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  )

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-52 shrink-0 border-r border-[#e4e1da] md:block">
        <SponsorSidebarContent />
      </aside>

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 transform border-r border-[#e4e1da] bg-white transition-transform duration-300 md:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SponsorSidebarContent onNavigate={() => setIsSidebarOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardTopBar
          title="Sponsor Dashboard"
          welcome="Manage sponsorships and partnerships"
          onLogout={handleLogout}
          logoutLabel="Sign out"
          trailing={mobileMenu}
        />
        <main className="min-w-0 flex-1 overflow-auto overflow-x-hidden bg-background" data-dashboard-surface="light">
          <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
