'use client'

import React, { useState, useEffect, useRef } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { ChatbotAvatar } from '@/components/chatbot-avatar'
import { LinkifiedText } from '@/components/chat/linkified-text'
import { ChatbotKnowledgePanel } from '@/components/admin/chatbot-knowledge-panel'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Send, Search } from 'lucide-react'
import { BUTTON_PRIMARY } from '@/lib/admin-design-system'
import { useAdminAudit } from '@/lib/use-admin-audit'
import { useAuth } from '@/lib/auth-context'

interface Conversation {
  id: string
  userId: string
  userRole: string
  title: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }>
  status: string
  category: string
  sentiment: string
  createdAt: Date
  lastMessageAt: Date
  adminReply?: string
  adminResolved?: boolean
}

type ChatbotTab = 'conversations' | 'knowledge'

export default function AdminChatbotPage() {
  const audit = useAdminAudit()
  const { user, firebaseUser } = useAuth()
  const [tab, setTab] = useState<ChatbotTab>('conversations')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvId, setSelectedConvId] = useState<string>('')
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [replyText, setReplyText] = useState('')
  const [replySending, setReplySending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user || !firebaseUser) return

    let unsubscribe: (() => void) | undefined
    let cancelled = false

    const subscribe = async () => {
      try {
        await firebaseUser.getIdToken(true)
        if (cancelled) return

        unsubscribe = onSnapshot(
          collection(db, 'conversations'),
          (snapshot) => {
            const convs = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
              createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
              lastMessageAt: docSnap.data().lastMessageAt?.toDate?.() || new Date(),
              messages: (docSnap.data().messages || []).map((m: any) => ({
                ...m,
                timestamp: m.timestamp?.toDate?.() || new Date(),
              })),
            })) as Conversation[]

            setConversations(convs)
            setLoading(false)

            if (convs.length > 0 && !selectedConvId) {
              setSelectedConvId(convs[0].id)
            }
          },
          (error) => {
            console.error('[v0] conversations onSnapshot permission error:', error)
            setLoading(false)
          }
        )
      } catch (error) {
        console.error('[v0] Error preparing conversations subscription:', error)
        setLoading(false)
      }
    }

    void subscribe()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [user?.id, firebaseUser])

  useEffect(() => {
    if (selectedConvId) {
      const conv = conversations.find((c) => c.id === selectedConvId)
      setSelectedConv(conv || null)
    }
  }, [selectedConvId, conversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConv?.messages])

  const filteredConversations = conversations.filter((conv) => {
    if (filterStatus !== 'all' && conv.status !== filterStatus) return false
    if (searchTerm && !conv.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const handleReply = async () => {
    if (!replyText.trim() || !selectedConv || replySending) return

    setReplySending(true)
    try {
      const adminReply = `[Admin Reply]: ${replyText}\n\nResolved at: ${new Date().toLocaleString()}`

      await updateDoc(doc(db, 'conversations', selectedConv.id), {
        adminReply,
        adminResolved: true,
        status: 'resolved',
        updatedAt: new Date(),
      })
      audit({
        actionType: 'update',
        action: `Resolved chatbot conversation: ${selectedConv.title || selectedConv.id}`,
        entityType: 'content',
        entityId: selectedConv.id,
        entityName: selectedConv.title,
        status: 'success',
      })

      setReplyText('')
    } catch (error) {
      console.error('[v0] Error sending reply:', error)
    } finally {
      setReplySending(false)
    }
  }

  const updateConversationStatus = async (convId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'conversations', convId), {
        status: newStatus,
        updatedAt: new Date(),
      })
      audit({
        actionType: 'update',
        action: `Set conversation status to ${newStatus}: ${convId}`,
        entityType: 'content',
        entityId: convId,
        status: 'success',
      })
    } catch (error) {
      console.error('[v0] Error updating status:', error)
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800'
      case 'negative':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'escalated':
        return 'bg-orange-100 text-orange-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  const tabBtn = (id: ChatbotTab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={
        tab === id
          ? '!bg-black !text-white border border-black px-4 py-2 rounded-lg text-sm font-semibold'
          : 'pb-outline-btn px-4 text-sm font-semibold'
      }
    >
      {label}
    </button>
  )

  return (
    <AdminPageLayout
      title="Chatbot Management"
      subtitle="Conversations inbox and knowledge the bot can share with users"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-start gap-4">
          <ChatbotAvatar size={48} className="w-10 h-10 sm:w-12 sm:h-12 shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-neutral-900">
              Chatbot Management
            </h1>
            <p className="text-neutral-600 mt-1 font-body">
              Manage support chats. The bot answers using Anthropic Claude with your FAQs and training docs
              (add an API key under Admin → Integrations); it falls back to FAQ-only matching if no key is set.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabBtn('conversations', 'Conversations')}
          {tabBtn('knowledge', 'Training docs')}
        </div>

        {tab === 'knowledge' ? (
          <ChatbotKnowledgePanel />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-6 border border-neutral-200">
                <p className="text-sm text-neutral-600 font-medium">Total Conversations</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{conversations.length}</p>
              </Card>

              <Card className="p-6 border border-neutral-200">
                <p className="text-sm text-neutral-600 font-medium">Active</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {conversations.filter((c) => c.status === 'active').length}
                </p>
              </Card>

              <Card className="p-6 border border-neutral-200">
                <p className="text-sm text-neutral-600 font-medium">Resolved</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {conversations.filter((c) => c.status === 'resolved').length}
                </p>
              </Card>

              <Card className="p-6 border border-neutral-200">
                <p className="text-sm text-neutral-600 font-medium">Escalated</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {conversations.filter((c) => c.status === 'escalated').length}
                </p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <Card className="border border-neutral-200 flex flex-col h-96">
                  <div className="p-4 border-b border-neutral-200 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="resolved">Resolved</option>
                      <option value="escalated">Escalated</option>
                    </select>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-neutral-200">
                    {loading ? (
                      <div className="p-4 text-center text-neutral-500">Loading...</div>
                    ) : filteredConversations.length === 0 ? (
                      <div className="p-4 text-center text-neutral-500 text-sm">
                        No conversations found
                      </div>
                    ) : (
                      filteredConversations.map((conv) => (
                        <button
                          key={conv.id}
                          type="button"
                          onClick={() => setSelectedConvId(conv.id)}
                          className={`w-full text-left p-3 transition border-l-2 shadow-none min-h-0 rounded-none font-normal ${
                            selectedConvId === conv.id
                              ? 'border-l-blue-600 !bg-neutral-200 !text-neutral-900'
                              : 'border-l-transparent !bg-neutral-100 !text-neutral-900 hover:!bg-neutral-200'
                          }`}
                        >
                          <h4 className="text-sm font-medium text-neutral-900 truncate">
                            {conv.title}
                          </h4>
                          <p className="text-xs text-neutral-500 mt-1">{conv.userRole}</p>
                          <div className="flex gap-1 mt-2">
                            <Badge className={getSentimentColor(conv.sentiment)}>
                              {conv.sentiment}
                            </Badge>
                            <Badge className={getStatusColor(conv.status)}>{conv.status}</Badge>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-2">
                {selectedConv ? (
                  <Card className="border border-neutral-200 flex flex-col h-96">
                    <div className="p-4 border-b border-neutral-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-neutral-900">{selectedConv.title}</h3>
                          <p className="text-xs text-neutral-500 mt-1">
                            User Role: {selectedConv.userRole}
                          </p>
                          <p className="text-xs text-neutral-500">
                            Category: {selectedConv.category}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={selectedConv.status}
                            onChange={(e) =>
                              updateConversationStatus(selectedConv.id, e.target.value)
                            }
                            className="px-3 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="resolved">Resolved</option>
                            <option value="escalated">Escalated</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {selectedConv.messages.map((message, idx) => (
                        <div
                          key={idx}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-3 py-2 rounded text-sm ${
                              message.role === 'user'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-neutral-100 text-neutral-900'
                            }`}
                          >
                            <p>
                              <LinkifiedText text={message.content} />
                            </p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}

                      {selectedConv.adminReply && (
                        <div className="flex justify-start mt-4 pt-4 border-t border-neutral-200">
                          <div className="bg-green-50 border border-green-200 p-3 rounded text-sm text-green-900 max-w-xs">
                            <p className="font-medium">Admin Response:</p>
                            <p className="mt-1">{selectedConv.adminReply}</p>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>

                    {!selectedConv.adminResolved && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          void handleReply()
                        }}
                        className="p-4 border-t border-neutral-200"
                      >
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Send admin reply..."
                            disabled={replySending}
                            className="flex-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-50"
                          />
                          <button
                            type="submit"
                            disabled={replySending || !replyText.trim()}
                            className={`${BUTTON_PRIMARY} !text-white text-sm`}
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    )}
                  </Card>
                ) : (
                  <Card className="p-12 border border-neutral-200 text-center">
                    <ChatbotAvatar size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-neutral-500">Select a conversation to view details</p>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminPageLayout>
  )
}
