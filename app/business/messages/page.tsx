'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { DmInbox } from '@/components/dm/dm-inbox'

/**
 * Business-portal messages — stays inside /business shell so Network → Message
 * does not strand users in the member dashboard without a back path.
 */
function MessagesFallback() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-neutral-400 dark:text-neutral-500" />
    </div>
  )
}

export default function BusinessMessagesPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-foreground">Messages</h1>
          <p className="text-sm text-neutral-600 dark:text-muted-foreground">
            Direct messages with members — stays in the Business Portal.
          </p>
        </div>
        <Link
          href="/business/marketplace"
          className="inline-flex items-center gap-2 text-sm font-medium bg-black text-white px-3 py-2 rounded-lg hover:bg-neutral-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Network
        </Link>
      </div>
      <div className="border border-neutral-200 dark:border-border rounded-lg overflow-hidden bg-white dark:bg-card min-h-[70vh] p-3 sm:p-4">
        <Suspense fallback={<MessagesFallback />}>
          <DmInbox />
        </Suspense>
      </div>
    </div>
  )
}
