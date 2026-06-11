'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ArrowLeft, Award, CheckCircle, AlertCircle, Mail, Phone } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function SponsorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sponsorId = params.id as string
  
  const [sponsor, setSponsor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    const fetchSponsor = async () => {
      try {
        if (!sponsorId) {
          setError('Sponsor ID not found')
          return
        }

        const sponsorDoc = await getDoc(doc(db, 'sponsors', sponsorId))
        if (sponsorDoc.exists()) {
          const data = sponsorDoc.data()
          setSponsor(data)
          setFormData(data)
        } else {
          setError('Sponsor not found')
        }
      } catch (err) {
        console.error('[v0] Error fetching sponsor:', err)
        setError('Failed to load sponsor details')
      } finally {
        setLoading(false)
      }
    }

    fetchSponsor()
  }, [sponsorId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateDoc(doc(db, 'sponsors', sponsorId), formData)
      setSuccess('Sponsor updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('[v0] Error updating sponsor:', err)
      setError('Failed to update sponsor')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="text-center">Loading sponsor details...</div>
      </div>
    )
  }

  if (error && !sponsor) {
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

  if (!sponsor) return null

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="p-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Sponsors
        </button>

        <div className="max-w-4xl">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-yellow-600" />
              <h1 className="text-3xl font-bold text-neutral-900">{sponsor.name}</h1>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              sponsor.status === 'active' ? 'bg-green-100 text-green-700' :
              'bg-neutral-100 text-neutral-700'
            }`}>
              {sponsor.status ? sponsor.status.toUpperCase() : 'ACTIVE'}
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
              <p className="text-sm text-neutral-600">Category</p>
              <p className="text-lg font-bold text-neutral-900 mt-1">{sponsor.category || 'N/A'}</p>
            </Card>
            <Card className="p-4 border border-neutral-200">
              <p className="text-sm text-neutral-600">Partnership Level</p>
              <p className="text-lg font-bold text-neutral-900 mt-1">{sponsor.partnershipLevel || 'Standard'}</p>
            </Card>
            <Card className="p-4 border border-neutral-200">
              <p className="text-sm text-neutral-600">Since</p>
              <p className="text-lg font-bold text-neutral-900 mt-1">
                {sponsor.joinedAt ? new Date(sponsor.joinedAt?.toDate?.() || sponsor.joinedAt).toLocaleDateString() : 'N/A'}
              </p>
            </Card>
          </div>

          <Card className="p-6 border border-neutral-200 space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Sponsor Name</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Partnership Level</label>
                <select
                  name="partnershipLevel"
                  value={formData.partnershipLevel || 'standard'}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
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
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg font-medium hover:bg-neutral-300 transition"
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
