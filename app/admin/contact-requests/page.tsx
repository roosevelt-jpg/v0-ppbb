'use client'

import { useState, useEffect } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Mail, Trash2, Check, AlertCircle } from 'lucide-react'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'unread' | 'read' | 'resolved'
  createdAt: Date
  respondedAt?: Date
  response?: string
}

export default function ContactRequestsPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'resolved'>('all')
  const [response, setResponse] = useState('')
  const [respondingTo, setRespondingTo] = useState<string | null>(null)

  useEffect(() => {
    loadMessages()
  }, [filter])

  const loadMessages = async () => {
    try {
      setLoading(true)
      setError('')
      const url =
        filter === 'all'
          ? '/api/contact?source=legacy'
          : `/api/contact?source=legacy&status=${filter}`
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()

      if (json.success && Array.isArray(json.data)) {
        setMessages(json.data)
      } else {
        setMessages([])
      }
    } catch (err) {
      console.error('[v0] Error loading messages:', err)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      setError('')
      const res = await fetch('/api/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'read' }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      await loadMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update message')
    }
  }

  const handleRespond = async (id: string) => {
    if (!response.trim()) return
    try {
      setError('')
      const res = await fetch('/api/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'resolved', response }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setResponse('')
      setRespondingTo(null)
      setSelectedMessage(null)
      await loadMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send response')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return
    try {
      setError('')
      const res = await fetch(`/api/contact?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSelectedMessage(null)
      await loadMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message')
    }
  }

  const unreadCount = messages.filter((m) => m.status === 'unread').length
  const readCount = messages.filter((m) => m.status === 'read').length
  const resolvedCount = messages.filter((m) => m.status === 'resolved').length

  return (
    <AdminPageLayout title="Contact Requests" subtitle="Manage and respond to user inquiries">
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black">Contact Requests</h1>
        <p className="text-gray-600 mt-2">Manage and respond to user inquiries</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600">Total Messages</p>
          <p className="text-3xl font-bold mt-2">{messages.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600">Unread</p>
          <p className="text-3xl font-bold mt-2 text-red-600">{unreadCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600">Resolved</p>
          <p className="text-3xl font-bold mt-2 text-green-600">{resolvedCount}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
          {/* Filter Tabs */}
          <div className="flex border-b border-gray-200">
            {(['all', 'unread', 'read', 'resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f)
                  setSelectedMessage(null)
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  filter === f
                    ? 'border-b-2 border-black text-black'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No messages</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors ${
                    selectedMessage?.id === msg.id ? 'bg-blue-50' : ''
                  } ${msg.status === 'unread' ? 'font-semibold' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">{msg.name}</p>
                      <p className="text-sm text-gray-600 truncate">{msg.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">{msg.email}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${
                        msg.status === 'unread'
                          ? 'bg-red-100 text-red-700'
                          : msg.status === 'resolved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {msg.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Detail & Response */}
        {selectedMessage ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 h-fit">
            <h3 className="font-bold text-lg text-black mb-4">{selectedMessage.subject}</h3>

            <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-600 uppercase">From</p>
                <p className="text-sm font-medium text-black">{selectedMessage.name}</p>
                <p className="text-sm text-gray-600">{selectedMessage.email}</p>
              </div>

              <div>
                <p className="text-xs text-gray-600 uppercase">Message</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">
                  {selectedMessage.message}
                </p>
              </div>

              {selectedMessage.response && (
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <p className="text-xs text-gray-600 uppercase">Your Response</p>
                  <p className="text-sm text-gray-700 mt-2">{selectedMessage.response}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {selectedMessage.status !== 'resolved' && (
              <div className="space-y-3">
                {respondingTo !== selectedMessage.id ? (
                  <>
                    {selectedMessage.status === 'unread' && (
                      <button
                        onClick={() => handleMarkAsRead(selectedMessage.id)}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => setRespondingTo(selectedMessage.id)}
                      className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 text-sm font-medium"
                    >
                      Send Response
                    </button>
                  </>
                ) : (
                  <>
                    <textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Type your response..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRespondingTo(null)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleRespond(selectedMessage.id)}
                        className="flex-1 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900"
                      >
                        Send
                      </button>
                    </div>
                  </>
                )}
                <button
                  onClick={() => handleDelete(selectedMessage.id)}
                  className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-6 h-fit text-center text-gray-500">
            Select a message to view details
          </div>
        )}
      </div>
    </div>
    </AdminPageLayout>
  )
}
