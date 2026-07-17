'use client'

import React, { useState } from 'react'
import { Dialog } from '@/components/dialog'
import { adminApiFetch } from '@/lib/admin-api-client'
import { Trash2, Save, DollarSign } from 'lucide-react'

interface EditDonationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  donation: any
  onSuccess?: () => void
}

export function EditDonationModal({
  open,
  onOpenChange,
  donation,
  onSuccess,
}: EditDonationModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(donation || {})
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState('')

  React.useEffect(() => {
    setFormData(donation || {})
    setError('')
  }, [donation, open])

  const handleSave = async () => {
    if (!donation?.id) {
      setError('Missing donation id')
      return
    }
    setLoading(true)
    setError('')
    try {
      const json = await adminApiFetch('/api/admin/donations', {
        method: 'PATCH',
        body: JSON.stringify({
          id: donation.id,
          donorName: formData.donorName || '',
          donorEmail: formData.donorEmail || '',
          amount: formData.amount,
          type: formData.type || 'monetary',
          purpose: formData.purpose || '',
          notes: formData.notes || '',
          status: formData.status || 'completed',
          paymentMethod: formData.paymentMethod || 'bank-transfer',
          targetCase: formData.targetCase || '',
        }),
      })
      if (!json.success) throw new Error(json.error || 'Save failed')
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('[edit-donation] save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save donation')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!donation?.id) return
    if (!confirm('Are you sure you want to permanently delete this donation?')) return

    setDeleteLoading(true)
    setError('')
    try {
      const json = await adminApiFetch('/api/admin/donations', {
        method: 'DELETE',
        body: JSON.stringify({ id: donation.id }),
      })
      if (!json.success) throw new Error(json.error || 'Delete failed')
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('[edit-donation] delete error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete donation')
    } finally {
      setDeleteLoading(false)
    }
  }

  const btnBlack =
    'inline-flex items-center justify-center gap-2 min-h-[40px] px-4 rounded-lg bg-black text-white text-sm font-semibold hover:bg-neutral-900 disabled:opacity-50'

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Donation"
      description={`Manage donation from ${donation?.donorName || 'Anonymous'}`}
      maxWidth="28rem"
      footer={
        <div className="flex gap-2 justify-between w-full">
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleteLoading || loading}
            className={btnBlack}
          >
            <Trash2 className="h-4 w-4" />
            {deleteLoading ? 'Deleting…' : 'Delete'}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className={btnBlack}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={loading}
              className={btnBlack}
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {error ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        ) : null}

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
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
              }
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
          <label className="text-sm font-medium text-neutral-700">Target Case</label>
          <input
            type="text"
            value={formData.targetCase || ''}
            onChange={(e) => setFormData({ ...formData, targetCase: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            placeholder="General"
          />
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
              <option value="cancelled">Cancelled</option>
              <option value="archived">Archived</option>
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
