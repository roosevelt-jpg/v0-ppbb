'use client'

import React, { useState } from 'react'
import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { updateDocument, deleteDocument } from '@/lib/admin-queries'
import { useAdminAudit } from '@/lib/use-admin-audit'
import { Trash2, Save, DollarSign } from 'lucide-react'

interface EditDonationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  donation: any
  onSuccess?: () => void
}

export function EditDonationModal({ open, onOpenChange, donation, onSuccess }: EditDonationModalProps) {
  const audit = useAdminAudit()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(donation || {})
  const [deleteLoading, setDeleteLoading] = useState(false)

  React.useEffect(() => {
    setFormData(donation || {})
  }, [donation])

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateDocument('donations', donation.id, {
        ...formData,
        updatedAt: new Date(),
      })
      audit({
        actionType: 'update',
        action: `Updated donation: ${donation.id}`,
        entityType: 'donation',
        entityId: donation.id,
        entityName: donation?.donorName,
        status: 'success',
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('[v0] Error saving donation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this donation?')) return

    setDeleteLoading(true)
    try {
      await deleteDocument('donations', donation.id)
      audit({
        actionType: 'delete',
        action: `Deleted donation: ${donation.id}`,
        entityType: 'donation',
        entityId: donation.id,
        entityName: donation?.donorName,
        status: 'success',
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('[v0] Error deleting donation:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Donation"
      description={`Manage donation from ${donation?.donorName || 'Anonymous'}`}
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
              onClick={() => onOpenChange(false)}
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
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-neutral-700">Donor Name</label>
            <input
              type="text"
              value={formData.donorName || ''}
              onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
              placeholder="Anonymous"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">Donor Email</label>
            <input
              type="email"
              value={formData.donorEmail || ''}
              onChange={(e) => setFormData({ ...formData, donorEmail: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              Amount (AED)
            </label>
            <input
              type="number"
              value={formData.amount || 0}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">Type</label>
            <select
              value={formData.type || 'monetary'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            >
              <option value="monetary">Monetary</option>
              <option value="in-kind">In-Kind</option>
              <option value="goods">Goods</option>
              <option value="volunteer">Volunteer Hours</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-neutral-700">Purpose</label>
          <input
            type="text"
            value={formData.purpose || ''}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            placeholder="What is this donation for?"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-neutral-700">Notes</label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            rows={3}
            placeholder="Additional notes..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-neutral-700">Status</label>
            <select
              value={formData.status || 'completed'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">Payment Method</label>
            <select
              value={formData.paymentMethod || 'bank-transfer'}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            >
              <option value="bank-transfer">Bank Transfer</option>
              <option value="credit-card">Credit Card</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
            </select>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
