'use client'

import { Mail } from 'lucide-react'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard-states'

export default function MessagesPage() {
  return (
    <DashboardPageShell title="Messages" subtitle="Conversations with community members">
      <DashboardEmptyState
        icon={<Mail className="w-12 h-12" />}
        title="No messages yet"
        description="Messages from community members will appear here."
      />
    </DashboardPageShell>
  )
}
