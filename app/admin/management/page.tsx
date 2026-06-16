'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Copy, Trash2, RotateCw, Plus, Eye, EyeOff, History, AlertCircle } from 'lucide-react'

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

interface AdminData {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'admin' | 'moderator'
  permissions: string[]
  accessCode: string
  createdAt: number
}

interface LoginLog {
  id: string
  timestamp: string
  ipAddress: string
  location?: string
  status: 'success' | 'failed'
  browser?: string
  os?: string
}

export default function UnifiedAdminManagementPage() {
  const { user: authUser } = useAuth()
  const [admins, setAdmins] = useState<AdminData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedAdminForHistory, setSelectedAdminForHistory] = useState<string | null>(null)
  const [loginHistory, setLoginHistory] = useState<LoginLog[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
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
      const response = await fetch('/api/admin/admins')
      if (!response.ok) throw new Error('Failed to load admins')
      const data = await response.json()
      setAdmins(data.admins || [])
    } catch (error) {
      console.error('[v0] Error loading admins:', error)
      setMessage({ type: 'error', text: 'Failed to load admins' })
    } finally {
      setLoading(false)
    }
  }

  async function loadLoginHistory(adminId: string) {
    try {
      setLoadingHistory(true)
      const isSuperAdmin = authUser?.role === 'super_admin'
      const response = await fetch(`/api/admin/login-history?adminId=${adminId}&isSuperAdmin=${isSuperAdmin}`)
      if (!response.ok) throw new Error('Failed to load history')
      const data = await response.json()
      setLoginHistory(data.logs || [])
    } catch (error) {
      console.error('[v0] Error loading login history:', error)
      setMessage({ type: 'error', text: 'Failed to load login history' })
    } finally {
      setLoadingHistory(false)
    }
  }

  async function handleGenerateAccessCode(e: React.FormEvent) {
    e.preventDefault()
    if (!authUser?.id) return

    try {
      setLoading(true)
      const response = await fetch('/api/admin/access-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: formData.email,
          adminName: formData.name,
          adminRole: formData.role,
          permissions: formData.permissions,
          createdBy: authUser.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate code')
      }

      const data = await response.json()
      setMessage({
        type: 'success',
        text: `Access code generated and email sent to ${formData.email}`,
      })

      // Reload admins
      await loadAdmins()
      setFormData({ name: '', email: '', role: 'admin', permissions: [] })
      setShowForm(false)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to generate access code',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteAdmin(adminId: string, adminName: string) {
    if (!confirm(`Delete admin "${adminName}"? This cannot be undone.`)) return

    try {
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete admin')

      setMessage({ type: 'success', text: 'Admin deleted successfully' })
      await loadAdmins()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete admin',
      })
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
    setMessage({ type: 'success', text: 'Code copied to clipboard' })
  }

  if (loading && admins.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Management</h1>
        <p className="text-gray-600">Manage admin users, permissions, and access codes</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{message.text}</p>
        </div>
      )}

      {/* Generate Access Code Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Generate Access Code</h2>
          <button
            onClick={() => {
              setShowForm(!showForm)
              if (editingId) setEditingId(null)
              setFormData({ name: '', email: '', role: 'admin', permissions: [] })
            }}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancel' : 'Generate New Code'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleGenerateAccessCode} className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@example.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">Permissions</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PERMISSION_OPTIONS.map((perm) => (
                  <label key={perm.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(perm.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            permissions: [...formData.permissions, perm.value],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            permissions: formData.permissions.filter((p) => p !== perm.value),
                          })
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate & Send Code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormData({ name: '', email: '', role: 'admin', permissions: [] })
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Active Admins</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Access Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{admin.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{admin.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {ROLE_OPTIONS.find((r) => r.value === admin.role)?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono">
                    <div className="flex items-center gap-2">
                      <span>{visibleCodes.has(admin.id) ? admin.accessCode : '••••••••••'}</span>
                      <button
                        onClick={() => toggleCodeVisibility(admin.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title={visibleCodes.has(admin.id) ? 'Hide' : 'Show'}
                      >
                        {visibleCodes.has(admin.id) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(admin.accessCode)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Copy code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedAdminForHistory(admin.id)
                          loadLoginHistory(admin.id)
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition"
                        title="View login history"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                        className="p-1 hover:bg-red-100 text-red-600 rounded transition"
                        title="Delete admin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {admins.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-600">
            <p>No admins found. Generate an access code to create your first admin.</p>
          </div>
        )}
      </div>

      {/* Login History Modal */}
      {selectedAdminForHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-auto">
            <div className="sticky top-0 px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                Login History - {admins.find((a) => a.id === selectedAdminForHistory)?.name}
              </h3>
              <button
                onClick={() => setSelectedAdminForHistory(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
            </div>

            {loadingHistory ? (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-600">Loading history...</p>
              </div>
            ) : loginHistory.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-600">No login history found</p>
              </div>
            ) : (
              <div className="divide-y">
                {loginHistory.map((log) => (
                  <div key={log.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-600">{log.timestamp}</span>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>
                        <strong>IP:</strong> {log.ipAddress}
                      </p>
                      {log.location && (
                        <p>
                          <strong>Location:</strong> {log.location}
                        </p>
                      )}
                      {log.browser && (
                        <p>
                          <strong>Browser:</strong> {log.browser} ({log.os})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
