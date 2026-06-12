'use client'

import React, { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { AdminSidebar, AdminHeader } from './admin-layout'
import { PAGE_CONTAINER, CONTENT_CONTAINER } from '@/lib/admin-design-system'

interface AdminPageLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function AdminPageLayout({ title, subtitle, children }: AdminPageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768
      setIsMobile(isMobileView)
      if (!isMobileView) {
        setSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <div
        className={`fixed md:sticky top-0 left-0 h-screen z-40 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header with Mobile Toggle */}
        <div className="flex items-center md:hidden bg-white border-b border-neutral-200 px-4 py-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-neutral-100 rounded-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Admin Header */}
        <AdminHeader title={title} subtitle={subtitle} />

        {/* Page Content */}
        <main className={PAGE_CONTAINER}>
          <div className={CONTENT_CONTAINER}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Backdrop */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
