'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ChatbotAvatar } from '@/components/chatbot-avatar'
import { LinkifiedText } from '@/components/chat/linkified-text'
import { isDashboardRoute } from '@/lib/dashboard-routes'
import { X, Send, AlertCircle } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

const WELCOME_MESSAGE =
  "Hello! Welcome to Passive Blessings — I'm glad you're here. How can I help you today? Ask me about membership, events, volunteering, donations, or anything else on the platform."

export function ChatWidget() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [conversationId, setConversationId] = useState<string>('')
  const [ready, setReady] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const initRef = useRef(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (conversationId) return conversationId
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
      if (!response.ok) throw new Error('Failed to start chat')
      const data = await response.json()
      if (!data.id) throw new Error('No conversation ID')
      setConversationId(data.id)
      return data.id as string
    } catch (err) {
      console.error('[v0] Error initializing conversation:', err)
      return null
    }
  }, [conversationId, user?.id, user?.role])

  const openChat = () => {
    setIsOpen(true)
    setError('')
    // Greet immediately — don't wait for the network
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: WELCOME_MESSAGE,
          timestamp: new Date(),
        },
      ])
    }
    window.setTimeout(() => inputRef.current?.focus(), 80)

    if (!initRef.current) {
      initRef.current = true
      void (async () => {
        const id = await ensureConversation()
        setReady(Boolean(id))
        if (!id) {
          setError('Connection is slow — you can still type; we will retry when you send.')
        }
      })()
    }
  }

  const closeChat = () => {
    setIsOpen(false)
  }

  const sendToApi = async (convId: string, allMessages: { role: string; content: string }[]) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: allMessages,
        conversationId: convId,
        userId: user?.id || 'anonymous',
      }),
    })
    if (!response.ok) {
      let errorMsg = 'Failed to send message'
      try {
        const errorData = await response.json()
        errorMsg = errorData.error || errorMsg
      } catch {
        /* ignore */
      }
      throw new Error(errorMsg)
    }
    return response.json()
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError('')

    try {
      let convId = conversationId
      if (!convId) {
        convId = (await ensureConversation()) || ''
        if (!convId) throw new Error('Could not start chat. Please try again.')
        setReady(true)
      }

      const history = [...messages, userMessage]
        .filter((m) => m.content !== WELCOME_MESSAGE || m.role === 'user')
        .map((m) => ({ role: m.role, content: m.content }))

      // Include welcome only as context if needed — send recent user/assistant turns
      const payload =
        history.length > 0
          ? history
          : [{ role: 'user' as const, content: text }]

      const data = await sendToApi(convId, payload)

      if (data.message) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: String(data.message),
            timestamp: new Date(),
          },
        ])
      } else {
        throw new Error('No reply received')
      }
    } catch (err) {
      console.error('[v0] Chat error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMsg)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry — I had a brief hiccup. Please send your question again and I'll help right away.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
      window.setTimeout(() => inputRef.current?.focus(), 50)
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
          onClick={openChat}
          className="pb-float-btn fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 overflow-hidden bg-white border-2 border-neutral-700 p-1"
          aria-label="Open PB Assistant chat"
        >
          <ChatbotAvatar size={56} className="w-full h-full" priority />
        </button>
      )}

      {isOpen && (
        <div
          className="fixed z-50 flex flex-col bg-white border border-neutral-200 shadow-2xl
            inset-x-3 bottom-3 top-[max(4.5rem,12%)] rounded-2xl
            sm:inset-auto sm:bottom-6 sm:right-6 sm:top-auto
            sm:w-[22rem] sm:h-[min(32rem,calc(100dvh-5rem))] sm:rounded-lg
            md:w-[24rem]"
          role="dialog"
          aria-label="PB Assistant"
        >
          <div
            className="flex items-center justify-between gap-2 px-3 py-3 sm:px-4 border-b border-neutral-200 text-white rounded-t-2xl sm:rounded-t-lg shrink-0"
            style={{ backgroundColor: '#111111' }}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <ChatbotAvatar size={36} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 p-0.5 shrink-0" />
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate !text-white">PB Assistant</h3>
                <p className="text-[10px] opacity-70 truncate !text-white">
                  {ready || conversationId ? 'Online · usually replies instantly' : 'Connecting…'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeChat}
              className="pb-ghost-btn p-2 rounded-lg !text-white hover:!bg-white/10"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 !text-white" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-3 bg-neutral-50">
            {messages.map((message, idx) => (
              <div
                key={`${message.role}-${idx}-${message.timestamp?.getTime?.() || idx}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start items-end gap-2'} w-full`}
              >
                {message.role === 'assistant' && (
                  <ChatbotAvatar size={24} className="w-6 h-6 shrink-0 mb-0.5 hidden xs:block sm:block" />
                )}
                <div
                  className={`max-w-[88%] sm:max-w-[85%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'text-white rounded-br-md'
                      : 'bg-white text-neutral-900 rounded-bl-md border border-neutral-200'
                  }`}
                  style={message.role === 'user' ? { backgroundColor: '#111111' } : undefined}
                >
                  <LinkifiedText text={message.content} onDark={message.role === 'user'} />
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start items-end gap-2">
                <ChatbotAvatar size={24} className="w-6 h-6 shrink-0 mb-0.5 hidden sm:block" />
                <div className="bg-white border border-neutral-200 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.12s' }}
                    />
                    <div
                      className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.24s' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 border-t border-neutral-200 bg-white rounded-b-2xl sm:rounded-b-lg shrink-0 safe-area-pb"
          >
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question…"
                disabled={loading}
                autoComplete="off"
                className="flex-1 min-w-0 px-3 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm disabled:bg-neutral-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="shrink-0 !bg-black !text-white p-2.5 rounded-xl disabled:opacity-40"
                aria-label="Send message"
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
