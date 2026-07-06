'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useAuth } from '@/lib/auth-context'
import { ChevronLeft, Send, Upload, Download, FileText, Play } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore'
import { uploadGroupFile, getFileType } from '@/lib/firebase-storage'
import { format } from 'date-fns'

interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  text?: string
  fileURL?: string
  fileType?: 'image' | 'video' | 'pdf' | 'file'
  sentAt: any
}

interface Group {
  id: string
  name: string
  description: string
  genderRestriction: string
  memberCount: number
  iconURL?: string
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
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Check membership and load group
  React.useEffect(() => {
    if (!user) return

    const checkMembership = async () => {
      try {
        const groupMembersRef = collection(
          db,
          `communities/${communityId}/groups/${groupId}/members`
        )
        const q = query(groupMembersRef, where('userId', '==', user.id))
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
          setIsMember(false)
          setLoading(false)
          return
        }

        setIsMember(true)

        // Load group details
        const groupRes = await fetch(`/api/groups/${groupId}?communityId=${communityId}`)
        const groupData = await groupRes.json()
        if (groupData.success) {
          setGroup(groupData.data)
        }

        // Subscribe to messages
        const messagesRef = collection(
          db,
          `communities/${communityId}/groups/${groupId}/messages`
        )
        const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
          const msgs = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .sort((a, b) => a.sentAt?.toMillis?.() - b.sentAt?.toMillis?.())

          setMessages(msgs as Message[])
          setLoading(false)
        })

        return unsubscribe
      } catch (error) {
        console.error('[v0] Error checking membership:', error)
        setLoading(false)
      }
    }

    checkMembership()
  }, [user, communityId, groupId])

  // Auto-scroll to latest message
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !isMember) return

    setSending(true)
    try {
      await addDoc(collection(db, `communities/${communityId}/groups/${groupId}/messages`), {
        senderId: user.id,
        senderName: user.displayName || 'Anonymous',
        senderAvatar: user.photoURL || '',
        text: newMessage,
        sentAt: serverTimestamp(),
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
    if (!file || !user || !isMember) return

    setUploading(true)
    try {
      const fileURL = await uploadGroupFile(communityId, groupId, file)
      const fileType = getFileType(file)

      await addDoc(collection(db, `communities/${communityId}/groups/${groupId}/messages`), {
        senderId: user.id,
        senderName: user.displayName || 'Anonymous',
        senderAvatar: user.photoURL || '',
        fileURL,
        fileType,
        sentAt: serverTimestamp(),
      })
    } catch (error) {
      console.error('[v0] Error uploading file:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
    }
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
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-black">{group?.name}</h1>
              <p className="text-sm text-gray-600">{messages.length} messages</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderId === user?.id
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex gap-2`}>
                    {!isOwn && msg.senderAvatar && (
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      {!isOwn && (
                        <p className="text-xs font-medium text-gray-600 mb-1">
                          {msg.senderName}
                        </p>
                      )}
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isOwn
                            ? 'bg-black text-white'
                            : 'bg-white text-black border border-gray-200'
                        }`}
                      >
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

                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? 'text-gray-200' : 'text-gray-500'
                          }`}
                        >
                          {msg.sentAt &&
                            format(msg.sentAt.toDate(), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSendMessage}
          className="bg-white border-t border-gray-200 p-4 flex gap-2"
        >
          <label className="cursor-pointer hover:opacity-70">
            <Upload size={20} className="text-gray-600" />
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading || sending}
              className="hidden"
              accept="image/*,video/*,.pdf"
            />
          </label>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending || uploading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={sending || uploading || !newMessage.trim()}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 flex items-center gap-2"
          >
            <Send size={18} />
            Send
          </button>
        </form>
      </main>

      <Footer />
    </div>
  )
}
