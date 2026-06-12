'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getAllAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, regenerateAccessCode, AdminUser } from '@/lib/admin-access-codes'
import { Copy, Trash2, RotateCw, Plus, Eye, EyeOff } from 'lucide-react'

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full system access' },
  { value: 'admin', label: 'Admin', description: 'Full admin features' },
  { value: 'moderator', label: 'Moderator', description: 'Moderation only' },
]

const PERMISSION_OPTIONS = [
  { value: 'manage_admins', label: 'Manage Admins' },
  { value: 'manage_integrations', label: 'Manage Integrations' },
  { value: 'manage_members', label: 'Manage Members' },
  { value: 'manage_donations', label: 'Manage Donations' },
  { value: 'manage_events', label: 'Manage Events' },
  { value: 'manage_settings', label: 'Manage Settings' },
  { value: 'view_analytics', label: 'View Analytics' },
  { value: 'moderate_content', label: 'Moderate Content' },
]

export default function AccessControlPage() {
  const { user: authUser } = useAuth()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'admin' as const,
    permissions: [] as string[],
  })
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadAdmins()
  }, [])

  async function loadAdmins() {
    try {
      setLoading(true)
      const data = await getAllAdminUsers()
      setAdmins(data)
    } catch (error) {
      console.error('[v0] Error loading admins:', error)
      setMessage({ type: 'error', text: 'Failed to load admins' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!authUser) return

    try {
      if (editingId) {
        // Update existing admin
        const result = await updateAdminUser(editingId, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          permissions: formData.permissions,
        })
        if (result.success) {
          setMessage({ type: 'success', text: 'Admin updated successfully' })
          await loadAdmins()
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to update admin' })
        }
      } else {
        // Create new admin
        const result = await createAdminUser(
          {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            permissions: formData.permissions,
          },
          authUser.id
        )
        if (result.success && result.accessCode) {
          // Send access code via email
          try {
            await fetch('/api/admin/send-access-code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                adminEmail: formData.email,
                adminName: formData.name,
                accessCode: result.accessCode,
              }),
            })
            setMessage({ 
              type: 'success', 
              text: `Admin created! Access code sent to ${formData.email}` 
            })
          } catch (emailError) {
            console.error('[v0] Error sending email:', emailError)
            setMessage({ 
              type: 'success', 
              text: `Admin created! Access Code: ${result.accessCode} (Email failed - please copy manually)` 
            })
          }
          await loadAdmins()
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to create admin' })
        }
      }

      setFormData({ name: '', email: '', role: 'admin', permissions: [] })
      setEditingId(null)
      setShowForm(false)
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
    }
  }

  async function handleDeleteAdmin(adminId: string, adminName: string) {
    if (confirm(`Delete admin "${adminName}"? This cannot be undone.`)) {
      try {
        const result = await deleteAdminUser(adminId)
        if (result.success) {
          setMessage({ type: 'success', text: 'Admin deleted successfully' })
          await loadAdmins()
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to delete admin' })
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to delete admin' })
      }
    }
  }

  async function handleRegenCode(adminId: string) {
    try {
      const result = await regenerateAccessCode(adminId)
      if (result.success) {
        setMessage({ type: 'success', text: `New access code: ${result.accessCode}` })
        await loadAdmins()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to regenerate code' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to regenerate code' })
    }
  }

  function toggleCodeVisibility(adminId: string) {
    setVisibleCodes((prev) => {
      const next = new Set(prev)
      if (next.has(adminId)) {
        next.delete(adminId)
      } else {
        next.add(adminId)
      }
      return next
    })
  }

  function copyToClipboard(code: string) {
    navigator.clipboard.writeText(code)
    setMessage({ type: 'success', text: 'Copied to clipboard' })
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>
          Access Control
        </h1>
        <p style={{ color: '#888888' }}>Manage admin users and permissions</p>
      </div>

      {/* Action Button */}
      <button
        onClick={() => {
          setShowForm(!showForm)
          if (editingId) setEditingId(null)
          setFormData({ name: '', email: '', role: 'admin', permissions: [] })
        }}
        style={{
          marginBottom: '1.5rem',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#111111',
          color: '#ffffff',
          border: 'none',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Plus className="h-4 w-4" />
        Add New Admin
      </button>

      {/* Message */}
      {message && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            borderRadius: '0.375rem',
            border: `1px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e4e1da',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111111', marginBottom: '1.5rem' }}>
            {editingId ? 'Edit Admin' : 'Create New Admin'}
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111111' }}>
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e4e1da',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111111' }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e4e1da',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Role */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111111' }}>
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e4e1da',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Permissions */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#111111' }}>
                Permissions
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
                {PERMISSION_OPTIONS.map((perm) => (
                  <label key={perm.value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(perm.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, permissions: [...formData.permissions, perm.value] })
                        } else {
                          setFormData({
                            ...formData,
                            permissions: formData.permissions.filter((p) => p !== perm.value),
                          })
                        }
                      }}
                    />
                    <span style={{ fontSize: '0.875rem', color: '#111111' }}>{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#111111',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {editingId ? 'Update Admin' : 'Create Admin'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData({ name: '', email: '', role: 'admin', permissions: [] })
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#f9f8f5',
                  color: '#111111',
                  border: '1px solid #e4e1da',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admins Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e4e1da',
          borderRadius: '0.5rem',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#fafaf8', borderBottom: '1px solid #e4e1da' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#111111' }}>
                  Name
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#111111' }}>
                  Email
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#111111' }}>
                  Role
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#111111' }}>
                  Access Code
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#111111' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} style={{ borderBottom: '1px solid #e4e1da' }}>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#111111' }}>{admin.name}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#111111' }}>{admin.email}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#111111' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#f3f3f1',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#111111',
                      }}
                    >
                      {ROLE_OPTIONS.find((r) => r.value === admin.role)?.label}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#111111', fontFamily: 'monospace' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{visibleCodes.has(admin.id) ? admin.accessCode : '••••••••••'}</span>
                      <button
                        onClick={() => toggleCodeVisibility(admin.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title={visibleCodes.has(admin.id) ? 'Hide code' : 'Show code'}
                      >
                        {visibleCodes.has(admin.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(admin.accessCode)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Copy code"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setEditingId(admin.id)
                          setFormData({
                            name: admin.name,
                            email: admin.email,
                            role: admin.role,
                            permissions: admin.permissions,
                          })
                          setShowForm(true)
                        }}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#f3f3f1',
                          border: '1px solid #e4e1da',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRegenCode(admin.id)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#f3f3f1',
                          border: '1px solid #e4e1da',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                        title="Regenerate access code"
                      >
                        <RotateCw className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#fee2e2',
                          border: '1px solid #fca5a5',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                        title="Delete admin"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {admins.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888888' }}>
          No admins found. Create one to get started.
        </div>
      )}
    </div>
  )
}
