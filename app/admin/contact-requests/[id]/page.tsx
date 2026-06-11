'use client'

export const dynamic = 'force-dynamic'
import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, Send, Mail, Clock, User, Phone, FileText } from 'lucide-react'
import Link from 'next/link'

interface ContactRequest {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied' | 'closed'
  read: boolean
  createdAt: any
}

interface Reply {
  id: string
  message: string
  senderType: 'admin' | 'user'
  senderEmail: string
  senderName: string
  createdAt: any
  status: 'sent' | 'sending' | 'failed'
}

export default function ContactRequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string

  const [request, setRequest] = useState<ContactRequest | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [replyMessage, setReplyMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!requestId) return

    // Load contact request
    const loadRequest = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'contactRequests', requestId as string))
        if (docSnap.exists()) {
          setRequest({ id: docSnap.id, ...docSnap.data() } as ContactRequest)
          
          // Mark as read
          if (!docSnap.data().read) {
            await updateDoc(doc(db, 'contactRequests', requestId as string), {
              read: true,
              status: 'read',
            })
          }
        }
        setLoading(false)
      } catch (err) {
        console.error('[v0] Error loading request:', err)
        setError('Failed to load contact request')
        setLoading(false)
      }
    }

    loadRequest()
  }, [requestId])

  // Subscribe to replies
  useEffect(() => {
    if (!requestId) return

    const q = query(collection(db, 'contactReplies'), where('contactRequestId', '==', requestId))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const repliesData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => new Date(a.createdAt?.toDate?.() || 0).getTime() - new Date(b.createdAt?.toDate?.() || 0).getTime())
      setReplies(repliesData as Reply[])
    })

    return () => unsubscribe()
  }, [requestId])

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyMessage.trim() || !request) return

    setSending(true)
    setError('')
    setSuccess('')

    try {
      // Save reply to Firestore
      const replyDocRef = await addDoc(collection(db, 'contactReplies'), {
        contactRequestId: requestId,
        message: replyMessage,
        senderType: 'admin',
        senderEmail: 'admin@passiveblessings.ae',
        senderName: 'Passive Blessings Team',
        createdAt: serverTimestamp(),
        status: 'sending',
      })

      // Send email via API
      try {
        const response = await fetch('/api/send-contact-reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: request.email,
            toName: request.name,
            subject: `Re: ${request.subject}`,
            message: replyMessage,
            contactRequestId: requestId,
            replyDocId: replyDocRef.id,
          }),
        })

        if (response.ok) {
          // Update reply status to sent
          await updateDoc(doc(db, 'contactReplies', replyDocRef.id), {
            status: 'sent',
          })

          // Update contact request status
          await updateDoc(doc(db, 'contactRequests', requestId), {
            status: 'replied',
          })

          setSuccess('Reply sent successfully!')
          setReplyMessage('')
        } else {
          throw new Error('Failed to send email')
        }
      } catch (emailError) {
        console.error('[v0] Email send error:', emailError)
        // Update reply status to failed but keep it for reference
        await updateDoc(doc(db, 'contactReplies', replyDocRef.id), {
          status: 'failed',
        })
        setError('Reply saved but email failed to send. Please check SendGrid configuration.')
      }
    } catch (err) {
      console.error('[v0] Error saving reply:', err)
      setError('Failed to send reply. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const markAsClosed = async () => {
    if (!request) return
    try {
      await updateDoc(doc(db, 'contactRequests', requestId), {
        status: 'closed',
      })
      setRequest({ ...request, status: 'closed' })
      setSuccess('Contact request marked as closed')
    } catch (err) {
      setError('Failed to update status')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Contact request not found</p>
          <Link href="/admin/contact-requests">
            <Button className="bg-black text-white hover:bg-gray-800">
              Back to Contact Requests
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6 px-6 pt-6">
        <Link href="/admin/contact-requests">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{request.subject}</h1>
          <p className="text-gray-600">From {request.name}</p>
        </div>
      </div>

      <div className="px-6 pb-6 grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Message */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Original Message
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700 whitespace-pre-wrap">{request.message}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">From:</p>
                <p className="font-medium">{request.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Contact Email:</p>
                <a href={`mailto:${request.email}`} className="text-blue-600 hover:underline">
                  {request.email}
                </a>
              </div>
              {request.phone && (
                <div>
                  <p className="text-gray-600">Phone:</p>
                  <a href={`tel:${request.phone}`} className="text-blue-600 hover:underline">
                    {request.phone}
                  </a>
                </div>
              )}
              <div>
                <p className="text-gray-600">Subject:</p>
                <p className="font-medium">{request.subject}</p>
              </div>
            </div>
          </Card>

          {/* Replies Thread */}
          {replies.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Reply Thread</h2>
              <div className="space-y-4">
                {replies.map((reply) => (
                  <div key={reply.id} className={`p-4 rounded-lg border-l-4 ${reply.senderType === 'admin' ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-300'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{reply.senderName}</p>
                        <p className="text-sm text-gray-600">{reply.senderEmail}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${reply.status === 'sent' ? 'bg-green-100 text-green-800' : reply.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {reply.status}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{reply.message}</p>
                    <p className="text-xs text-gray-600">
                      {reply.createdAt ? formatDistanceToNow(reply.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Reply Form */}
          {request.status !== 'closed' && (
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Send Reply
              </h2>
              <form onSubmit={handleSendReply}>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                    {success}
                  </div>
                )}
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none mb-4"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={sending || !replyMessage.trim()}
                    className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  A copy will be sent to {request.email}
                </p>
              </form>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status Card */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Status & Actions</h3>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${request.status === 'closed' ? 'bg-gray-500' : request.status === 'replied' ? 'bg-green-500' : 'bg-blue-500'}`} />
                <span className="font-medium">{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span>
              </div>
            </div>
            {request.status !== 'closed' && (
              <Button
                onClick={markAsClosed}
                className="w-full bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors"
              >
                Mark as Closed
              </Button>
            )}
          </Card>

          {/* Info Card */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Details</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Name
                </p>
                <p className="font-medium">{request.name}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Email
                </p>
                <a href={`mailto:${request.email}`} className="text-blue-600 hover:underline break-all">
                  {request.email}
                </a>
              </div>
              {request.phone && (
                <div>
                  <p className="text-gray-600 mb-1 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </p>
                  <a href={`tel:${request.phone}`} className="text-blue-600 hover:underline">
                    {request.phone}
                  </a>
                </div>
              )}
              <div>
                <p className="text-gray-600 mb-1 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Submitted
                </p>
                <p className="font-medium">
                  {request.createdAt ? formatDistanceToNow(request.createdAt.toDate(), { addSuffix: true }) : 'Recently'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
