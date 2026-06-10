'use client'

import React, { useState } from 'react'
import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { updateDocument, deleteDocument } from '@/lib/admin-queries'
import { Trash2, Save, Calendar } from 'lucide-react'

interface EditEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: any
  onSuccess?: () => void
}

export function EditEventModal({ open, onOpenChange, event, onSuccess }: EditEventModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(event || {})
  const [deleteLoading, setDeleteLoading] = useState(false)

  React.useEffect(() => {
    setFormData(event || {})
  }, [event])

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateDocument('events', event.id, {
        ...formData,
        updatedAt: new Date(),
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('[v0] Error saving event:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return

    setDeleteLoading(true)
    try {
      await deleteDocument('events', event.id)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('[v0] Error deleting event:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Event"
      description={`Manage event: ${event?.name || 'Event'}`}
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
        <div>
          <label className="text-sm font-medium text-neutral-700">Event Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-neutral-700">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Date
            </label>
            <input
              type="date"
              value={formData.date || ''}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">Location</label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-neutral-700">Capacity</label>
            <input
              type="number"
              value={formData.capacity || 0}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">Status</label>
            <select
              value={formData.status || 'active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
