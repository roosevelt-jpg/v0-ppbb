'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useAuth } from '@/lib/auth-context'
import { canApproveGroupMembers, hasAdminAccess } from '@/lib/roles'
import { ChevronLeft, Send, Upload, Download, FileText, Play, Smile, Trash2, Edit2, Check, X } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore'
import { uploadGroupFile, getFileType } from '@/lib/firebase-storage'
import { format } from 'date-fns'
import EmojiPicker from 'emoji-picker-react'
import { addEmojiReaction, removeEmojiReaction, editMessage, deleteMessage, markMessageAsRead } from '@/lib/chat-utils'
import { memberCanChat } from '@/lib/community-governance'
import { triggerCommunityNotification } from '@/lib/community-notifications-client'

interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  text?: string
  fileURL?: string
  fileType?: 'image' | 'video' | 'pdf' | 'file'
  sentAt: any
  edited?: boolean
  editedAt?: any
  isDeleted?: boolean
  reactions?: { emoji: string; users: string[] }[]
  readBy?: { userId: string; readAt: any }[]
}

interface Group {
  id: string
  name: string
  description: string
  genderRestriction: string
  memberCount: number
  iconURL?: string
  createdBy?: string
  requiresApproval?: boolean
}

interface PendingMember {
  id: string
  userId: string
  userName?: string
  userEmail?: string
  userPhoto?: string
  joinedAt?: string
  joinStatus?: string
}

