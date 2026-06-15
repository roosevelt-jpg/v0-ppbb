'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { LogOut, Settings, BarChart3, Briefcase, TrendingUp, Users, ShoppingBag, Zap, DollarSign, Heart, Share2, LayoutGrid, Menu, X } from 'lucide-react'

const businessMenuItems = [
  { label: 'Dashboard', href: '/admin/business/dashboard', icon: BarChart3 },
  { label: 'Profile', href: '/admin/business/profile', icon: Users },
  { label: 'Opportunities', href: '/admin/business/opportunities', icon: Briefcase },
  { label: 'Offers', href: '/admin/business/offers', icon: ShoppingBag },
  { label: 'Leads', href: '/admin/business/leads', icon: Zap },
  { label: 'Referrals', href: '/admin/business/referrals', icon: Share2 },
  { label: 'Partnerships', href: '/admin/business/partnerships', icon: Heart },
  { label: 'Marketplace', href: '/admin/business/marketplace', icon: LayoutGrid },
  { label: 'Payments', href: '/admin/business/payments', icon: DollarSign },
  { label: 'Analytics', href: '/admin/business/analytics', icon: TrendingUp },
]

function BusinessSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 30,
          }}
        />
      )}
      
      <aside
        style={{
          position: isOpen ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          width: '256px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e4e1da',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e4e1da' }}>
          <h2 style={{ color: '#111111', fontSize: '18px', fontWeight: 700 }}>
            Business Portal
          </h2>
          <p style={{ color: '#888888', fontSize: '12px', marginTop: '4px' }}>
            Passive Blessings
          </p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px', overflowY: 'auto' }} className="space-y-2">
          {businessMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  color: '#111111',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Icon className="w-4 h-4" />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid #e4e1da' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e4e1da',
              backgroundColor: '#ffffff',
              color: '#111111',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2'
              e.currentTarget.style.borderColor = '#dc2626'
              e.currentTarget.style.color = '#dc2626'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff'
              e.currentTarget.style.borderColor = '#e4e1da'
              e.currentTarget.style.color = '#111111'
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    if (!loading && (!user || (user.role !== 'business' && user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#888888' }}>Loading business portal...</p>
      </div>
    )
  }

  if (!user || (user.role !== 'business' && user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#dc2626' }}>Access denied. Business or admin account required.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      {/* Desktop Sidebar */}
      <div style={{ display: 'none', '@media (min-width: 768px)': { display: 'block' } }}>
        <BusinessSidebar isOpen={true} onClose={() => {}} />
      </div>

      {/* Mobile Sidebar */}
      <BusinessSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Mobile Header */}
        <div
          style={{
            display: 'none',
            '@media (max-width: 768px)': { display: 'flex' },
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e4e1da',
            padding: '16px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h1 style={{ color: '#111111', fontSize: '20px', fontWeight: 700 }}>
            Business Portal
          </h1>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              backgroundColor: '#transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
