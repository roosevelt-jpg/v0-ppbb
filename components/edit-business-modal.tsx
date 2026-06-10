'use client'

import React, { useState } from 'react'
import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { updateDocument, deleteDocument } from '@/lib/admin-queries'
import { Trash2, Save } from 'lucide-react'

interface EditBusinessModalProps {
  isOpen: boolean
  onClose: () => void
  business: any
  onSuccess?: () => void
}

export function EditBusinessModal({ isOpen, onClose, business, onSuccess }: EditBusinessModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(business || {})
  const [deleteLoading, setDeleteLoading] = useState(false)

  React.useEffect(() => {
    if (business) {
      setFormData(business)
    }
  }, [business])

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateDocument('businesses', business.id, formData)
      onClose()
      onSuccess?.()
    } catch (error) {
      console.error('[v0] Error saving business:', error)
      alert('Failed to save business')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this business?')) return

    setDeleteLoading(true)
    try {
      await deleteDocument('businesses', business.id)
      onClose()
      onSuccess?.()
    } catch (error) {
      console.error('[v0] Error deleting business:', error)
      alert('Failed to delete business')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Edit Business"
      description={`Manage details for ${business?.name || 'Business'}`}
      footer={
        <div className="flex gap-2 justify-between">
          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={deleteLoading || loading}
            style={{ color: '#d32f2f' }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              style={{
                backgroundColor: '#111111',
                color: '#f7f6f2',
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 py-4">
        <div>
          <label className="text-sm font-medium">Business Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg"
            placeholder="Enter business name"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Category</label>
          <input
            type="text"
            value={formData.category || ''}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg"
            placeholder="e.g., Retail, Services, F&B"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Owner Name</label>
            <input
              type="text"
              value={formData.ownerName || ''}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg"
              placeholder="Owner name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg"
              placeholder="Business email"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg"
              placeholder="Business phone"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Location</label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg"
              placeholder="City/Area"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Website</label>
          <input
            type="url"
            value={formData.website || ''}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Status</label>
          <select
            value={formData.status || 'active'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg"
          >
            <option value="active">Active</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Partnership Type</label>
          <select
            value={formData.partnershipType || 'none'}
            onChange={(e) => setFormData({ ...formData, partnershipType: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg"
          >
            <option value="none">None</option>
            <option value="sponsor">Sponsor</option>
            <option value="supplier">Supplier</option>
            <option value="referral">Referral Partner</option>
            <option value="affiliate">Affiliate</option>
            <option value="strategic">Strategic Partner</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Commission/Revenue Share %</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.commissionPercentage || 0}
              onChange={(e) => setFormData({ ...formData, commissionPercentage: parseFloat(e.target.value) })}
              className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Total Revenue (AED)</label>
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.totalRevenue || 0}
              onChange={(e) => setFormData({ ...formData, totalRevenue: parseFloat(e.target.value) })}
              className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Description / Notes</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg"
            placeholder="Business description and partnership notes"
            rows={3}
          />
        </div>
      </div>
    </Dialog>
  )
}
