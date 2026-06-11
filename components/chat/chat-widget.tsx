'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

export function ChatWidget() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize conversation on open
  useEffect(() => {
    if (isOpen && !conversationId && user?.id) {
      initializeConversation()
    }
  }, [isOpen, user?.id])

  const initializeConversation = async () => {
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
        setConversationId(data.id)
        // Add welcome message
        setMessages([
          {
            role: 'assistant',
            content: 'Hello! I&apos;m here to help. What can I assist you with today?',
            timestamp: new Date(),
          },
        ])
      }
    } catch (error) {
      console.error('[v0] Error initializing conversation:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading || !conversationId) return

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
          messages: messages.map(m => ({ role: m.role, content: m.content })).concat([{ role: 'user', content: input }]),
          conversationId,
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

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
          style={{ backgroundColor: '#111111' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#333333')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#111111')}
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-96 bg-white rounded-lg shadow-2xl flex flex-col border border-neutral-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 text-white rounded-t-lg" style={{ backgroundColor: '#111111' }}>
            <div>
              <h3 className="font-semibold">Support Assistant</h3>
              <p className="text-xs opacity-90">Powered by AI</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded transition"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#333333')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'text-white rounded-br-none'
                      : 'bg-neutral-100 text-neutral-900 rounded-bl-none'
                  }`}
                  style={message.role === 'user' ? { backgroundColor: '#111111' } : {}}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
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
          <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message..."
                disabled={loading}
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 text-sm disabled:bg-neutral-50"
                style={{ '--tw-ring-color': '#111111' } as any}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2 text-white rounded-lg transition"
                style={{ 
                  backgroundColor: loading || !input.trim() ? '#cccccc' : '#111111'
                }}
                onMouseEnter={(e) => !loading && !input.trim() && (e.currentTarget.style.backgroundColor = '#333333')}
                onMouseLeave={(e) => !loading && !input.trim() && (e.currentTarget.style.backgroundColor = '#111111')}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
