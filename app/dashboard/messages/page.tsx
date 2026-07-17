'use client'

import React, { Suspense } from 'react'
import { DashboardPageShell } from '@/components/dashboard-states'
import { DmInbox } from '@/components/dm/dm-inbox'
import { Loader2 } from 'lucide-react'

function MessagesFallback() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  )
}

export default function MessagesPage() {
  return (
    <DashboardPageShell
      title="Messages"
      subtitle="Encrypted direct conversations with businesses and members (buyer ↔ seller)"
    >
      <Suspense fallback={<MessagesFallback />}>
        <DmInbox />
      </Suspense>
    </DashboardPageShell>
  )
}
