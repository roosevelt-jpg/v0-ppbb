'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { MessageCircle, Send, Search, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  lastMessageAt: Date
  status: string
  category: string
  sentiment: string
}

export default function ChatPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvId, setSelectedConvId] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationLoading, setConversationLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user?.id) {
      loadConversations()
    }
  }, [user?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (selectedConvId) {
      loadConversation(selectedConvId)
    }
  }, [selectedConvId])

  const loadConversations = async () => {
    try {
      setConversationLoading(true)
      const response = await fetch(`/api/conversations?userId=${user?.id}&role=${user?.role}`)
      const data = await response.json()
      setConversations(data.conversations || [])
      if (data.conversations?.length > 0 && !selectedConvId) {
        setSelectedConvId(data.conversations[0].id)
      }
    } catch (error) {
      console.error('[v0] Error loading conversations:', error)
    } finally {
      setConversationLoading(false)
    }
  }

  const loadConversation = async (convId: string) => {
    try {
      const response = await fetch(`/api/conversations/${convId}`)
      const data = await response.json()
      setMessages(
        data.messages?.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })) || []
      )
    } catch (error) {
      console.error('[v0] Error loading conversation:', error)
    }
  }

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          title: `Chat - ${new Date().toLocaleString()}`,
          role: user?.role || 'user',
        }),
      })

      const data = await response.json()
      if (data.id) {
        setSelectedConvId(data.id)
        setMessages([])
        loadConversations()
      }
    } catch (error) {
      console.error('[v0] Error creating conversation:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading || !selectedConvId) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages
            .map(m => ({ role: m.role, content: m.content }))
            .concat([{ role: 'user', content: input }]),
          conversationId: selectedConvId,
          userId: user?.id,
        }),
      })

      const data = await response.json()

      if (data.message) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('[v0] Error sending message:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const deleteConversation = async (convId: string) => {
    try {
      await fetch(`/api/conversations/${convId}`, { method: 'DELETE' })
      loadConversations()
      if (selectedConvId === convId) {
        setSelectedConvId('')
        setMessages([])
      }
    } catch (error) {
      console.error('[v0] Error deleting conversation:', error)
    }
  }

  return (
    <div className="h-screen flex bg-neutral-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition font-medium"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversationLoading ? (
            <div className="p-4 text-center text-neutral-500 text-sm">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-neutral-500 text-sm">No conversations yet</div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full text-left p-3 hover:bg-neutral-50 transition border-l-2 ${
                    selectedConvId === conv.id ? 'border-l-blue-600 bg-blue-50' : 'border-l-transparent'
                  }`}
                >
                  <h3 className="text-sm font-medium text-neutral-900 truncate">{conv.title}</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    {new Date(conv.lastMessageAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConvId ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-500">Start a conversation</p>
                  </div>
                </div>
              ) : (
                messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md px-4 py-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-neutral-100 text-neutral-900 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-neutral-100 text-neutral-900 px-4 py-2 rounded-lg rounded-bl-none">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-6 border-t border-neutral-200 bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500 mb-4">Select a conversation or create a new one</p>
              <button
                onClick={createNewConversation}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition"
              >
                Start Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
