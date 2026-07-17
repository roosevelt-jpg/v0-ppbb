'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DmInbox } from '@/components/dm/dm-inbox'

/**
 * Business-portal messages — stays inside /business shell so Network → Message
 * does not strand users in the member dashboard without a back path.
 */
export default function BusinessMessagesPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Messages</h1>
          <p className="text-sm text-neutral-600">
            Private conversations with members and connections (encrypted end-to-end in transit via
            Firebase Auth).
          </p>
        </div>
        <Link
          href="/business/marketplace"
          className="inline-flex items-center gap-2 text-sm font-medium border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Network
        </Link>
      </div>
      <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white min-h-[70vh]">
        <DmInbox />
      </div>
    </div>
  )
}
