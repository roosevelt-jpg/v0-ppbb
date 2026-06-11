'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Save, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function EditSponsorProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')
  const [formData, setFormData] = React.useState({
    sponsorName: '',
    sponsorType: 'individual',
    sponsorEmail: '',
    sponsorPhone: '',
    sponsorDescription: '',
    website: '',
    sponsorshipFocus: [] as string[],
    yearlySponsorshipBudget: '',
  })

  const sponsorTypeOptions = ['individual', 'company', 'foundation', 'ngo']
  const focusOptions = ['Education', 'Healthcare', 'Environment', 'Community', 'Arts', 'Sports', 'Technology']

  React.useEffect(() => {
    if (!user?.id) return

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setFormData({
            sponsorName: data.sponsorName || '',
            sponsorType: data.sponsorType || 'individual',
            sponsorEmail: data.sponsorEmail || '',
            sponsorPhone: data.sponsorPhone || '',
            sponsorDescription: data.sponsorDescription || '',
            website: data.website || '',
            sponsorshipFocus: data.sponsorshipFocus || [],
            yearlySponsorshipBudget: data.yearlySponsorshipBudget || '',
          })
        }
      } catch (err) {
        console.error('[v0] Error fetching profile:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user?.id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleFocus = (focus: string) => {
    setFormData(prev => ({
      ...prev,
      sponsorshipFocus: prev.sponsorshipFocus.includes(focus)
        ? prev.sponsorshipFocus.filter(f => f !== focus)
        : [...prev.sponsorshipFocus, focus],
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await updateDoc(doc(db, 'users', user.id), {
        sponsorName: formData.sponsorName,
        sponsorType: formData.sponsorType,
        sponsorEmail: formData.sponsorEmail,
        sponsorPhone: formData.sponsorPhone,
        sponsorDescription: formData.sponsorDescription,
        website: formData.website,
        sponsorshipFocus: formData.sponsorshipFocus,
        yearlySponsorshipBudget: formData.yearlySponsorshipBudget ? parseInt(formData.yearlySponsorshipBudget) : 0,
        updatedAt: new Date(),
      })

      setSuccess('Profile updated successfully!')
      setTimeout(() => {
        router.push('/sponsor/profile')
      }, 1500)
    } catch (err) {
      console.error('[v0] Error saving profile:', err)
      setError('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-neutral-600">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-neutral-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/sponsor/profile">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Edit Profile</h1>
            <p className="text-neutral-600 mt-1">Update your sponsor information</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave}>
          <Card className="p-8 border border-neutral-200 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Sponsor Name *</label>
                  <input
                    type="text"
                    name="sponsorName"
                    value={formData.sponsorName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter sponsor name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Sponsor Type *</label>
                  <select
                    name="sponsorType"
                    value={formData.sponsorType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                  >
                    {sponsorTypeOptions.map(type => (
                      <option key={type} value={type} className="capitalize">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
                  <textarea
                    name="sponsorDescription"
                    value={formData.sponsorDescription}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about your sponsorship goals and interests"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t border-neutral-200 pt-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="sponsorEmail"
                    value={formData.sponsorEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sponsor@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="sponsorPhone"
                    value={formData.sponsorPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+971 50 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Sponsorship Details */}
            <div className="border-t border-neutral-200 pt-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Sponsorship Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">Sponsorship Focus Areas</label>
                  <div className="flex flex-wrap gap-2">
                    {focusOptions.map(focus => (
                      <button
                        key={focus}
                        type="button"
                        onClick={() => toggleFocus(focus)}
                        className={`px-4 py-2 rounded-lg border-2 transition ${
                          formData.sponsorshipFocus.includes(focus)
                            ? 'bg-blue-100 border-blue-500 text-blue-800'
                            : 'bg-white border-neutral-300 text-neutral-700 hover:border-blue-300'
                        }`}
                      >
                        {focus}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Yearly Sponsorship Budget (AED)</label>
                  <input
                    type="number"
                    name="yearlySponsorshipBudget"
                    value={formData.yearlySponsorshipBudget}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100000"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-neutral-200 pt-6 flex gap-4">
              <Link href="/sponsor/profile" className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  )
}
