'use client'

import React, { useState } from 'react'
import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { updateDocument, deleteDocument } from '@/lib/admin-queries'
import { auth } from '@/lib/firebase'
import { useAdminAudit } from '@/lib/use-admin-audit'
import { Trash2, Save, Clock, Users } from 'lucide-react'

interface EditVolunteerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  volunteer: any
  onSuccess?: () => void
}

export function EditVolunteerModal({ open, onOpenChange, volunteer, onSuccess }: EditVolunteerModalProps) {
  const audit = useAdminAudit()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(volunteer || {})
  const [deleteLoading, setDeleteLoading] = useState(false)

  React.useEffect(() => {
    setFormData(volunteer || {})
  }, [volunteer])

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateDocument('users', volunteer.id, {
        ...formData,
        updatedAt: new Date(),
      })
      try {
        const token = await auth.currentUser?.getIdToken()
        if (token) {
          await fetch('/api/certificates/check-milestones', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: volunteer.id }),
          })
        }
      } catch {
        /* certificate check is best-effort */
      }
      audit({
        actionType: 'update',
        action: `Updated volunteer: ${volunteer.id}`,
        entityType: 'member',
        entityId: volunteer.id,
        status: 'success',
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('[v0] Error saving volunteer:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this volunteer?')) return

    setDeleteLoading(true)
    try {
      await deleteDocument('users', volunteer.id)
      audit({
        actionType: 'delete',
        action: `Deleted volunteer: ${volunteer.id}`,
        entityType: 'member',
        entityId: volunteer.id,
        status: 'success',
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('[v0] Error deleting volunteer:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Volunteer"
      description={`Manage volunteer profile for ${volunteer?.firstName || 'Volunteer'}`}
      maxWidth="28rem"
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-neutral-700">First Name</label>
            <input
              type="text"
              value={formData.firstName || ''}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">Last Name</label>
            <input
              type="text"
              value={formData.lastName || ''}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-neutral-700">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Volunteer Hours
            </label>
            <input
              type="number"
              value={formData.volunteeredHours || 0}
              onChange={(e) => setFormData({ ...formData, volunteeredHours: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">Status</label>
            <select
              value={formData.active ? 'active' : 'inactive'}
              onChange={(e) => setFormData({ ...formData, active: e.target.value === 'active' })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-neutral-700">Phone</label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-neutral-700 flex items-center gap-1">
            <Users className="w-4 h-4" />
            Skills
          </label>
          <textarea
            value={(formData.skills || []).join(', ')}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(',').map(s => s.trim()) })}
            placeholder="e.g. Tech/IT, Marketing, Design"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-neutral-700">Availability Notes</label>
          <textarea
            value={formData.volunteerAvailability?.notes || ''}
            onChange={(e) => setFormData({
              ...formData,
              volunteerAvailability: {
                ...formData.volunteerAvailability,
                notes: e.target.value
              }
            })}
            placeholder="Notes about volunteer availability"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
            rows={3}
          />
        </div>
      </div>
    </Dialog>
  )
}
