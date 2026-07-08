'use client'

import React, { useState } from 'react'
import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { updateDocument, deleteDocument } from '@/lib/admin-queries'
import { useAdminAudit } from '@/lib/use-admin-audit'
import { Trash2, Save } from 'lucide-react'

interface EditSponsorModalProps {
  isOpen: boolean
  onClose: () => void
  sponsor: any
  onSuccess?: () => void
}

export function EditSponsorModal({ isOpen, onClose, sponsor, onSuccess }: EditSponsorModalProps) {
  const audit = useAdminAudit()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(sponsor || {})
  const [deleteLoading, setDeleteLoading] = useState(false)

  React.useEffect(() => {
    if (sponsor) {
      setFormData(sponsor)
    }
  }, [sponsor])

  const handleSave = async () => {
    setLoading(true)
    try {
      console.log('[v0] Saving sponsor changes to Firestore:', {
        sponsorId: sponsor.id,
        sponsorName: formData.name,
        sponsorshipLevel: formData.sponsorshipLevel,
        timestamp: new Date().toISOString(),
      })
      
      await updateDocument('sponsors', sponsor.id, formData)
      audit({
        actionType: 'update',
        action: `Updated sponsor: ${formData.name || sponsor.id}`,
        entityType: 'content',
        entityId: sponsor.id,
        entityName: formData.name,
        status: 'success',
      })
      
      console.log('[v0] Sponsor saved successfully:', {
        sponsorId: sponsor.id,
        sponsorshipLevel: formData.sponsorshipLevel,
      })
      
      onClose()
      onSuccess?.()
    } catch (error) {
      console.error('[v0] Error saving sponsor:', error)
      alert('Failed to save sponsor')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this sponsor?')) return

    setDeleteLoading(true)
    try {
      await deleteDocument('sponsors', sponsor.id)
      audit({
        actionType: 'delete',
        action: `Deleted sponsor: ${sponsor?.name || sponsor.id}`,
        entityType: 'content',
        entityId: sponsor.id,
        entityName: sponsor?.name,
        status: 'success',
      })
      onClose()
      onSuccess?.()
    } catch (error) {
      console.error('[v0] Error deleting sponsor:', error)
      alert('Failed to delete sponsor')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Edit Sponsor"
      description={`Manage details for ${sponsor?.name || 'Sponsor'}`}
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
              onClick={onClose}
              disabled={loading}
              style={{
                backgroundColor: '#111111',
                color: '#f7f6f2',
              }}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label className="text-sm font-medium" style={{ color: '#111111', display: 'block', marginBottom: '0.5rem' }}>Sponsor Name</label>
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
            placeholder="Enter sponsor name"
          />
        </div>

        <div>
          <label className="text-sm font-medium" style={{ color: '#111111', display: 'block', marginBottom: '0.5rem' }}>Category</label>
          <input
            type="text"
            value={formData.category || ''}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e4e1da',
              borderRadius: '6px',
              backgroundColor: '#f7f6f2',
              color: '#111111',
              boxSizing: 'border-box',
            }}
            placeholder="e.g., Corporate, Individual, NGO"
          />
        </div>

        <div>
          <label className="text-sm font-medium" style={{ color: '#111111', display: 'block', marginBottom: '0.5rem' }}>Sponsorship Level</label>
          <select
            value={formData.sponsorshipLevel || 'standard'}
            onChange={(e) => {
              const newLevel = e.target.value
              const previousLevel = formData.sponsorshipLevel || 'standard'
              console.log('[v0] Sponsorship level changed:', {
                sponsorName: formData.name,
                previousLevel,
                newLevel,
                timestamp: new Date().toISOString(),
              })
              setFormData({ ...formData, sponsorshipLevel: newLevel })
            }}
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
            <option value="standard">Standard</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium" style={{ color: '#111111', display: 'block', marginBottom: '0.5rem' }}>Contact Person</label>
          <input
            type="text"
            value={formData.contactPerson || ''}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e4e1da',
              borderRadius: '6px',
              backgroundColor: '#f7f6f2',
              color: '#111111',
              boxSizing: 'border-box',
            }}
            placeholder="Enter contact person name"
          />
        </div>

        <div>
          <label className="text-sm font-medium" style={{ color: '#111111', display: 'block', marginBottom: '0.5rem' }}>Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e4e1da',
              borderRadius: '6px',
              backgroundColor: '#f7f6f2',
              color: '#111111',
              boxSizing: 'border-box',
            }}
            placeholder="Enter email address"
          />
        </div>

        <div>
          <label className="text-sm font-medium" style={{ color: '#111111', display: 'block', marginBottom: '0.5rem' }}>Phone</label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e4e1da',
              borderRadius: '6px',
              backgroundColor: '#f7f6f2',
              color: '#111111',
              boxSizing: 'border-box',
            }}
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <label className="text-sm font-medium" style={{ color: '#111111', display: 'block', marginBottom: '0.5rem' }}>Status</label>
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
            <option value="pending">Pending</option>
          </select>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label className="text-sm font-medium" style={{ color: '#111111', display: 'block', marginBottom: '0.5rem' }}>Notes</label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e4e1da',
              borderRadius: '6px',
              backgroundColor: '#f7f6f2',
              color: '#111111',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              fontSize: '14px',
              minHeight: '80px',
              resize: 'vertical',
            }}
            placeholder="Add any notes about this sponsor"
            rows={3}
          />
        </div>
      </div>
    </Dialog>
  )
}
