'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PermissionGate } from '@/components/permission-gate'
import { createAdminAccessCode } from '@/lib/admin-access-code-generator'
import { useAuth } from '@/lib/auth-context'

export default function AdminManagementPage() {
  const { user } = useAuth()
  const [admins, setAdmins] = useState<any[]>([])
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'super_admin'>('admin')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (!user?.id) {
        setMessage('Error: User ID not found')
        return
      }

      const accessCode = await createAdminAccessCode(
        inviteEmail,
        inviteRole,
        user.id
      )

      setMessage(`Access code sent to ${inviteEmail}. Code: ${accessCode.code}`)
      setInviteEmail('')
      setInviteRole('admin')
      setShowInviteForm(false)
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Management</h1>
        <p className="text-muted-foreground">Manage admin users and their permissions</p>
      </div>

      <PermissionGate permission="admin.create_admin">
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Invite New Admin</h2>
            <Button
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="bg-[#111111] text-white hover:bg-[#222222]"
            >
              {showInviteForm ? 'Cancel' : 'Invite Admin'}
            </Button>
          </div>

          {showInviteForm && (
            <form onSubmit={handleInviteAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'super_admin')}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
                >
                  <option value="admin">Admin</option>
                  {user?.role === 'super_admin' && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </select>
              </div>

              {message && (
                <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                  {message}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#111111] text-white hover:bg-[#222222]"
              >
                {loading ? 'Sending...' : 'Send Invite'}
              </Button>
            </form>
          )}
        </div>
      </PermissionGate>

      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">Admin Users</h2>
        <p className="text-muted-foreground text-sm">
          Admin user management functionality coming soon. Admin users will be listed here with their roles and permissions.
        </p>
      </div>
    </div>
  )
}
