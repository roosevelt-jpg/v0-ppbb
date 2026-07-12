'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import type { Event } from '@/lib/event-types'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'

export default function BusinessEventsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [events, setEvents] = React.useState<Event[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<
    'draft' | 'pending_approval' | 'changes_requested' | 'published' | 'rejected'
  >('draft')

  React.useEffect(() => {
    if (!user || !hasBusinessAccess(user)) {
      router.push('/login')
      return
    }
    loadEvents()
  }, [user, activeTab])

  const loadEvents = async () => {
    try {
      const res = await fetch(`/api/events?createdBy=${user?.id}&status=${activeTab}`)
      const json = await res.json()
      if (json.success) {
        setEvents(Array.isArray(json.data) ? json.data : [])
      }
    } catch (err) {
      console.error('[v0] Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return
    try {
      const res = await fetch(`/api/events?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        loadEvents()
      }
    } catch (err) {
      console.error('[v0] Error deleting event:', err)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fafafa' }}>
      {/* Sidebar */}
      <div style={{ width: '280px', backgroundColor: '#ffffff', borderRight: '1px solid #e4e1da', padding: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: '#111111' }}>Events</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(['draft', 'pending_approval', 'changes_requested', 'published', 'rejected'] as const).map(
            (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                backgroundColor: activeTab === tab ? '#111111' : 'transparent',
                color: activeTab === tab ? '#ffffff' : '#111111',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? 600 : 500,
              }}
            >
              {tab === 'draft'
                ? 'Drafts'
                : tab === 'pending_approval'
                ? 'Pending Approval'
                : tab === 'changes_requested'
                ? 'Changes Requested'
                : tab === 'published'
                ? 'Published'
                : 'Rejected'}
            </button>
          )
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#111111' }}>Your Events</h1>
          <Link
            href="/business/events/new"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: '#111111',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <Plus size={20} />
            Create Event
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#888888' }}>Loading...</div>
        ) : events.length === 0 ? (
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '48px', textAlign: 'center' }}>
            <p style={{ color: '#888888', marginBottom: '16px' }}>No events yet</p>
            <Link
              href="/business/events/new"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#111111',
                color: '#ffffff',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Create Your First Event
            </Link>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {events.map((event) => (
              <Card
                key={event.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e4e1da',
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111111' }}>{event.title}</h3>
                  <p style={{ fontSize: '14px', color: '#888888', marginTop: '4px' }}>
                    {format(new Date(event.startDate), 'MMM dd, yyyy')} • {event.category}
                  </p>
                  <p style={{ fontSize: '12px', color: '#999999', marginTop: '8px' }}>
                    {event.status.replace(/_/g, ' ').toUpperCase()}
                  </p>
                  {event.status === 'changes_requested' && event.approvalNotes && (
                    <p
                      style={{
                        fontSize: 13,
                        color: '#e65100',
                        marginTop: 8,
                        background: '#fff8e1',
                        padding: 8,
                        borderRadius: 6,
                      }}
                    >
                      {event.approvalNotes}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => router.push(`/business/events/new?id=${event.id}`)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#111111',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    title="Edit / Resubmit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => router.push(`/business/events/${event.id}/guests`)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#374151',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                    title="Attendees & Check-in"
                  >
                    Attendees
                  </button>
                  <button
                    onClick={() => handleDelete(event.id!)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#c62828',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
