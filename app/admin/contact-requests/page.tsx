'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminTable } from '@/components/admin-table'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { Mail, MessageSquare, Trash2, Eye } from 'lucide-react'
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

export default function ContactRequestsPage() {
  const [requests, setRequests] = React.useState<ContactRequest[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'contactRequests'), (snapshot) => {
      const requestsData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => new Date(b.createdAt?.toDate?.() || 0).getTime() - new Date(a.createdAt?.toDate?.() || 0).getTime())

      setRequests(requestsData as ContactRequest[])
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleMarkAsRead = async (id: string, currentRead: boolean) => {
    try {
      await updateDoc(doc(db, 'contactRequests', id), {
        read: !currentRead,
        status: !currentRead ? 'read' : 'new',
      })
    } catch (error) {
      console.error('[v0] Error updating request:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this contact request?')) {
      try {
        await deleteDoc(doc(db, 'contactRequests', id))
      } catch (error) {
        console.error('[v0] Error deleting request:', error)
      }
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (request: ContactRequest) => (
        <div className="flex items-center gap-2">
          {!request.read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
          <span className={request.read ? '' : 'font-semibold'}>{request.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (request: ContactRequest) => (
        <a href={`mailto:${request.email}`} className="text-blue-600 hover:underline text-sm">
          {request.email}
        </a>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (request: ContactRequest) => (
        <div className="flex items-center gap-2 max-w-xs">
          <MessageSquare className="w-4 h-4 flex-shrink-0 text-gray-400" />
          <span className="truncate text-sm">{request.subject}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (request: ContactRequest) => (
        <a href={`tel:${request.phone}`} className="text-sm hover:text-blue-600">
          {request.phone || '-'}
        </a>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (request: ContactRequest) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            request.read ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}
        >
          {request.read ? 'Read' : 'New'}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Submitted',
      render: (request: ContactRequest) => (
        <span className="text-sm text-gray-600">
          {request.createdAt ? formatDistanceToNow(request.createdAt.toDate(), { addSuffix: true }) : '-'}
        </span>
      ),
    },
  ]

  const actions = [
    {
      label: 'View',
      icon: Eye,
      onClick: (item: ContactRequest) => {
        // This will be handled by Link in the table
      },
      color: 'text-blue-600',
      isLink: true,
      href: (item: ContactRequest) => `/admin/contact-requests/${item.id}`,
    },
    {
      label: 'Mark as',
      icon: Mail,
      onClick: (item: ContactRequest) => handleMarkAsRead(item.id, item.read),
      color: 'text-blue-600',
      showLabel: (item: ContactRequest) => item.read ? 'Unread' : 'Read',
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: (item: ContactRequest) => handleDelete(item.id),
      color: 'text-red-600',
    },
  ]

  return (
    <div className="p-6">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : (
        <AdminTable<ContactRequest>
          title="Contact Form Submissions"
          columns={columns}
          data={requests}
          onRowClick={(request) => {
            window.location.href = `/admin/contact-requests/${request.id}`
          }}
          actions={actions}
        />
      )}
    </div>
  )
}
}
