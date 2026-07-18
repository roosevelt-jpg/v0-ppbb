'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/firebase'
import { Send, Loader2, ArrowLeft } from 'lucide-react'
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

async function resolveRecipientUserId(rawId: string): Promise<string> {
  try {
    const { doc: fsDoc, getDoc } = await import('firebase/firestore')
    const { db } = await import('@/lib/firebase')
    const bizSnap = await getDoc(fsDoc(db, 'businesses', rawId))
    if (bizSnap.exists()) {
      const data = bizSnap.data()
      return (
        (typeof data.ownerId === 'string' && data.ownerId) ||
        (typeof data.userId === 'string' && data.userId) ||
        (typeof data.createdBy === 'string' && data.createdBy) ||
        rawId
      )
    }
  } catch {
    /* treat as user id */
  }
  return rawId
}

export type DmInboxProps = {
  /** Force-open a conversation with this user id (takes priority over ?to=) */
  recipientId?: string
  /** Optional display name while the thread is bootstrapping */
  recipientLabel?: string
  /** Hide the conversations list — focus on one chat (Network page) */
  focused?: boolean
  /** Called when user wants to leave focused chat */
  onBack?: () => void
  backLabel?: string
}

export function DmInbox({
  recipientId: recipientIdProp,
  recipientLabel,
  focused = false,
  onBack,
  backLabel = 'Back',
}: DmInboxProps = {}) {
  const { user, firebaseUser } = useAuth()
  const searchParams = useSearchParams()
  const toParam = recipientIdProp || searchParams.get('to')
  const threadParam = searchParams.get('thread')

  const [threads, setThreads] = useState<DmThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DmMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(false)
  const [openError, setOpenError] = useState<string | null>(null)
  const [headerName, setHeaderName] = useState(recipientLabel || '')
  const endRef = useRef<HTMLDivElement>(null)

  const userId = user?.id || firebaseUser?.uid || ''
  const openedKeyRef = useRef<string>('')

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

  useEffect(() => {
    if (recipientLabel) setHeaderName(recipientLabel)
  }, [recipientLabel])

  // Open the requested recipient / thread once — do not depend on activeThreadId (race)
  useEffect(() => {
    if (!userId) return
    if (!threadParam && !toParam) return
    if (toParam === userId) {
      setOpenError('You cannot message yourself.')
      return
    }

    const key = `${threadParam || ''}|${toParam || ''}`
    if (openedKeyRef.current === key) return
    openedKeyRef.current = key

    let cancelled = false

    async function openFromParams() {
      setOpenError(null)
      if (threadParam) {
        if (!cancelled) setActiveThreadId(threadParam)
        return
      }
      if (!toParam || toParam === userId) return

      setBootstrapping(true)
      try {
        const recipientId = await resolveRecipientUserId(toParam)
        if (cancelled) return

        const token = await auth.currentUser?.getIdToken()
        const res = await fetch('/api/dm/threads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ recipientId }),
        })
        const json = await res.json()
        if (cancelled) return

        if (json.success && json.threadId) {
          setActiveThreadId(json.threadId)
          if (typeof json.recipientName === 'string' && json.recipientName) {
            setHeaderName(json.recipientName)
          }
          const stored = sessionStorage.getItem(`dm_draft_${toParam}`)
          if (stored) {
            setDraft(stored)
            sessionStorage.removeItem(`dm_draft_${toParam}`)
          }
          return
        }

        const recipientName = await resolveUserDisplayName(recipientId)
        const senderName =
          `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
          user?.displayName ||
          'Member'
        const threadId = await getOrCreateDmThread(userId, recipientId, senderName, recipientName)
        if (cancelled) return
        setActiveThreadId(threadId)
        setHeaderName(recipientName)
        const stored = sessionStorage.getItem(`dm_draft_${toParam}`)
        if (stored) {
          setDraft(stored)
          sessionStorage.removeItem(`dm_draft_${toParam}`)
        }
      } catch (err) {
        if (!cancelled) {
          setOpenError(err instanceof Error ? err.message : 'Could not open conversation')
          openedKeyRef.current = '' // allow retry
        }
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    }

    void openFromParams()
    return () => {
      cancelled = true
    }
  }, [userId, toParam, threadParam, user])

  const activeThread = threads.find((t) => t.id === activeThreadId)

  useEffect(() => {
    if (activeThread && userId) {
      setHeaderName(displayName(activeThread, userId))
    }
  }, [activeThread, userId])

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

  const showMobileConversation = Boolean(activeThreadId)
  const chatTitle =
    headerName ||
    (activeThread ? displayName(activeThread, userId) : null) ||
    recipientLabel ||
    'Conversation'

  const chatPanel = (
    <div
      className={`border border-border rounded-lg bg-card flex flex-col min-h-[min(520px,70vh)] lg:min-h-[520px] min-w-0 ${
        focused ? 'flex h-full min-h-[420px]' : showMobileConversation ? 'flex' : 'hidden lg:flex'
      } ${focused ? '' : 'lg:col-span-2'}`}
    >
      {!activeThreadId && !bootstrapping ? (
        <div className="flex-1 flex flex-col items-center justify-center text-sm text-muted-foreground p-6 sm:p-8 text-center gap-3">
          {openError ? <p className="text-red-600">{openError}</p> : null}
          <p>
            {focused
              ? 'Opening conversation…'
              : 'Select a conversation or connect with a member from Network.'}
          </p>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-medium underline"
            >
              <ArrowLeft className="w-4 h-4" />
              {backLabel}
            </button>
          ) : null}
        </div>
      ) : bootstrapping && !activeThreadId ? (
        <div className="flex-1 flex justify-center items-center p-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="px-4 py-3 border-b border-border font-semibold text-sm flex items-center gap-2 min-h-[44px]">
            {onBack || (!focused && showMobileConversation) ? (
              <button
                type="button"
                onClick={() => {
                  if (onBack) onBack()
                  else setActiveThreadId(null)
                }}
                className={`${focused ? 'inline-flex' : 'lg:hidden inline-flex'} items-center justify-center min-h-[36px] min-w-[36px] rounded-lg hover:bg-muted`}
                aria-label={backLabel}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : null}
            <span className="truncate">{chatTitle}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-0">
            {messages.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No messages yet — say hello to {chatTitle}.
              </p>
            ) : null}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[85%] rounded-lg px-3 py-2 text-sm min-w-0 ${
                    msg.senderId === userId
                      ? 'bg-black text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <RichTextContent html={msg.content} className="text-inherit" />
                  <p className="text-[10px] opacity-70 mt-1">
                    {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t border-border flex flex-col sm:flex-row gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a message…"
              rows={2}
              className="flex-1 min-h-[44px] resize-none rounded-lg border border-border px-3 py-2 text-sm w-full min-w-0"
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
              disabled={sending || !draft.trim() || !activeThreadId}
              className="min-h-[44px] min-w-[44px] sm:self-end inline-flex items-center justify-center bg-black text-white rounded-lg disabled:opacity-50 shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </>
      )}
    </div>
  )

  if (focused) {
    return chatPanel
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[min(520px,70vh)] lg:min-h-[520px]">
      <div
        className={`lg:col-span-1 border border-border rounded-lg bg-card overflow-hidden min-w-0 ${
          showMobileConversation ? 'hidden lg:block' : 'block'
        }`}
      >
        <div className="px-4 py-3 border-b border-border font-semibold text-sm">Conversations</div>
        {loading || bootstrapping ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : threads.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No conversations yet. Connect from Network / Connections.
          </p>
        ) : (
          <ul className="divide-y divide-border max-h-[480px] overflow-y-auto">
            {threads.map((thread) => {
              const unread = thread.unreadCounts[userId] || 0
              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full text-left px-4 py-3 min-h-[44px] hover:bg-muted/50 ${
                      activeThreadId === thread.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">
                        {displayName(thread, userId)}
                      </span>
                      {unread > 0 ? (
                        <span className="shrink-0 text-xs bg-black text-white rounded-full px-2 py-0.5">
                          {unread}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {thread.lastMessage || 'No messages yet'}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {chatPanel}
    </div>
  )
}
