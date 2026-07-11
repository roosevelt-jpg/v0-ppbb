'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { useParams } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import type { Event, EventRegistration, Payout } from '@/lib/event-types'

export default function EventRevenuePage() {
  const params = useParams()
  const eventId = params.id as string
  
  const [event, setEvent] = React.useState<Event | null>(null)
  const [registrations, setRegistrations] = React.useState<EventRegistration[]>([])
  const [payouts, setPayouts] = React.useState<Payout[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadData()
  }, [eventId])

  const loadData = async () => {
    try {
      const res = await fetch(`/api/events?id=${eventId}`)
      const json = await res.json()
      if (json.success) {
        setEvent(Array.isArray(json.data) ? json.data[0] : json.data)
      }
    } catch (err) {
      console.error('[v0] Error loading event:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !event) {
    return (
      <AdminPageLayout title="Event Revenue">
        <div className="text-center py-12">Loading...</div>
      </AdminPageLayout>
    )
  }

  const paidRegistrations = registrations.filter(r => r.paymentStatus === 'paid')
  const totalRevenue = paidRegistrations.reduce((sum, r) => sum + (r.amountPaid || 0), 0)
  const pbCut = paidRegistrations.reduce((sum, r) => sum + (r.pbCut || 0), 0)
  const businessCut = totalRevenue - pbCut

  return (
    <AdminPageLayout title="Event Revenue">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">{event.title} - Revenue</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '20px' }}>
            <p className="text-xs text-gray-600 font-medium">Total Revenue</p>
            <p className="text-2xl font-bold mt-2">AED {totalRevenue.toFixed(2)}</p>
          </Card>
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '20px' }}>
            <p className="text-xs text-gray-600 font-medium">PB Commission</p>
            <p className="text-2xl font-bold mt-2">AED {pbCut.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{event.pbCommissionPercent}%</p>
          </Card>
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '20px' }}>
            <p className="text-xs text-gray-600 font-medium">Business Payout</p>
            <p className="text-2xl font-bold mt-2">AED {businessCut.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{event.businessPayoutPercent}%</p>
          </Card>
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '20px' }}>
            <p className="text-xs text-gray-600 font-medium">Registrations</p>
            <p className="text-2xl font-bold mt-2">{paidRegistrations.length}</p>
          </Card>
        </div>

        <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
          <h3 className="text-lg font-semibold mb-4">Payout Status</h3>
          <div className="space-y-2">
            <p><span className="text-gray-600">Status:</span> <strong>{event.payoutStatus}</strong></p>
            {event.payoutDate && (
              <p><span className="text-gray-600">Payout Date:</span> <strong>{new Date(event.payoutDate).toLocaleDateString()}</strong></p>
            )}
            {event.payoutReference && (
              <p><span className="text-gray-600">Reference:</span> <strong>{event.payoutReference}</strong></p>
            )}
          </div>
        </Card>

        <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
          <h3 className="text-lg font-semibold mb-4">Paid Registrations</h3>
          <div className="admin-table-scroll min-w-0">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr style={{ borderBottom: '1px solid #e4e1da' }}>
                  <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>PB Cut</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Business Cut</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paidRegistrations.map((reg) => (
                  <tr key={reg.id} style={{ borderBottom: '1px solid #e4e1da' }}>
                    <td style={{ padding: '12px' }}>{reg.userName}</td>
                    <td style={{ padding: '12px' }}>AED {reg.amountPaid?.toFixed(2)}</td>
                    <td style={{ padding: '12px' }}>AED {reg.pbCut?.toFixed(2)}</td>
                    <td style={{ padding: '12px' }}>AED {reg.businessCut?.toFixed(2)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
                        {reg.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminPageLayout>
  )
}
