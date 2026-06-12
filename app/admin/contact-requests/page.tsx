'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { Trash2, Mail, Check } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function ContactRequestsPage() {
  const [messages, setMessages] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedMessage, setSelectedMessage] = React.useState<any>(null)

  React.useEffect(() => {
    // Subscribe to real-time contact requests
    const q = query(collection(db, 'contactRequests'), orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messageData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[]
        setMessages(messageData)
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching contact requests:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleMarkAsRead = async (messageId: string, currentReadStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'contactRequests', messageId), {
        read: !currentReadStatus,
      })
    } catch (error) {
      console.error('[v0] Error updating message:', error)
    }
  }

  const handleDelete = async (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteDoc(doc(db, 'contactRequests', messageId))
        setSelectedMessage(null)
      } catch (error) {
        console.error('[v0] Error deleting message:', error)
      }
    }
  }

  const unreadCount = messages.filter(m => !m.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
          <p className="mt-4 text-neutral-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border border-neutral-200">
          <p className="text-sm text-neutral-600">Total Messages</p>
          <p className="text-3xl font-bold mt-2">{messages.length}</p>
        </Card>
        <Card className="p-6 border border-neutral-200">
          <p className="text-sm text-neutral-600">Unread</p>
          <p className="text-3xl font-bold mt-2 text-red-600">{unreadCount}</p>
        </Card>
        <Card className="p-6 border border-neutral-200">
          <p className="text-sm text-neutral-600">Read</p>
          <p className="text-3xl font-bold mt-2">{messages.length - unreadCount}</p>
        </Card>
      </div>

      {messages.length === 0 ? (
        <Card className="p-12 border border-neutral-200 text-center">
          <Mail className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
          <p className="text-neutral-600">No messages yet</p>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-lg font-bold">Messages</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {messages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => setSelectedMessage(message)}
                  className={`w-full text-left p-3 rounded-lg border transition cursor-pointer ${
                    selectedMessage?.id === message.id
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  } ${!message.read ? 'bg-red-50 border-red-200' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!message.read && <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{message.name}</p>
                      <p className="text-xs text-neutral-600 truncate">{message.subject}</p>
                      <p className="text-xs text-neutral-500 mt-1">{formatDistanceToNow(new Date(message.createdAt?.toDate ? message.createdAt.toDate() : message.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <Card className="p-6 border border-neutral-200 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-neutral-200">
                  <div>
                    <h3 className="text-xl font-bold">{selectedMessage.name}</h3>
                    <p className="text-sm text-neutral-600 mt-1">{selectedMessage.email}</p>
                    {selectedMessage.phone && <p className="text-sm text-neutral-600">{selectedMessage.phone}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkAsRead(selectedMessage.id, selectedMessage.read)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                        selectedMessage.read
                          ? 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                          : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      {selectedMessage.read ? 'Mark Unread' : 'Mark Read'}
                    </button>
                    <button
                      onClick={() => handleDelete(selectedMessage.id)}
                      className="flex items-center gap-2 px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <p className="text-xs uppercase font-medium text-neutral-600">Subject</p>
                  <p className="text-lg font-semibold mt-1">{selectedMessage.subject}</p>
                </div>

                {/* Message */}
                <div>
                  <p className="text-xs uppercase font-medium text-neutral-600 mb-2">Message</p>
                  <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <p className="text-neutral-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="pt-4 border-t border-neutral-200">
                  <p className="text-xs text-neutral-600">
                    Received: {new Date(selectedMessage.createdAt?.toDate ? selectedMessage.createdAt.toDate() : selectedMessage.createdAt).toLocaleString()}
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="p-12 border border-neutral-200 text-center">
                <p className="text-neutral-600">Select a message to view details</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
