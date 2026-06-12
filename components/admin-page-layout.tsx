'use client'

import React from 'react'

interface AdminPageLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function AdminPageLayout({ children }: AdminPageLayoutProps) {
  // Simply pass through children without adding extra layout elements
  // The sidebar and header are provided by /app/admin/layout.tsx
  return <>{children}</>
}

