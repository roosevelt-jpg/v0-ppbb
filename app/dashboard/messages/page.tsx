'use client'

import { Mail } from 'lucide-react'

export default function MessagesPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      <div className="flex flex-col items-center justify-center py-12">
        <Mail className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg">No messages yet</p>
        <p className="text-gray-400 text-sm mt-1">Messages from community members will appear here</p>
      </div>
    </div>
  )
}
