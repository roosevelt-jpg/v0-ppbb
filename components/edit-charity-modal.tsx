'use client'

import React, { useState } from 'react'
import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/firebase'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Trash2, Loader2 } from 'lucide-react'

interface EditCharityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  charity: any
  onSuccess?: () => void
}

export function EditCharityModal({ open, onOpenChange, charity, onSuccess }: EditCharityModalProps) {
  const [formData, setFormData] = useState(charity || {})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  React.useEffect(() => {
    if (charity) {
      setFormData(charity)
      setError('')
    }
  }, [charity])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!formData.id) return

    setLoading(true)
    setError('')

    try {
      const charityRef = doc(db, 'charityRequests', formData.id)
      await updateDoc(charityRef, {
        title: formData.title || '',
        description: formData.description || '',
        category: formData.category || 'general',
        status: formData.status || 'pending',
        beneficiaryName: formData.beneficiaryName || '',
        targetAmount: parseFloat(formData.targetAmount) || 0,
        collectedAmount: parseFloat(formData.collectedAmount) || 0,
        priority: formData.priority || 'medium',
        updatedAt: new Date(),
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('[v0] Error updating charity:', err)
      setError('Failed to update charity request')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!formData.id || !confirm('Are you sure you want to delete this charity request?')) return

    setLoading(true)
    setError('')

    try {
      await deleteDoc(doc(db, 'charityRequests', formData.id))
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('[v0] Error deleting charity:', err)
      setError('Failed to delete charity request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Charity Request</DialogTitle>
          <DialogDescription>Update charity case details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Beneficiary Name</label>
            <input
              type="text"
              name="beneficiaryName"
              value={formData.beneficiaryName || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Target Amount (AED)</label>
              <input
                type="number"
                name="targetAmount"
                value={formData.targetAmount || 0}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Collected (AED)</label>
              <input
                type="number"
                name="collectedAmount"
                value={formData.collectedAmount || 0}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category || 'general'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="medical">Medical</option>
                <option value="education">Education</option>
                <option value="emergency">Emergency</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status || 'pending'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Priority</label>
            <select
              name="priority"
              value={formData.priority || 'medium'}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
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
