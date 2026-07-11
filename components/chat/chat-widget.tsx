'use client'

import React, { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ChatbotAvatar } from '@/components/chatbot-avatar'
import { isDashboardRoute } from '@/lib/dashboard-routes'
import { X, Send, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
  faqSource?: {
    id: string
    question: string
    category: string
  }
  knowledgeSource?: {
    id: string
    title: string
  }
}

export function ChatWidget() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [conversationId, setConversationId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize conversation on open
  useEffect(() => {
    if (isOpen && !conversationId) {
      initializeConversation()
    }
  }, [isOpen, conversationId])

  const initializeConversation = async () => {
    try {
      setError('')
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          title: `Chat - ${new Date().toLocaleString()}`,
          role: user?.role || 'member',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to initialize conversation')
      }

      const data = await response.json()
      if (data.id) {
        setConversationId(data.id)
        // Add welcome message
        setMessages([
          {
            role: 'assistant',
            content: 'Hello! I&apos;m here to help. Ask me anything about Passive Blessings!',
            timestamp: new Date(),
          },
        ])
      }
    } catch (error) {
      console.error('[v0] Error initializing conversation:', error)
      setError('Failed to connect. Please refresh and try again.')
      setMessages([
        {
          role: 'assistant',
          content: 'Sorry, I&apos;m having trouble connecting. Please try again in a moment.',
          timestamp: new Date(),
        },
      ])
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || loading) {
      return
    }

    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError('')

    // If no conversation, initialize it first
    if (!conversationId) {
      try {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id || 'anonymous',
            title: `Chat - ${new Date().toLocaleString()}`,
            role: user?.role || 'member',
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to initialize conversation')
        }

        const data = await response.json()
        if (!data.id) {
          throw new Error('No conversation ID returned')
        }

        // Now send the message with the new conversation ID
        const allMessages = [userMessage].map(m => ({
          role: m.role,
          content: m.content,
        }))

        const chatResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: allMessages,
            conversationId: data.id,
            userId: user?.id || 'anonymous',
          }),
        })

        if (!chatResponse.ok) {
          let errorMsg = 'Failed to send message'
          try {
            const errorData = await chatResponse.json()
            errorMsg = errorData.error || errorMsg
          } catch (e) {
            // Response body not JSON
          }
          throw new Error(errorMsg)
        }

        const chatData = await chatResponse.json()
        
        if (chatData.message) {
          const assistantMessage: Message = {
            role: 'assistant',
            content: chatData.message,
            timestamp: new Date(),
            faqSource: chatData.faqSource,
            knowledgeSource: chatData.knowledgeSource,
          }
          setMessages(prev => [...prev, assistantMessage])
        }

        setConversationId(data.id)
        setLoading(false)
      } catch (error) {
        console.error('[v0] Error in first message:', error)
        setError(error instanceof Error ? error.message : 'Failed to send message')
        setLoading(false)
      }
      return
    }

    try {
      // Send message to chat API with all previous messages
      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }))

      console.log('[v0] Sending message to API:', { conversationId, messageCount: allMessages.length })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          conversationId,
          userId: user?.id || 'anonymous',
        }),
      })

      if (!response.ok) {
        let errorMsg = 'Failed to send message'
        try {
          const data = await response.json()
          errorMsg = data.error || errorMsg
        } catch (e) {
          // Response body not JSON
        }
        throw new Error(errorMsg)
      }

      const data = await response.json()
      console.log('[v0] API response:', data)

      if (data.message) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          faqSource: data.faqSource,
          knowledgeSource: data.knowledgeSource,
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error('No message in response')
      }
    } catch (error) {
      console.error('[v0] Chat error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMsg)
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

  if (isDashboardRoute(pathname)) {
    return null
  }

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 overflow-hidden bg-white border-2 border-neutral-600 p-1 min-h-[56px] min-w-[56px]"
          aria-label="Open PB Assistant chat"
        >
          <ChatbotAvatar size={56} className="w-full h-full" priority />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-64 h-80 sm:w-80 sm:h-[430px] bg-white rounded-lg shadow-2xl flex flex-col border border-neutral-200 max-w-[calc(100vw-32px)]">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-neutral-200 text-white rounded-t-lg" style={{ backgroundColor: '#111111' }}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <ChatbotAvatar size={36} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 p-0.5" />
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate">PB Assistant</h3>
                <p className="text-[10px] opacity-60 font-light">By FLYN.AI</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded transition hover:bg-neutral-700"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-neutral-50">
            {messages.map((message, idx) => (
              <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start items-end gap-2'} w-full`}>
                {message.role === 'assistant' && (
                  <ChatbotAvatar size={24} className="w-6 h-6 shrink-0 mb-1 hidden sm:block" />
                )}
                <div className={`${message.role === 'user' ? 'max-w-[calc(100%-24px)]' : 'max-w-[calc(100%-32px)] sm:max-w-[calc(100%-24px)]'}`}>
                  <div
                    className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm ${
                      message.role === 'user'
                        ? 'text-white rounded-br-none'
                        : 'bg-white text-neutral-900 rounded-bl-none border border-neutral-200'
                    }`}
                    style={{
                      ...(message.role === 'user' ? { backgroundColor: '#111111' } : {}),
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      display: 'block',
                    }}
                  >
                    <p className="leading-relaxed" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </p>
                  </div>
                  {/* Source badge */}
                  {message.faqSource && (
                    <div className="mt-1 text-xs text-neutral-600 italic flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      From FAQ: {message.faqSource.category || message.faqSource.question}
                    </div>
                  )}
                  {!message.faqSource && message.knowledgeSource && (
                    <div className="mt-1 text-xs text-neutral-600 italic flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      From: {message.knowledgeSource.title}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start items-end gap-2">
                <ChatbotAvatar size={24} className="w-6 h-6 shrink-0 mb-1 hidden sm:block" />
                <div className="bg-white border border-neutral-200 px-3 sm:px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-neutral-200 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !loading) {
                    e.preventDefault()
                    handleSendMessage(e as any)
                  }
                }}
                placeholder="Ask me anything..."
                disabled={loading}
                className="flex-1 px-2 sm:px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm disabled:bg-neutral-50"
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
                title={loading ? 'Sending...' : 'Send message'}
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
