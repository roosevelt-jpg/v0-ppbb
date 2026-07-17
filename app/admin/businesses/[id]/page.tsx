'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ArrowLeft, Building, CheckCircle, AlertCircle, Mail, Phone, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BUTTON_PRIMARY, BUTTON_BACK } from '@/lib/admin-design-system'
import { useAdminAudit } from '@/lib/use-admin-audit'

export default function BusinessDetailPage() {
  const audit = useAdminAudit()
  const params = useParams()
  const router = useRouter()
  const businessId = params.id as string
  
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        if (!businessId) {
          setError('Business ID not found')
          return
        }

        const businessDoc = await getDoc(doc(db, 'businesses', businessId))
        if (businessDoc.exists()) {
          const data = businessDoc.data()
          setBusiness(data)
          setFormData(data)
        } else {
          setError('Business not found')
        }
      } catch (err) {
        console.error('[v0] Error fetching business:', err)
        setError('Failed to load business details')
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [businessId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateDoc(doc(db, 'businesses', businessId), formData)
      audit({
        actionType: 'update',
        action: `Updated business: ${businessId}`,
        entityType: 'business',
        entityId: businessId,
        status: 'success',
      })
      setSuccess('Business updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('[v0] Error updating business:', err)
      setError('Failed to update business')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="text-center">Loading business details...</div>
      </div>
    )
  }

  if (error && !business) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <button type="button" onClick={() => router.back()} className={`${BUTTON_BACK} mb-4`}>
          <ArrowLeft /> Back
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

  if (!business) return null

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="p-8">
        <button type="button" onClick={() => router.back()} className={`${BUTTON_BACK} mb-6`}>
          <ArrowLeft /> Back to Businesses
        </button>

        <div className="max-w-4xl">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Building className="w-6 h-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-neutral-900">{business.name || 'Not provided'}</h1>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              business.status === 'active' ? 'bg-green-100 text-green-700' :
              business.status === 'inactive' ? 'bg-red-100 text-red-700' :
              'bg-neutral-100 text-neutral-700'
            }`}>
              {business.status ? String(business.status).toUpperCase() : 'ACTIVE'}
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
              <p className="text-sm text-neutral-600">Industry</p>
              <p className="text-lg font-bold text-neutral-900 mt-1">{business.industry || 'N/A'}</p>
            </Card>
            <Card className="p-4 border border-neutral-200">
              <p className="text-sm text-neutral-600">Employees</p>
              <p className="text-lg font-bold text-neutral-900 mt-1">{business.employees || 'N/A'}</p>
            </Card>
            <Card className="p-4 border border-neutral-200">
              <p className="text-sm text-neutral-600">Founded</p>
              <p className="text-lg font-bold text-neutral-900 mt-1">
                {business.foundedYear || 'N/A'}
              </p>
            </Card>
          </div>

          <Card className="p-6 border border-neutral-200 space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Business Name</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Industry</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Employees</label>
                <input
                  type="text"
                  name="employees"
                  value={formData.employees || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Founded Year</label>
                <input
                  type="text"
                  name="foundedYear"
                  value={formData.foundedYear || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
              <select
                name="status"
                value={formData.status || 'active'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={`${BUTTON_PRIMARY} flex-1`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className={`${BUTTON_PRIMARY} flex-1`}
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
