'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/firebase'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Trash2, Loader2 } from 'lucide-react'

interface EditBusinessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  business: any
  onSuccess?: () => void
}

export function EditBusinessModal({ open, onOpenChange, business, onSuccess }: EditBusinessModalProps) {
  const [formData, setFormData] = useState(business || {})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  React.useEffect(() => {
    if (business) {
      setFormData(business)
      setError('')
    }
  }, [business])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!formData.id) return

    setLoading(true)
    setError('')

    try {
      const businessRef = doc(db, 'users', formData.id)
      await updateDoc(businessRef, {
        businessName: formData.businessName || '',
        businessCategory: formData.businessCategory || '',
        businessDescription: formData.businessDescription || '',
        businessContact: formData.businessContact || '',
        businessPhone: formData.businessPhone || '',
        businessLocation: formData.businessLocation || '',
        businessWebsite: formData.businessWebsite || '',
        status: formData.status || 'active',
        updatedAt: new Date(),
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('[v0] Error updating business:', err)
      setError('Failed to update business profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!formData.id || !confirm('Are you sure you want to delete this business?')) return

    setLoading(true)
    setError('')

    try {
      await deleteDoc(doc(db, 'users', formData.id))
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('[v0] Error deleting business:', err)
      setError('Failed to delete business')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Business Profile</DialogTitle>
          <DialogDescription>Manage business information and CRM details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Business Name</label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
            <select
              name="businessCategory"
              value={formData.businessCategory || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="">Select Category</option>
              <option value="retail">Retail</option>
              <option value="services">Services</option>
              <option value="technology">Technology</option>
              <option value="food">Food & Beverage</option>
              <option value="healthcare">Healthcare</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
            <textarea
              name="businessDescription"
              value={formData.businessDescription || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Contact Person</label>
              <input
                type="text"
                name="businessContact"
                value={formData.businessContact || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
              <input
                type="tel"
                name="businessPhone"
                value={formData.businessPhone || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Location</label>
            <input
              type="text"
              name="businessLocation"
              value={formData.businessLocation || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Website</label>
            <input
              type="url"
              name="businessWebsite"
              value={formData.businessWebsite || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status || 'active'}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
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
      </DialogContent>
    </Dialog>
  )
}
