'use client'

import React, { useState } from 'react'
import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { updateDocument, deleteDocument } from '@/lib/admin-queries'
import { Trash2, Save } from 'lucide-react'

interface EditMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: any
  onSuccess?: () => void
}

export function EditMemberModal({ open, onOpenChange, member, onSuccess }: EditMemberModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(member || {})
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateDocument('users', member.id, formData)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('[v0] Error saving member:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this member?')) return

    setDeleteLoading(true)
    try {
      await deleteDocument('users', member.id)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('[v0] Error deleting member:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Member"
      description={`Manage details for ${member?.name || 'Member'}`}
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <label className="text-sm font-medium" style={{ color: '#111111', display: 'block', marginBottom: '0.5rem' }}>
            Name
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e4e1da',
              borderRadius: '6px',
              backgroundColor: '#f7f6f2',
              color: '#111111',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label className="text-sm font-medium" style={{ color: '#111111', display: 'block', marginBottom: '0.5rem' }}>
            Email
          </label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e4e1da',
              borderRadius: '6px',
              backgroundColor: '#f7f6f2',
              color: '#888888',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label className="text-sm font-medium" style={{ color: '#111111', display: 'block', marginBottom: '0.5rem' }}>
            Role
          </label>
          <select
            value={formData.role || 'member'}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e4e1da',
              borderRadius: '6px',
              backgroundColor: '#f7f6f2',
              color: '#111111',
              boxSizing: 'border-box',
            }}
          >
            <option value="member">Member</option>
            <option value="volunteer">Volunteer</option>
            <option value="member+volunteer">Member + Volunteer</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium" style={{ color: '#111111', display: 'block', marginBottom: '0.5rem' }}>
            Status
          </label>
          <select
            value={formData.status || 'active'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e4e1da',
              borderRadius: '6px',
              backgroundColor: '#f7f6f2',
              color: '#111111',
              boxSizing: 'border-box',
            }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label className="text-sm font-medium" style={{ color: '#111111', display: 'block', marginBottom: '0.5rem' }}>
            Location
          </label>
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              marginTop: '4px',
              border: '1px solid #e4e1da',
              borderRadius: '6px',
              backgroundColor: '#f7f6f2',
              color: '#111111',
            }}
          />
        </div>
      </div>
    </Dialog>
  )
}
