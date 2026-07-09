'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/firebase'
import { Send, Loader2 } from 'lucide-react'
import {
  getOrCreateDmThread,
  markDmThreadRead,
  resolveUserDisplayName,
  sendDmMessage,
  subscribeToDmMessages,
  subscribeToUserDmThreads,
  type DmMessage,
  type DmThread,
} from '@/lib/dm-queries'
import { RichTextContent } from '@/components/rich-text-content'

function otherParticipant(thread: DmThread, userId: string): string {
  return thread.participantIds.find((id) => id !== userId) || ''
}

function displayName(thread: DmThread, userId: string): string {
  const other = otherParticipant(thread, userId)
  return thread.participantNames[other] || 'Member'
}

export function DmInbox() {
  const { user, firebaseUser } = useAuth()
  const searchParams = useSearchParams()
  const toParam = searchParams.get('to')
  const threadParam = searchParams.get('thread')

  const [threads, setThreads] = useState<DmThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DmMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const userId = user?.id || firebaseUser?.uid || ''

  useEffect(() => {
    if (!userId) return
    const unsub = subscribeToUserDmThreads(userId, (rows) => {
      setThreads(rows)
      setLoading(false)
    })
    return () => unsub()
  }, [userId])

  useEffect(() => {
    if (!activeThreadId) {
      setMessages([])
      return
    }
    const unsub = subscribeToDmMessages(activeThreadId, setMessages)
    void markDmThreadRead(activeThreadId, userId)
    return () => unsub()
  }, [activeThreadId, userId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const openedRef = useRef(false)

  useEffect(() => {
    if (!userId || openedRef.current) return
    if (!threadParam && !toParam) return
    if (toParam === userId) return

    openedRef.current = true

    async function openFromParams() {
      if (threadParam) {
        setActiveThreadId(threadParam)
        return
      }
      if (!toParam || toParam === userId) return

      setBootstrapping(true)
      try {
        const token = await auth.currentUser?.getIdToken()
        const res = await fetch('/api/dm/threads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ recipientId: toParam }),
        })
        const json = await res.json()
        if (json.success && json.threadId) {
          setActiveThreadId(json.threadId)
          const stored = sessionStorage.getItem(`dm_draft_${toParam}`)
          if (stored) {
            setDraft(stored)
            sessionStorage.removeItem(`dm_draft_${toParam}`)
          }
        } else {
          const recipientName = await resolveUserDisplayName(toParam)
          const senderName =
            `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
            user?.displayName ||
            'Member'
          const threadId = await getOrCreateDmThread(userId, toParam, senderName, recipientName)
          setActiveThreadId(threadId)
        }
      } finally {
        setBootstrapping(false)
      }
    }

    void openFromParams()
  }, [userId, toParam, threadParam, user])

  const activeThread = threads.find((t) => t.id === activeThreadId)

  const handleSend = async () => {
    if (!activeThreadId || !draft.trim() || !userId) return
    const thread = activeThread || threads.find((t) => t.id === activeThreadId)
    const recipientId = thread
      ? otherParticipant(thread, userId)
      : toParam || ''

    if (!recipientId) return

    setSending(true)
    try {
      const senderName =
        `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
        user?.displayName ||
        'Member'
      await sendDmMessage({
        threadId: activeThreadId,
        senderId: userId,
        recipientId,
        content: draft.trim(),
        senderName,
      })
      setDraft('')
    } finally {
      setSending(false)
    }
  }

  if (!userId) {
    return <p className="text-muted-foreground text-sm">Sign in to view messages.</p>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[520px]">
      <div className="lg:col-span-1 border border-border rounded-lg bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-semibold text-sm">Conversations</div>
        {loading || bootstrapping ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : threads.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No conversations yet. Connect from the directory or marketplace.</p>
        ) : (
          <ul className="divide-y divide-border max-h-[480px] overflow-y-auto">
            {threads.map((thread) => {
              const unread = thread.unreadCounts[userId] || 0
              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 ${
                      activeThreadId === thread.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{displayName(thread, userId)}</span>
                      {unread > 0 && (
                        <span className="shrink-0 text-xs bg-black text-white rounded-full px-2 py-0.5">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{thread.lastMessage || 'No messages yet'}</p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="lg:col-span-2 border border-border rounded-lg bg-card flex flex-col min-h-[520px]">
        {!activeThreadId ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-8 text-center">
            Select a conversation or connect with a member from the marketplace.
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-border font-semibold text-sm">
              {activeThread ? displayName(activeThread, userId) : 'Conversation'}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.senderId === userId
                        ? 'bg-black text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <RichTextContent html={msg.content} />
                    <p className="text-[10px] opacity-70 mt-1">
                      {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message…"
                rows={2}
                className="flex-1 resize-none rounded-lg border border-border px-3 py-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void handleSend()
                  }
                }}
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending || !draft.trim()}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center bg-black text-white rounded-lg disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
