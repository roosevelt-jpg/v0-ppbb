'use client'

import React from 'react'

interface AdminPageLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

/**
 * Shared admin CMS/page shell. Must stay full readable width — parents in
 * app/admin/layout.tsx already constrain to max-w-[80rem]; this wrapper
 * ensures children can grow (min-w-0) and never collapse into a flex stub.
 */
export function AdminPageLayout({ children }: AdminPageLayoutProps) {
  return <div className="w-full min-w-0">{children}</div>
}

