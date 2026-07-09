'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardModal } from '@/components/dashboard-modal'
import {
  subscribeToBusinessOpportunities,
  deleteOpportunity,
  updateOpportunity,
} from '@/lib/business-queries'
import { BusinessOpportunity } from '@/lib/types'
import { hasBusinessAccess } from '@/lib/roles'
import { Plus, Trash2, Edit2, Eye } from 'lucide-react'

export default function BusinessOpportunities() {
  const { user } = useAuth()
  const router = useRouter()
  const [opportunities, setOpportunities] = React.useState<BusinessOpportunity[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [selectedOpp, setSelectedOpp] = React.useState<BusinessOpportunity | null>(null)
  const [isEditingModal, setIsEditingModal] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [editForm, setEditForm] = React.useState({
    title: '',
    description: '',
    status: 'pending_approval' as BusinessOpportunity['status'],
  })

  React.useEffect(() => {
    if (!user) return
    if (!hasBusinessAccess(user)) {
      router.push('/login')
      return
    }

    setLoading(true)
    setLoadError(null)
    const unsubscribe = subscribeToBusinessOpportunities(
      user.id,
      (data) => {
        setOpportunities(data)
        setLoading(false)
      },
      () => {
        setLoadError('Unable to load opportunities. Check your connection and try again.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, router])

  const openEditModal = (opp: BusinessOpportunity) => {
    setSelectedOpp(opp)
    setEditForm({
      title: opp.title,
      description: opp.description || '',
      status: opp.status,
    })
    setIsEditingModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedOpp) return
    if (!editForm.title.trim()) {
      alert('Title is required')
      return
    }
    if (editForm.status === 'open' || editForm.status === 'published' || editForm.status === 'active') {
      alert('Jobs go live only after admin approval.')
      return
    }

    setSaving(true)
    try {
      await updateOpportunity(selectedOpp.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        status: editForm.status,
      })
      setIsEditingModal(false)
      setSelectedOpp(null)
    } catch (error) {
      console.error('[v0] Error updating opportunity:', error)
      alert('Error updating opportunity')
    } finally {
      setSaving(false)
    }
  }

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

  if (user && !hasBusinessAccess(user)) {
    return <div className="text-center py-8">Access Denied</div>
  }

  return (
    <div className="min-h-full bg-[#faf9f7]">
      <div className="border-b border-[#e4e1da] bg-white px-4 py-6 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row flex-wrap gap-4 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-[32px] font-bold text-neutral-900">Posted Opportunities</h1>
            <p className="text-neutral-500 mt-2 text-sm sm:text-base">
              Manage your jobs, internships, and gigs
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              type="button"
              onClick={() => router.push('/business/opportunities/applicants')}
              variant="outline"
              className="min-h-[44px] w-full sm:w-auto"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Applicants
            </Button>
            <Button
              type="button"
              onClick={() => router.push('/business/opportunities/new')}
              className="min-h-[44px] w-full sm:w-auto bg-neutral-900 text-white hover:bg-neutral-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Post Opportunity
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        {loading ? (
          <div className="text-center py-8 text-neutral-500">Loading opportunities...</div>
        ) : loadError ? (
          <Card className="p-8 text-center border-[#e4e1da]">
            <p className="text-neutral-500 mb-4">{loadError}</p>
            <Button type="button" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Card>
        ) : opportunities.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center border-[#e4e1da]">
            <p className="text-neutral-500 mb-4">No opportunities posted yet</p>
            <Button
              type="button"
              onClick={() => router.push('/business/opportunities/new')}
              className="min-h-[44px] bg-neutral-900 text-white"
            >
              Post Your First Opportunity
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {opportunities.map((opp) => (
              <Card key={opp.id} className="p-4 sm:p-6 border-[#e4e1da]">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-neutral-900">{opp.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                      <span className="bg-neutral-100 text-neutral-900 px-3 py-1 rounded text-xs">
                        {opp.type}
                      </span>
                      <span className="text-neutral-500 text-sm">{opp.category}</span>
                    </div>
                    <p className="text-neutral-500 mt-3 text-sm line-clamp-2">
                      {(opp.description || '').substring(0, 160)}
                      {(opp.description || '').length > 160 ? '…' : ''}
                    </p>
                    <div className="flex flex-wrap gap-6 mt-4">
                      <div>
                        <p className="text-neutral-500 text-xs">Applications</p>
                        <p className="text-neutral-900 font-semibold">{opp.applications ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500 text-xs">Status</p>
                        <p
                          className={`font-semibold capitalize text-sm ${
                            opp.status === 'pending_approval'
                              ? 'text-amber-700'
                              : opp.status === 'open'
                                ? 'text-green-700'
                                : 'text-neutral-900'
                          }`}
                        >
                          {String(opp.status || '').replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                    <Button
                      type="button"
                      onClick={() => router.push(`/business/opportunities/${opp.id}`)}
                      variant="outline"
                      size="sm"
                      className="min-h-[44px] flex-1 sm:flex-none"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      type="button"
                      onClick={() => openEditModal(opp)}
                      variant="outline"
                      size="sm"
                      className="min-h-[44px] flex-1 sm:flex-none"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDelete(opp.id)}
                      variant="outline"
                      size="sm"
                      className="min-h-[44px] flex-1 sm:flex-none text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DashboardModal
        open={isEditingModal && !!selectedOpp}
        title="Edit opportunity"
        onClose={() => {
          setIsEditingModal(false)
          setSelectedOpp(null)
        }}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditingModal(false)
                setSelectedOpp(null)
              }}
              className="min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving}
              className="min-h-[44px] w-full sm:w-auto bg-neutral-900 text-white"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full min-h-[44px] rounded-lg border border-neutral-300 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              rows={5}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
            <select
              value={editForm.status}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  status: e.target.value as BusinessOpportunity['status'],
                }))
              }
              className="w-full min-h-[44px] rounded-lg border border-neutral-300 px-3 text-sm"
            >
              <option value="pending_approval">Pending approval</option>
              <option value="closed">Closed</option>
              <option value="filled">Filled</option>
              <option value="archived">Archived</option>
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              Open/published status is set by admin after approval.
            </p>
          </div>
        </div>
      </DashboardModal>
    </div>
  )
}
