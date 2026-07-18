'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ChatbotAvatar } from '@/components/chatbot-avatar'
import { LinkifiedText } from '@/components/chat/linkified-text'
import { Send } from 'lucide-react'

interface Message {
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

export default function ChatBotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      content: 'Hello! Welcome to Passive Blessings — I\'m glad you\'re here. How can I help you today?',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageCopy = inputValue
    setInputValue('')
    setIsLoading(true)

    try {
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: messageCopy }],
          userId: 'public-chatbot-page',
        }),
      })
      const data = await chatResponse.json().catch(() => ({}))
      if (!chatResponse.ok) throw new Error(data.error || 'Failed to get a reply')

      const botResponse: Message = {
        type: 'bot',
        content:
          String(data.message || '').trim() ||
          "I'm happy to help — could you rephrase that, or ask about membership, events, or volunteering?",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botResponse])
    } catch (error) {
      console.error('[v0] Error in handleSendMessage:', error)
      const errorResponse: Message = {
        type: 'bot',
        content: "Sorry — I had a brief hiccup. Please try again, or reach us through the Contact page.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', backgroundColor: '#f9f7f4', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <section style={{ backgroundColor: '#111111', color: '#fff', padding: '24px', textAlign: 'center', borderBottom: '1px solid #333' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <ChatbotAvatar size={40} invertOnDark className="mr-3" />
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>Passive Blessings Assistant</h1>
        </div>
        <p style={{ fontSize: '14px', color: '#aaa', margin: 0 }}>
          Ask about membership, events, volunteering, donations, and more.
        </p>
      </section>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '900px', width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((message, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: message.type === 'user' ? '#111111' : '#e8f5e9',
                  color: message.type === 'user' ? '#fff' : '#1b5e20',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                }}
              >
                {message.content ? (
                  <LinkifiedText text={message.content} onDark={message.type === 'user'} />
                ) : null}
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#e8f5e9', color: '#1b5e20' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ animation: 'pulse 1s infinite', opacity: 0.6 }}>●</span>
                  <span style={{ animation: 'pulse 1s infinite 0.2s', opacity: 0.6 }}>●</span>
                  <span style={{ animation: 'pulse 1s infinite 0.4s', opacity: 0.6 }}>●</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div style={{ backgroundColor: '#fff', borderTop: '1px solid #e4e1da', padding: '20px', maxWidth: '900px', width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question... (press Enter to send)"
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #e4e1da',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
              backgroundColor: isLoading ? '#f5f5f5' : '#fff',
              cursor: isLoading ? 'not-allowed' : 'text',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#111111'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e4e1da'
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: '12px 20px',
              backgroundColor: inputValue.trim() && !isLoading ? '#111111' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim() && !isLoading) {
                e.currentTarget.style.backgroundColor = '#333333'
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue.trim() && !isLoading) {
                e.currentTarget.style.backgroundColor = '#111111'
              }
            }}
          >
            <Send size={16} />
            Send
          </button>
        </div>
        <p style={{ fontSize: '12px', color: '#999', margin: '12px 0 0 0' }}>
          💡 Tip: Try asking about volunteering, membership, sponsorship, or any community-related questions!
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
      </main>
      <Footer />
    </>
  )
}
