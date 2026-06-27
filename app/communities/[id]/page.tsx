'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Send, MessageCircle, Users, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function CommunityDetailPage() {
  const params = useParams()
  const communityId = params.id as string
  const [user, setUser] = useState<any>(null)
  
  const [community, setCommunity] = useState<any>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  // Fetch community
  useEffect(() => {
    if (!communityId) return

    const fetchCommunity = async () => {
      try {
        const response = await fetch(`/api/communities?id=${communityId}`)
        const data = await response.json()
        if (data.success) {
          setCommunity(data.data)
        }
      } catch (error) {
        console.error('[v0] Error fetching community:', error)
      }
    }

    fetchCommunity()
  }, [communityId])

  // Fetch groups
  useEffect(() => {
    if (!communityId) return

    const q = query(
      collection(db, 'community-groups'),
      where('communityId', '==', communityId),
      where('status', '==', 'active')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.(),
      }))
      setGroups(data)
      if (data.length > 0 && !selectedGroup) {
        setSelectedGroup(data[0])
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [communityId, selectedGroup])

  // Fetch messages for selected group
  useEffect(() => {
    if (!selectedGroup) return

    const q = query(
      collection(db, 'community-messages'),
      where('groupId', '==', selectedGroup.id),
      where('moderationStatus', '!=', 'rejected')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.(),
        }))
        .sort((a, b) => a.createdAt - b.createdAt)
      setMessages(data)
    })

    return () => unsubscribe()
  }, [selectedGroup])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !selectedGroup) return

    setSendingMessage(true)
    try {
      console.log('[v0] Sending message:', { groupId: selectedGroup.id, authorId: user.uid })

      const response = await fetch('/api/community-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          communityId,
          authorId: user.uid,
          authorName: user.displayName || 'Anonymous',
          content: newMessage,
          type: 'text',
        }),
      })

      const data = await response.json()
      if (data.success) {
        setNewMessage('')
        console.log('[v0] Message sent successfully')
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('[v0] Error sending message:', error)
      alert(`Failed to send message: ${error.message}`)
    } finally {
      setSendingMessage(false)
    }
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-black">{community.name}</h1>
        <p className="text-gray-600 text-sm sm:text-base">{community.description}</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Groups Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto hidden md:block">
          <div className="p-4">
            <h2 className="font-bold text-black mb-4 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Groups
            </h2>

            {loading ? (
              <div className="text-center py-8 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : groups.length === 0 ? (
              <p className="text-sm text-gray-600">No groups yet</p>
            ) : (
              <div className="space-y-2">
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      selectedGroup?.id === group.id
                        ? 'bg-black text-white'
                        : 'text-black hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-medium text-sm">{group.name}</p>
                    <p className={`text-xs ${selectedGroup?.id === group.id ? 'text-gray-200' : 'text-gray-500'}`}>
                      {group.members?.total || 1} members
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedGroup ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-black">{selectedGroup.name}</h2>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {selectedGroup.members?.total || 1} members
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No messages yet. Be the first to say hello!</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.authorId === user?.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.authorId === user?.uid
                            ? 'bg-black text-white'
                            : 'bg-gray-200 text-black'
                        }`}
                      >
                        {msg.authorId !== user?.uid && (
                          <p className="text-xs font-bold mb-1 opacity-75">{msg.authorName}</p>
                        )}
                        <p className="text-sm break-words">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {formatDistanceToNow(msg.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sendingMessage}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessage.trim()}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-600 disabled:opacity-50 transition"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>Select a group to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
