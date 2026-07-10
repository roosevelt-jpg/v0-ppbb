'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AlertCircle, CheckCircle, ArrowLeft, DollarSign, User, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/lib/admin-design-system'
import { useAdminAudit } from '@/lib/use-admin-audit'

export default function DonationDetailPage() {
  const audit = useAdminAudit()
  const params = useParams()
  const router = useRouter()
  const donationId = params.id as string
  
  const [donation, setDonation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        if (!donationId) {
          setError('Donation ID not found')
          return
        }

        const donationDoc = await getDoc(doc(db, 'donations', donationId))
        if (donationDoc.exists()) {
          const data = donationDoc.data()
          setDonation(data)
          setFormData(data)
        } else {
          setError('Donation not found')
        }
      } catch (err) {
        console.error('[v0] Error fetching donation:', err)
        setError('Failed to load donation details')
      } finally {
        setLoading(false)
      }
    }

    fetchDonation()
  }, [donationId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateDoc(doc(db, 'donations', donationId), formData)
      audit({
        actionType: 'update',
        action: `Updated donation: ${donationId}`,
        entityType: 'donation',
        entityId: donationId,
        status: 'success',
      })
      setSuccess('Donation updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('[v0] Error updating donation:', err)
      setError('Failed to update donation')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="text-center">Loading donation details...</div>
      </div>
    )
  }

  if (error && !donation) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="text-center text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-neutral-200 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Donation Details</h1>
            <p className="text-neutral-600">View and manage donation information</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Donation Info */}
        <Card className="p-6 border border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Donation Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Donor Name</label>
              <input
                type="text"
                name="donorName"
                value={formData.donorName || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Amount (AED)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount || 0}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Currency</label>
              <input
                type="text"
                name="currency"
                value={formData.currency || 'AED'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Purpose/Notes</label>
            <textarea
              name="purpose"
              value={formData.purpose || ''}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
            />
          </div>
        </Card>

        {/* Donation Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 border border-neutral-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm text-neutral-600">Amount</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">
              {formData.currency || 'AED'} {formData.amount || 0}
            </p>
          </Card>
          <Card className="p-4 border border-neutral-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-neutral-600">Date</span>
            </div>
            <p className="text-sm font-semibold text-neutral-900">
              {formData.date ? new Date(formData.date).toLocaleDateString() : 'N/A'}
            </p>
          </Card>
          <Card className="p-4 border border-neutral-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-neutral-600">Status</span>
            </div>
            <p className="text-lg font-semibold text-orange-600 capitalize">{formData.status || 'Pending'}</p>
          </Card>
        </div>

        {/* Receipt Info */}
        {donation?.receiptUrl && (
          <Card className="p-6 border border-neutral-200">
            <h3 className="font-semibold text-neutral-900 mb-2">Receipt Generated</h3>
            <a
              href={donation.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline text-sm"
            >
              Download Receipt
            </a>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`${BUTTON_PRIMARY} px-6 py-2`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => router.back()}
            className={`${BUTTON_SECONDARY} px-6 py-2`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
