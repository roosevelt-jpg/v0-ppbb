'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  getBusinessOpportunities,
  subscribeToBusinessOpportunities,
  deleteOpportunity,
  updateOpportunity,
} from '@/lib/business-queries'
import { BusinessOpportunity } from '@/lib/types'
import { Plus, Trash2, Edit2, Eye } from 'lucide-react'

export default function BusinessOpportunities() {
  const { user } = useAuth()
  const router = useRouter()
  const [opportunities, setOpportunities] = React.useState<BusinessOpportunity[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedOpp, setSelectedOpp] = React.useState<BusinessOpportunity | null>(null)
  const [isEditingModal, setIsEditingModal] = React.useState(false)

  React.useEffect(() => {
    if (!user || (user.role !== 'business' && user.role !== 'super_admin')) {
      router.push('/login')
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToBusinessOpportunities(user.id, (data) => {
      setOpportunities(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, router])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this opportunity?')) {
      try {
        await deleteOpportunity(id)
        setOpportunities(opportunities.filter((o) => o.id !== id))
      } catch (error) {
        console.error('[v0] Error deleting opportunity:', error)
        alert('Error deleting opportunity')
      }
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateOpportunity(id, { status: newStatus as any })
    } catch (error) {
      console.error('[v0] Error updating status:', error)
      alert('Error updating status')
    }
  }

  if (!user || (user.role !== 'business' && user.role !== 'super_admin')) {
    return <div className="text-center py-8">Access Denied</div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '32px' }}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 style={{ color: '#111111', fontSize: '32px', fontWeight: 700 }}>
              Posted Opportunities
            </h1>
            <p style={{ color: '#888888', marginTop: '8px' }}>
              Manage your jobs, internships, and gigs
            </p>
          </div>
          <Button
            onClick={() => router.push('/business/opportunities/new')}
            style={{
              backgroundColor: '#111111',
              color: '#ffffff',
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Post Opportunity
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        {loading ? (
          <div className="text-center py-8">Loading opportunities...</div>
        ) : opportunities.length === 0 ? (
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '48px', textAlign: 'center' }}>
            <p style={{ color: '#888888', marginBottom: '16px' }}>No opportunities posted yet</p>
            <Button
              onClick={() => router.push('/business/opportunities/new')}
              style={{ backgroundColor: '#111111', color: '#ffffff' }}
            >
              Post Your First Opportunity
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {opportunities.map((opp) => (
              <Card
                key={opp.id}
                style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600 }}>{opp.title}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span style={{ backgroundColor: '#f0f0f0', color: '#111111', padding: '4px 12px', borderRadius: '4px', fontSize: '12px' }}>
                        {opp.type}
                      </span>
                      <span style={{ color: '#888888', fontSize: '14px' }}>{opp.category}</span>
                    </div>
                    <p style={{ color: '#888888', marginTop: '12px', fontSize: '14px' }}>
                      {opp.description.substring(0, 100)}...
                    </p>
                    <div className="flex gap-4 mt-4">
                      <div>
                        <p style={{ color: '#888888', fontSize: '12px' }}>Applications</p>
                        <p style={{ color: '#111111', fontWeight: 600 }}>{opp.applications}</p>
                      </div>
                      <div>
                        <p style={{ color: '#888888', fontSize: '12px' }}>Status</p>
                        <p style={{ color: '#111111', fontWeight: 600 }}>{opp.status}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => router.push(`/business/opportunities/${opp.id}`)}
                      style={{ backgroundColor: '#e4e1da', color: '#111111', padding: '8px 12px' }}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedOpp(opp)
                        setIsEditingModal(true)
                      }}
                      style={{ backgroundColor: '#e4e1da', color: '#111111', padding: '8px 12px' }}
                      className="flex items-center gap-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(opp.id)}
                      style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '8px 12px' }}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
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
