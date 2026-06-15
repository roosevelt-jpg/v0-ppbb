'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  getBusinessPartnerships,
  subscribeToBusinessPartnerships,
  createPartnership,
} from '@/lib/business-queries'
import { BusinessPartnership } from '@/lib/types'
import { Briefcase, Plus, Trash2 } from 'lucide-react'

export default function Partnerships() {
  const { user } = useAuth()
  const router = useRouter()
  const [partnerships, setPartnerships] = React.useState<BusinessPartnership[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)

  React.useEffect(() => {
    if (!user || (user.role !== 'business' && user.role !== 'super_admin')) {
      router.push('/login')
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToBusinessPartnerships(user.id, (data) => {
      setPartnerships(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, router])

  if (!user || (user.role !== 'business' && user.role !== 'super_admin')) {
    return <div className="text-center py-8">Access Denied</div>
  }

  const activePartnerships = partnerships.filter((p) => p.status === 'active')
  const pendingPartnerships = partnerships.filter((p) => p.status === 'pending')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '32px' }}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 style={{ color: '#111111', fontSize: '32px', fontWeight: 700 }}>
              Partnerships & Collaborations
            </h1>
            <p style={{ color: '#888888', marginTop: '8px' }}>
              Manage business partnerships and collaborations
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            style={{
              backgroundColor: '#111111',
              color: '#ffffff',
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Request Partnership
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
            <div className="flex items-center gap-4">
              <Briefcase style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
              <div>
                <p style={{ color: '#888888', fontSize: '14px' }}>Total Partnerships</p>
                <p style={{ color: '#111111', fontSize: '24px', fontWeight: 600 }}>
                  {partnerships.length}
                </p>
              </div>
            </div>
          </Card>
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
            <div className="flex items-center gap-4">
              <Briefcase style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
              <div>
                <p style={{ color: '#888888', fontSize: '14px' }}>Active</p>
                <p style={{ color: '#111111', fontSize: '24px', fontWeight: 600 }}>
                  {activePartnerships.length}
                </p>
              </div>
            </div>
          </Card>
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
            <div className="flex items-center gap-4">
              <Briefcase style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
              <div>
                <p style={{ color: '#888888', fontSize: '14px' }}>Pending</p>
                <p style={{ color: '#111111', fontSize: '24px', fontWeight: 600 }}>
                  {pendingPartnerships.length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Partnerships List */}
        {loading ? (
          <div className="text-center py-8">Loading partnerships...</div>
        ) : partnerships.length === 0 ? (
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '48px', textAlign: 'center' }}>
            <p style={{ color: '#888888', marginBottom: '16px' }}>No partnerships yet</p>
            <Button
              onClick={() => setShowForm(true)}
              style={{ backgroundColor: '#111111', color: '#ffffff' }}
            >
              Request Your First Partnership
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {partnerships.map((partnership) => (
              <Card
                key={partnership.id}
                style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600 }}>
                      {partnership.partnerBusinessName}
                    </h3>
                    <p style={{ color: '#888888', fontSize: '14px', marginTop: '4px' }}>
                      {partnership.type}
                    </p>
                    {partnership.description && (
                      <p style={{ color: '#888888', fontSize: '14px', marginTop: '8px' }}>
                        {partnership.description}
                      </p>
                    )}
                    <span style={{ backgroundColor: '#f0f0f0', color: '#111111', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', marginTop: '12px', display: 'inline-block' }}>
                      {partnership.status}
                    </span>
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
