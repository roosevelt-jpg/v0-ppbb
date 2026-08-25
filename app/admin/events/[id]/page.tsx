'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import type { Event } from '@/lib/event-types'
import { CheckCircle, XCircle, AlertCircle, ChevronLeft, Edit2 } from 'lucide-react'

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  
  const [event, setEvent] = React.useState<Event | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [approvalNotes, setApprovalNotes] = React.useState('')

  React.useEffect(() => {
    loadEvent()
  }, [eventId])

  const loadEvent = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`)
      const json = await res.json()
      if (json.success && json.data) {
        setEvent(Array.isArray(json.data) ? json.data[0] : json.data)
      }
    } catch (err) {
      console.error('[v0] Error loading event:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventId,
          status: 'published',
          approvedAt: new Date().toISOString(),
          approvalNotes,
        }),
      })
      const json = await res.json()
      if (json.success) {
        loadEvent()
        setApprovalNotes('')
      }
    } catch (err) {
      console.error('[v0] Error approving event:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventId,
          status: 'rejected',
          approvalNotes,
        }),
      })
      const json = await res.json()
      if (json.success) {
        loadEvent()
        setApprovalNotes('')
      }
    } catch (err) {
      console.error('[v0] Error rejecting event:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestChanges = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventId,
          status: 'changes_requested',
          approvalNotes,
        }),
      })
      const json = await res.json()
      if (json.success) {
        loadEvent()
        setApprovalNotes('')
      }
    } catch (err) {
      console.error('[v0] Error requesting changes:', err)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title="Event Details">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500 dark:text-muted-foreground">Loading event...</p>
        </div>
      </AdminPageLayout>
    )
  }

  if (!event) {
    return (
      <AdminPageLayout title="Event Details">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-muted-foreground">Event not found</p>
        </div>
      </AdminPageLayout>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'bg-amber-100 text-amber-800'
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'changes_requested':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 dark:bg-muted text-gray-800 dark:text-foreground'
    }
  }

  return (
    <AdminPageLayout title="Event Details">
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground mb-4"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-foreground">{event.title}</h1>
            <p className="text-gray-600 dark:text-muted-foreground mt-1">{event.description}</p>
          </div>
          <span className={`px-4 py-2 rounded-full font-medium text-sm ${getStatusColor(event.status)}`}>
            {event.status?.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card style={{ padding: '16px' }}>
            <p className="text-xs text-gray-600 dark:text-muted-foreground">Date</p>
            <p className="text-sm font-semibold mt-1">{format(new Date(event.startDate), 'MMM dd, yyyy')}</p>
          </Card>
          <Card style={{ padding: '16px' }}>
            <p className="text-xs text-gray-600 dark:text-muted-foreground">Category</p>
            <p className="text-sm font-semibold mt-1">{event.category}</p>
          </Card>
          <Card style={{ padding: '16px' }}>
            <p className="text-xs text-gray-600 dark:text-muted-foreground">Attendees</p>
            <p className="text-sm font-semibold mt-1">{event.currentAttendees}/{event.maxAttendees || '∞'}</p>
          </Card>
          <Card style={{ padding: '16px' }}>
            <p className="text-xs text-gray-600 dark:text-muted-foreground">Revenue</p>
            <p className="text-sm font-semibold mt-1">AED {event.totalRevenue}</p>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card style={{ padding: '24px' }}>
              <h3 className="text-lg font-semibold mb-4">Location</h3>
              <div className="space-y-2 text-sm">
                <p><strong>{event.locationName}</strong></p>
                <p className="text-gray-600 dark:text-muted-foreground">{event.locationAddress}</p>
              </div>
            </Card>

            {event.speakers && event.speakers.length > 0 && (
              <Card style={{ padding: '24px' }}>
                <h3 className="text-lg font-semibold mb-4">Speakers</h3>
                <div className="space-y-3">
                  {event.speakers.map((speaker, idx) => (
                    <div key={idx} className="pb-3 border-b border-gray-200 dark:border-border last:border-0">
                      <p className="font-medium">{speaker.name}</p>
                      {speaker.title && <p className="text-xs text-gray-600 dark:text-muted-foreground">{speaker.title}</p>}
                      {speaker.bio && <p className="text-sm text-gray-700 dark:text-foreground mt-1">{speaker.bio}</p>}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {event.agenda && event.agenda.length > 0 && (
              <Card style={{ padding: '24px' }}>
                <h3 className="text-lg font-semibold mb-4">Agenda</h3>
                <div className="space-y-2">
                  {event.agenda.map((item, idx) => (
                    <div key={idx} className="flex gap-4 text-sm">
                      <span className="font-mono font-semibold text-gray-700 dark:text-foreground min-w-16">{item.time}</span>
                      <span>{item.title}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {event.status === 'pending_approval' && (
              <Card style={{ backgroundColor: '#fff8f7', borderColor: '#ffcccc', padding: '24px' }}>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle size={20} className="text-orange-600" />
                  Needs Approval
                </h3>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '13px',
                    backgroundColor: 'var(--input)',
                    color: 'var(--foreground)',
                  }}
                />
                <div className="space-y-2">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      opacity: actionLoading ? 0.6 : 1,
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle size={16} />
                      Approve
                    </span>
                  </button>
                  <button
                    onClick={handleRequestChanges}
                    disabled={actionLoading}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#f59e0b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      opacity: actionLoading ? 0.6 : 1,
                    }}
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      opacity: actionLoading ? 0.6 : 1,
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <XCircle size={16} />
                      Reject
                    </span>
                  </button>
                </div>
              </Card>
            )}

            <Card style={{ padding: '24px' }}>
              <h3 className="font-semibold mb-4">Info</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-600 dark:text-muted-foreground">Created:</span> {format(new Date(event.createdAt), 'MMM dd, yyyy')}</p>
                {event.approvedAt && (
                  <p><span className="text-gray-600 dark:text-muted-foreground">Approved:</span> {format(new Date(event.approvedAt), 'MMM dd, yyyy')}</p>
                )}
              </div>
            </Card>

            <div className="space-y-2">
              <button
                onClick={() => router.push(`/admin/events/create?id=${eventId}`)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'var(--muted)',
                  color: 'var(--foreground)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
                className="flex items-center justify-center gap-2"
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button
                onClick={() => router.push(`/admin/events/${eventId}/guests`)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Attendees & Check-in
              </button>
              {event.status === 'published' && (
                <button
                  onClick={() => router.push(`/admin/events/${eventId}/revenue`)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#dbeafe',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    color: '#1e40af',
                  }}
                >
                  Revenue
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  )
}
