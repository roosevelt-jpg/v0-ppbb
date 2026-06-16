'use client'

import React from 'react'
import Link from 'next/link'
import { Briefcase } from 'lucide-react'

export function BusinessPortalSwitcher() {
  return (
    <Link
      href="/admin/business"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors text-sm font-medium"
      title="Switch to Business Portal"
    >
      <Briefcase className="w-4 h-4" />
      <span>Business Portal</span>
    </Link>
  )
}
