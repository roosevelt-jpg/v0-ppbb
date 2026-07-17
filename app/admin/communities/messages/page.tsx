'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { format } from 'date-fns'

interface GroupMessageRow {
  id: string
  communityId: string
  groupId: string
  senderName?: string
  content?: string
  text?: string
  timestamp?: string
}

export default function AdminGroupMessagesPage() {
  const [messages, setMessages] = React.useState<GroupMessageRow[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/group-messages')
        const json = await res.json()
        if (json.success) {
          setMessages(json.data || [])
        }
      } catch (error) {
        console.error('[v0] Error loading group messages:', error)
      } finally {
        setLoading(false)
      }
    }

    load()
    const interval = window.setInterval(load, 15000)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <AdminPageLayout title="Group Chat / Messages">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Recent messages across all community groups (refreshes every 15s)
          </p>
          <Link
            href="/admin/communities"
            className="h-7 min-h-0 px-4 py-2 bg-white text-black border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 inline-flex items-center"
          >
            Back to Community Management
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500 py-12 text-center">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-gray-500 py-12 text-center bg-gray-50 rounded-lg">No group messages yet.</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg min-w-0">
            <div className="admin-table-scroll">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">When</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Sender</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Message</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Group</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {messages.map((msg) => (
                    <tr key={`${msg.communityId}-${msg.groupId}-${msg.id}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {msg.timestamp ? format(new Date(msg.timestamp), 'MMM dd, HH:mm') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{msg.senderName || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-md truncate">
                        {msg.content || msg.text || ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{msg.groupId}</td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          href={`/communities/${msg.communityId}/groups/${msg.groupId}`}
                          className="px-3 py-1 bg-black !text-white rounded text-xs font-medium hover:bg-gray-900 min-h-[36px] inline-flex items-center"
                        >
                          Open Chat
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
