'use client'

import React, { useState } from 'react'
import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/firebase'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Trash2, Loader2 } from 'lucide-react'

interface EditSponsorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sponsor: any
  onSuccess?: () => void
}

export function EditSponsorModal({ open, onOpenChange, sponsor, onSuccess }: EditSponsorModalProps) {
  const [formData, setFormData] = useState(sponsor || {})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  React.useEffect(() => {
    if (sponsor) {
      setFormData(sponsor)
      setError('')
    }
  }, [sponsor])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!formData.id) return

    setLoading(true)
    setError('')

    try {
      const sponsorRef = doc(db, 'sponsors', formData.id)
      await updateDoc(sponsorRef, {
        companyName: formData.companyName || '',
        contactName: formData.contactName || '',
        email: formData.email || '',
        phone: formData.phone || '',
        sponsorshipLevel: formData.sponsorshipLevel || 'silver',
        sponsorshipAmount: parseFloat(formData.sponsorshipAmount) || 0,
        focus: formData.focus || '',
        status: formData.status || 'contacted',
        notes: formData.notes || '',
        updatedAt: new Date(),
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('[v0] Error updating sponsor:', err)
      setError('Failed to update sponsor')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!formData.id || !confirm('Are you sure you want to delete this sponsor?')) return

    setLoading(true)
    setError('')

    try {
      await deleteDoc(doc(db, 'sponsors', formData.id))
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('[v0] Error deleting sponsor:', err)
      setError('Failed to delete sponsor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Edit Sponsor" description="Manage sponsor partnerships and sponsorship details">
      <div className="space-y-4 p-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Company Name</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Contact Name</label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Sponsorship Level</label>
              <select
                name="sponsorshipLevel"
                value={formData.sponsorshipLevel || 'silver'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Amount (AED)</label>
              <input
                type="number"
                name="sponsorshipAmount"
                value={formData.sponsorshipAmount || 0}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Focus Area</label>
            <input
              type="text"
              name="focus"
              value={formData.focus || ''}
              onChange={handleChange}
              placeholder="e.g., Education, Healthcare"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status || 'contacted'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="negotiating">Negotiating</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div className="flex gap-2 justify-between pt-4">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-neutral-900 text-white hover:bg-neutral-800"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