export default function GroupChatPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const communityId = params.id as string
  const groupId = params.groupId as string

  const [group, setGroup] = React.useState<Group | null>(null)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [newMessage, setNewMessage] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [sending, setSending] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [isMember, setIsMember] = React.useState(false)
  const [canSendMessages, setCanSendMessages] = React.useState(false)
  const [memberStatus, setMemberStatus] = React.useState<string>('active')
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [emojiPickerFor, setEmojiPickerFor] = React.useState<string | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editText, setEditText] = React.useState('')
  const [pendingMembers, setPendingMembers] = React.useState<PendingMember[]>([])
  const [pendingLoading, setPendingLoading] = React.useState(false)
  const [actingMemberId, setActingMemberId] = React.useState<string | null>(null)
  const [showPending, setShowPending] = React.useState(true)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Pending approval UI: group creator OR platform admin (API already enforces the same).
  const isGroupCreator = Boolean(user?.id && group?.createdBy && user.id === group.createdBy)
  const showPendingPanel =
    Boolean(group?.requiresApproval) &&
    (isGroupCreator || hasAdminAccess(user))

  // Check membership and load group
  React.useEffect(() => {
    if (!user) return

    let unsubscribeMessages: (() => void) | undefined

    const checkMembership = async () => {
      try {
        // Load group details first (needed for ownership check)
        const groupRes = await fetch(`/api/groups/${groupId}?communityId=${communityId}`)
        const groupData = await groupRes.json()
        if (groupData.success) {
          setGroup(groupData.data)
        }

        const groupMembersRef = collection(
          db,
          `communities/${communityId}/groups/${groupId}/members`
        )
        const q = query(groupMembersRef, where('userId', '==', user.id))
        const snapshot = await getDocs(q)

        const memberDoc = snapshot.docs[0]?.data()
        const status = String(memberDoc?.memberStatus || 'active')
        const isActiveMember =
          !snapshot.empty &&
          (memberDoc?.joinStatus === 'active' || memberDoc?.isActive !== false) &&
          memberCanChat(status)

        const ownerOrAdmin = canApproveGroupMembers(user, groupData.data?.createdBy)
        if (!isActiveMember && !ownerOrAdmin) {
          setIsMember(false)
          setCanSendMessages(false)
          setMemberStatus(status)
          setLoading(false)
          return
        }

        setIsMember(true)
        setMemberStatus(status)
        setCanSendMessages(isActiveMember && memberCanChat(status))

        const messagesRef = collection(
          db,
          `communities/${communityId}/groups/${groupId}/messages`
        )
        unsubscribeMessages = onSnapshot(messagesRef, (snap) => {
          const msgs = snap.docs
            .map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }))
            .sort((a: any, b: any) => a.sentAt?.toMillis?.() - b.sentAt?.toMillis?.())

          setMessages(msgs as Message[])
          setLoading(false)
        })
      } catch (error) {
        console.error('[v0] Error checking membership:', error)
        setLoading(false)
      }
    }

    checkMembership()
    return () => {
      unsubscribeMessages?.()
    }
  }, [user, communityId, groupId])

  const loadPendingMembers = React.useCallback(async () => {
    if (!user || !group?.requiresApproval) return
    if (!canApproveGroupMembers(user, group.createdBy)) return

    setPendingLoading(true)
    try {
      const token = await (await import('@/lib/firebase')).auth.currentUser?.getIdToken()
      const params = new URLSearchParams({
        communityId,
        groupId,
        joinStatus: 'pending',
        requesterId: user.id,
      })
      const res = await fetch(`/api/groups/members?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const json = await res.json()
      if (json.success) {
        setPendingMembers(json.data || [])
      } else if (res.status === 403) {
        setPendingMembers([])
      }
    } catch (error) {
      console.error('[v0] Error loading pending members:', error)
    } finally {
      setPendingLoading(false)
    }
  }, [user, group?.requiresApproval, group?.createdBy, communityId, groupId])

  React.useEffect(() => {
    if (showPendingPanel) {
      loadPendingMembers()
      const interval = window.setInterval(loadPendingMembers, 15000)
      return () => window.clearInterval(interval)
    }
  }, [showPendingPanel, loadPendingMembers])

  const handleMemberDecision = async (memberDocId: string, joinStatus: 'active' | 'rejected') => {
    if (!user) return
    setActingMemberId(memberDocId)
    try {
      const token = await (await import('@/lib/firebase')).auth.currentUser?.getIdToken()
      const res = await fetch('/api/groups/members', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          communityId,
          groupId,
          memberDocId,
          joinStatus,
          approvedBy: user.id,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        alert(json.error || 'Failed to update member')
        return
      }
      setPendingMembers((prev) => prev.filter((m) => m.id !== memberDocId))
    } catch (error) {
      console.error('[v0] Error updating member:', error)
      alert('Failed to update member')
    } finally {
      setActingMemberId(null)
    }
  }

  // Auto-scroll to latest message
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !canSendMessages) return

    setSending(true)
    try {
      await addDoc(collection(db, `communities/${communityId}/groups/${groupId}/messages`), {
        senderId: user.id,
        senderName: user.displayName || 'Anonymous',
        senderAvatar: user.photoURL || '',
        text: newMessage,
        sentAt: serverTimestamp(),
      })
      void triggerCommunityNotification({
        type: 'group_message',
        communityId,
        groupId,
        groupName: group?.name,
        preview: newMessage,
      })
      setNewMessage('')
    } catch (error) {
      console.error('[v0] Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !canSendMessages) return

    setUploading(true)
    try {
      const fileURL = await uploadGroupFile(communityId, groupId, file)
      const fileType = getFileType(file)

      const preview =
        fileType === 'image' ? '📷 Photo' : fileType === 'video' ? '🎬 Video' : `📎 ${file.name}`

      await addDoc(collection(db, `communities/${communityId}/groups/${groupId}/messages`), {
        senderId: user.id,
        senderName: user.displayName || 'Anonymous',
        senderAvatar: user.photoURL || '',
        fileURL,
        fileType,
        sentAt: serverTimestamp(),
        reactions: [],
        readBy: [{ userId: user.id, readAt: serverTimestamp() }],
      })
      void triggerCommunityNotification({
        type: 'group_message',
        communityId,
        groupId,
        groupName: group?.name,
        preview,
      })
    } catch (error) {
      console.error('[v0] Error uploading file:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!user) return
    try {
      await addEmojiReaction(communityId, groupId, messageId, emoji, user.id)
      setShowEmojiPicker(false)
      setEmojiPickerFor(null)
    } catch (error) {
      console.error('[v0] Error adding reaction:', error)
    }
  }

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    if (!user) return
    try {
      await removeEmojiReaction(communityId, groupId, messageId, emoji, user.id)
    } catch (error) {
      console.error('[v0] Error removing reaction:', error)
    }
  }

  const handleEditMessage = async (messageId: string) => {
    if (!editText.trim()) return
    try {
      await editMessage(communityId, groupId, messageId, editText)
      setEditingId(null)
      setEditText('')
    } catch (error) {
      console.error('[v0] Error editing message:', error)
      alert('Failed to edit message')
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return
    try {
      await deleteMessage(communityId, groupId, messageId)
    } catch (error) {
      console.error('[v0] Error deleting message:', error)
      alert('Failed to delete message')
    }
  }

  const startEditMessage = (msg: Message) => {
    setEditingId(msg.id)
    setEditText(msg.text || '')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading group...</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isMember) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto px-4 w-full">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center space-y-4">
            <h1 className="text-2xl font-bold text-black">Access Denied</h1>
            <p className="text-gray-600">You must be a member of this group to access the chat.</p>
            <Link
              href={`/communities/${communityId}`}
              className="inline-block px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium"
            >
              Back to Community
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col max-h-[calc(100vh-120px)]">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-black truncate">{group?.name}</h1>
              <p className="text-sm text-gray-600">{messages.length} messages</p>
            </div>
          </div>
          {showPendingPanel && (
            <button
              type="button"
              onClick={() => setShowPending((v) => !v)}
              className="px-3 py-2 bg-black !text-white rounded-lg text-sm font-medium hover:bg-gray-900 min-h-[44px]"
            >
              Pending Members ({pendingMembers.length})
            </button>
          )}
        </div>

        {showPendingPanel && showPending && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-amber-900">Pending Members</h2>
              <button
                type="button"
                onClick={loadPendingMembers}
                className="text-xs px-3 py-1 bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[36px]"
              >
                Refresh
              </button>
            </div>
            {pendingLoading ? (
              <p className="text-sm text-amber-800">Loading requests...</p>
            ) : pendingMembers.length === 0 ? (
              <p className="text-sm text-amber-800">No pending join requests.</p>
            ) : (
              <ul className="space-y-2">
                {pendingMembers.map((member) => (
                  <li
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-amber-200 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {member.userPhoto ? (
                        <img
                          src={member.userPhoto}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-black truncate">
                          {member.userName || member.userEmail || 'Member'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Requested{' '}
                          {member.joinedAt
                            ? format(new Date(member.joinedAt), 'MMM dd, yyyy')
                            : 'recently'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                      <button
                        type="button"
                        disabled={actingMemberId === member.id}
                        onClick={() => handleMemberDecision(member.id, 'active')}
                        className="flex-1 sm:flex-none px-3 py-2 bg-black !text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 min-h-[44px]"
                      >
                        {actingMemberId === member.id ? '…' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        disabled={actingMemberId === member.id}
                        onClick={() => handleMemberDecision(member.id, 'rejected')}
                        className="flex-1 sm:flex-none px-3 py-2 bg-red-600 !text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 min-h-[44px]"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderId === user?.id
              const isEditing = editingId === msg.id
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md space-y-1`}>
                    <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} gap-2 items-end group`}>
                      {!isOwn && msg.senderAvatar && (
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                      )}
                      
                      <div className="flex-1">
                        {!isOwn && (
                          <p className="text-xs font-medium text-gray-600 mb-1 px-2">
                            {msg.senderName}
                          </p>
                        )}
                        
                        {/* Message Bubble */}
                        {isEditing ? (
                          <div className={`rounded-lg px-4 py-2 ${isOwn ? 'bg-blue-600' : 'bg-gray-200'}`}>
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full p-2 rounded border border-gray-300 text-sm"
                              rows={2}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleEditMessage(msg.id)}
                                className="flex items-center gap-1 px-2 py-1 bg-black text-white rounded text-xs hover:bg-neutral-800"
                              >
                                <Check size={14} />
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null)
                                  setEditText('')
                                }}
                                className="flex items-center gap-1 px-2 py-1 bg-white text-black border border-black rounded text-xs hover:bg-neutral-50"
                              >
                                <X size={14} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`rounded-lg px-4 py-2 relative ${
                              isOwn
                                ? 'bg-black text-white'
                                : 'bg-white text-black border border-gray-200'
                            }`}
                          >
                            {msg.isDeleted ? (
                              <p className="text-sm italic opacity-50">[Message deleted]</p>
                            ) : (
                              <>
                                {msg.text && <p className="text-sm break-words">{msg.text}</p>}

                                {msg.fileType === 'image' && msg.fileURL && (
                                  <img
                                    src={msg.fileURL}
                                    alt="Shared image"
                                    className="max-w-xs rounded mt-2"
                                  />
                                )}

                                {msg.fileType === 'video' && msg.fileURL && (
                                  <video
                                    src={msg.fileURL}
                                    controls
                                    className="max-w-xs rounded mt-2"
                                  />
                                )}

                                {msg.fileType === 'pdf' && msg.fileURL && (
                                  <a
                                    href={msg.fileURL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 mt-2 text-blue-600 hover:underline"
                                  >
                                    <FileText size={16} />
                                    Download PDF
                                  </a>
                                )}

                                {msg.fileType === 'file' && msg.fileURL && (
                                  <a
                                    href={msg.fileURL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 mt-2 text-blue-600 hover:underline"
                                  >
                                    <Download size={16} />
                                    Download File
                                  </a>
                                )}

                                <div className="flex justify-between items-center mt-1">
                                  <p className={`text-xs ${isOwn ? 'text-gray-300' : 'text-gray-500'}`}>
                                    {msg.sentAt && format(msg.sentAt.toDate(), 'HH:mm')}
                                    {msg.edited && ' (edited)'}
                                  </p>
                                  
                                  {/* Message Actions */}
                                  <div className={`flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2`}>
                                    <button
                                      onClick={() => setEmojiPickerFor(msg.id)}
                                      className="p-1 hover:bg-gray-200 rounded"
                                    >
                                      <Smile size={14} className="text-gray-600" />
                                    </button>
                                    {isOwn && (
                                      <>
                                        <button
                                          onClick={() => startEditMessage(msg)}
                                          className="p-1 hover:bg-gray-200 rounded"
                                        >
                                          <Edit2 size={14} className="text-gray-600" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteMessage(msg.id)}
                                          className="p-1 hover:bg-gray-200 rounded"
                                        >
                                          <Trash2 size={14} className="text-red-600" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Emoji Picker */}
                    {emojiPickerFor === msg.id && (
                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ml-2`}>
                        <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
                          <EmojiPicker
                            onEmojiClick={(e) => {
                              handleAddReaction(msg.id, e.emoji)
                            }}
                            width={300}
                            height={300}
                          />
                        </div>
                      </div>
                    )}

                    {/* Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 px-2 mt-1">
                        {msg.reactions.map((reaction) => (
                          <button
                            key={reaction.emoji}
                            onClick={() => {
                              const hasReacted = reaction.users.includes(user?.id || '')
                              if (hasReacted) {
                                handleRemoveReaction(msg.id, reaction.emoji)
                              } else {
                                handleAddReaction(msg.id, reaction.emoji)
                              }
                            }}
                            title={reaction.users.join(', ')}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm border transition-colors ${
                              reaction.users.includes(user?.id || '')
                                ? 'bg-yellow-100 border-yellow-300'
                                : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                            }`}
                          >
                            <span>{reaction.emoji}</span>
                            <span className="text-xs text-gray-600">{reaction.users.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {!canSendMessages && isMember && (
          <div className="bg-amber-50 border-t border-amber-200 px-4 py-3 text-sm text-amber-900">
            {memberStatus === 'suspended'
              ? 'Your membership is suspended. You can read messages but cannot send new ones.'
              : memberStatus === 'banned'
                ? 'You are banned from this group.'
                : 'You cannot send messages in this group right now.'}
          </div>
        )}
        <form
          onSubmit={handleSendMessage}
          className="bg-white border-t border-gray-200 p-4 space-y-2"
        >
          {showEmojiPicker && (
            <div className="flex justify-start mb-2">
              <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
                <EmojiPicker
                  onEmojiClick={(e) => {
                    setNewMessage(newMessage + e.emoji)
                  }}
                  width={300}
                  height={300}
                />
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <label className="cursor-pointer hover:opacity-70 p-2">
              <Upload size={20} className="text-gray-600" />
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading || sending || !canSendMessages}
                className="hidden"
                accept="image/*,video/*,.pdf"
              />
            </label>

            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={!canSendMessages}
              className="p-2 hover:opacity-70 disabled:opacity-40"
            >
              <Smile size={20} className="text-gray-600" />
            </button>

            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={canSendMessages ? 'Type a message...' : 'Messaging disabled'}
              disabled={sending || uploading || !canSendMessages}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={sending || uploading || !newMessage.trim() || !canSendMessages}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={18} />
              Send
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  )
}
