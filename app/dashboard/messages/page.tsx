'use client'

import React, { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, addDoc, orderBy } from 'firebase/firestore'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function MessagesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) return

    // Fetch conversations for current user
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', firebaseUser.uid)
      ),
      (snapshot) => {
        setConversations(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        )
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!selectedConversation) return

    const unsubscribe = onSnapshot(
      query(
        collection(db, `conversations/${selectedConversation.id}/messages`),
        orderBy('createdAt', 'asc')
      ),
      (snapshot) => {
        setMessages(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        )
      }
    )

    return () => unsubscribe()
  }, [selectedConversation])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !auth.currentUser) return

    setSending(true)
    try {
      await addDoc(
        collection(db, `conversations/${selectedConversation.id}/messages`),
        {
          senderId: auth.currentUser.uid,
          senderName: auth.currentUser.email,
          message: newMessage,
          createdAt: new Date(),
        }
      )
      setNewMessage('')
    } catch (error) {
      console.error('[v0] Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <MemberHeader
        title="Messages"
        subtitle="Connect with other members and community leaders"
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="p-8">
        <div className="grid md:grid-cols-3 gap-6 h-96">
          {/* Conversations List */}
          <Card className="p-4 overflow-y-auto">
            <h3 className="font-semibold mb-4">Conversations</h3>
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedConversation?.id === conv.id
                      ? 'bg-gray-100'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium text-sm">{conv.title || 'Conversation'}</p>
                  <p className="text-xs text-muted-foreground">{conv.participants.length} members</p>
                </button>
              ))}
              {conversations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No conversations yet</p>
              )}
            </div>
          </Card>

          {/* Messages */}
          <Card className="col-span-2 p-4 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="flex items-center gap-2 pb-4 border-b">
                  <Users className="w-5 h-5" />
                  <div>
                    <h3 className="font-semibold">{selectedConversation.title || 'Conversation'}</h3>
                    <p className="text-xs text-muted-foreground">{selectedConversation.participants.length} members</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-lg ${
                          msg.senderId === auth.currentUser?.uid
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
