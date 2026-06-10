'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getBusinessLeads, subscribeToBusinessLeads, updateLead } from '@/lib/business-queries'
import { BusinessLead } from '@/lib/types'
import { Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react'

export default function LeadsTracker() {
  const { user } = useAuth()
  const router = useRouter()
  const [leads, setLeads] = React.useState<BusinessLead[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState('all')

  React.useEffect(() => {
    if (!user || user.role !== 'business') {
      router.push('/login')
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToBusinessLeads(user.id, (data) => {
      setLeads(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, router])

  const filteredLeads = filter === 'all' ? leads : leads.filter((l) => l.status === filter)

  const convertedLeads = leads.filter((l) => l.status === 'converted').length
  const conversionRate = leads.length > 0 ? ((convertedLeads / leads.length) * 100).toFixed(1) : '0'

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await updateLead(leadId, { status: newStatus as any })
    } catch (error) {
      console.error('[v0] Error updating lead:', error)
      alert('Error updating lead')
    }
  }

  if (!user || user.role !== 'business') {
    return <div className="text-center py-8">Access Denied</div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '32px' }}>
        <div className="max-w-6xl mx-auto">
          <h1 style={{ color: '#111111', fontSize: '32px', fontWeight: 700 }}>
            Leads Tracker
          </h1>
          <p style={{ color: '#888888', marginTop: '8px' }}>
            Monitor and manage your customer leads
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
            <div className="flex items-center gap-4">
              <Users style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
              <div>
                <p style={{ color: '#888888', fontSize: '14px' }}>Total Leads</p>
                <p style={{ color: '#111111', fontSize: '24px', fontWeight: 600 }}>{leads.length}</p>
              </div>
            </div>
          </Card>
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
            <div className="flex items-center gap-4">
              <CheckCircle style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
              <div>
                <p style={{ color: '#888888', fontSize: '14px' }}>Converted</p>
                <p style={{ color: '#111111', fontSize: '24px', fontWeight: 600 }}>{convertedLeads}</p>
              </div>
            </div>
          </Card>
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
            <div className="flex items-center gap-4">
              <TrendingUp style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
              <div>
                <p style={{ color: '#888888', fontSize: '14px' }}>Conversion Rate</p>
                <p style={{ color: '#111111', fontSize: '24px', fontWeight: 600 }}>{conversionRate}%</p>
              </div>
            </div>
          </Card>
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
            <div className="flex items-center gap-4">
              <Users style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
              <div>
                <p style={{ color: '#888888', fontSize: '14px' }}>New Leads</p>
                <p style={{ color: '#111111', fontSize: '24px', fontWeight: 600 }}>
                  {leads.filter((l) => l.status === 'new').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          {['all', 'new', 'contacted', 'qualified', 'converted', 'lost'].map((status) => (
            <Button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                backgroundColor: filter === status ? '#111111' : '#e4e1da',
                color: filter === status ? '#ffffff' : '#111111',
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Leads List */}
        {loading ? (
          <div className="text-center py-8">Loading leads...</div>
        ) : filteredLeads.length === 0 ? (
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '48px', textAlign: 'center' }}>
            <p style={{ color: '#888888' }}>No leads yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <Card
                key={lead.id}
                style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600 }}>{lead.name}</h3>
                    <p style={{ color: '#888888', fontSize: '14px', marginTop: '4px' }}>{lead.email}</p>
                    {lead.phone && (
                      <p style={{ color: '#888888', fontSize: '14px' }}>{lead.phone}</p>
                    )}
                    {lead.message && (
                      <p style={{ color: '#888888', fontSize: '14px', marginTop: '8px' }}>
                        Message: {lead.message.substring(0, 100)}...
                      </p>
                    )}
                    <div className="flex gap-4 mt-4">
                      <span style={{ backgroundColor: '#f0f0f0', color: '#111111', padding: '4px 12px', borderRadius: '4px', fontSize: '12px' }}>
                        {lead.leadSource}
                      </span>
                      <span style={{ backgroundColor: '#f0f0f0', color: '#111111', padding: '4px 12px', borderRadius: '4px', fontSize: '12px' }}>
                        {lead.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #e4e1da',
                        borderRadius: '4px',
                        color: '#111111',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
