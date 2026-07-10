'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import type { Event } from '@/lib/event-types'

export default function EventsFinancePage() {
  const [events, setEvents] = React.useState<Event[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'paid'>('all')

  React.useEffect(() => {
    loadEvents()
  }, [filter])

  const loadEvents = async () => {
    try {
      const res = await fetch(`/api/events?status=published`)
      const json = await res.json()
      if (json.success) {
        const eventList = Array.isArray(json.data) ? json.data : [json.data]
        const filtered = filter === 'all' ? eventList : eventList.filter(e => e.payoutStatus === filter)
        setEvents(filtered)
      }
    } catch (err) {
      console.error('[v0] Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue = events.reduce((sum, e) => sum + (e.totalRevenue || 0), 0)
  const totalPBCut = events.reduce((sum, e) => sum + (e.pbRevenue || e.pbCommissionAmount || 0), 0)
  const totalBusinessCut = events.reduce((sum, e) => sum + (e.businessRevenue || e.businessPayoutAmount || 0), 0)
  const pendingPayout = events.filter(e => e.payoutStatus === 'pending').reduce((sum, e) => sum + (e.businessRevenue || e.businessPayoutAmount || 0), 0)

  return (
    <AdminPageLayout title="Events Finance">
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '20px' }}>
            <p className="text-xs text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold mt-2">AED {totalRevenue.toFixed(2)}</p>
          </Card>
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '20px' }}>
            <p className="text-xs text-gray-600">PB Commission</p>
            <p className="text-2xl font-bold mt-2">AED {totalPBCut.toFixed(2)}</p>
          </Card>
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '20px' }}>
            <p className="text-xs text-gray-600">Business Payout</p>
            <p className="text-2xl font-bold mt-2">AED {totalBusinessCut.toFixed(2)}</p>
          </Card>
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '20px' }}>
            <p className="text-xs text-gray-600">Pending Payout</p>
            <p className="text-2xl font-bold mt-2 text-orange-600">AED {pendingPayout.toFixed(2)}</p>
          </Card>
        </div>

        <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Events Financial Report</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['all', 'pending', 'paid'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: filter === f ? '#111111' : '#e4e1da',
                    color: filter === f ? '#ffffff' : '#111111',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="admin-table-scroll min-w-0">
              <table style={{ width: '100%', minWidth: '640px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e4e1da' }}>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Event</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Revenue</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>PB Cut</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Business Cut</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <tr key={event.id} style={{ borderBottom: '1px solid #e4e1da' }}>
                      <td style={{ padding: '12px', fontWeight: 500 }}>{event.title}</td>
                      <td style={{ padding: '12px' }}>AED {event.totalRevenue?.toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>AED {(event.pbRevenue || event.pbCommissionAmount || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>AED {(event.businessRevenue || event.businessPayoutAmount || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          backgroundColor: event.payoutStatus === 'paid' ? '#e8f5e9' : '#fff3cd',
                          color: event.payoutStatus === 'paid' ? '#2e7d32' : '#856404',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          textTransform: 'capitalize',
                        }}>
                          {event.payoutStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminPageLayout>
  )
}
