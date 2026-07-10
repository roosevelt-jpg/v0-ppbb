'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ArrowLeft, Heart, CheckCircle, AlertCircle, DollarSign, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/lib/admin-design-system'
import { useAdminAudit } from '@/lib/use-admin-audit'

export default function CharityCaseDetailPage() {
  const audit = useAdminAudit()
  const params = useParams()
  const router = useRouter()
  const charityId = params.id as string
  
  const [charity, setCharity] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    const fetchCharity = async () => {
      try {
        if (!charityId) {
          setError('Charity case ID not found')
          return
        }

        const charityDoc = await getDoc(doc(db, 'charity', charityId))
        if (charityDoc.exists()) {
          const data = charityDoc.data()
          setCharity(data)
          setFormData(data)
        } else {
          setError('Charity case not found')
        }
      } catch (err) {
        console.error('[v0] Error fetching charity case:', err)
        setError('Failed to load charity case details')
      } finally {
        setLoading(false)
      }
    }

    fetchCharity()
  }, [charityId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateDoc(doc(db, 'charity', charityId), formData)
      audit({
        actionType: 'update',
        action: `Updated charity case: ${charityId}`,
        entityType: 'beneficiary',
        entityId: charityId,
        status: 'success',
      })
      setSuccess('Charity case updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('[v0] Error updating charity case:', err)
      setError('Failed to update charity case')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="text-center">Loading charity case details...</div>
      </div>
    )
  }

  if (error && !charity) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Card className="p-8 border-red-200 bg-red-50 border-2">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        </Card>
      </div>
    )
  }

  if (!charity) return null

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="p-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Charity Cases
        </button>

        <div className="max-w-4xl">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-6 h-6 text-red-600" />
              <h1 className="text-3xl font-bold text-neutral-900">{charity.title}</h1>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              charity.status === 'approved' ? 'bg-green-100 text-green-700' :
              charity.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {charity.status ? charity.status.toUpperCase() : 'PENDING'}
            </span>
          </div>

          {error && (
            <Card className="p-4 mb-6 border-red-200 bg-red-50 border-2">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            </Card>
          )}

          {success && (
            <Card className="p-4 mb-6 border-green-200 bg-green-50 border-2">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                {success}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="p-4 border border-neutral-200">
              <p className="text-sm text-neutral-600">Target Amount</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{charity.targetAmount} AED</p>
            </Card>
            <Card className="p-4 border border-neutral-200">
              <p className="text-sm text-neutral-600">Collected</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{charity.collected || 0} AED</p>
            </Card>
            <Card className="p-4 border border-neutral-200">
              <p className="text-sm text-neutral-600">Progress</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {charity.targetAmount ? Math.round(((charity.collected || 0) / charity.targetAmount) * 100) : 0}%
              </p>
            </Card>
          </div>

          <Card className="p-6 border border-neutral-200 space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Target Amount (AED)</label>
                <input
                  type="number"
                  name="targetAmount"
                  value={formData.targetAmount || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Collected (AED)</label>
                <input
                  type="number"
                  name="collected"
                  value={formData.collected || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
              <select
                name="status"
                value={formData.status || 'pending'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`${BUTTON_PRIMARY} flex-1`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => router.back()}
                className={`${BUTTON_SECONDARY} flex-1`}
              >
                Cancel
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
