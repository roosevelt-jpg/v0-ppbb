'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Copy, Trash2, Plus, Eye, EyeOff, Mail, KeyRound } from 'lucide-react'
import { format } from 'date-fns'
import { AdminUserCell } from '@/components/admin-user-cell'
import { formatUserPhoneDisplay } from '@/lib/user-profile'
import { WELFARE_INVITE_ROLE_OPTIONS, isWelfareOperationalRole } from '@/lib/charity-cases'
import { useAuth } from '@/lib/auth-context'
import { INVITE_PERMISSION_OPTIONS } from '@/lib/admin-invite-permissions'

export default function AdminManagementPage() {
  const { firebaseUser } = useAuth()
  const [activeTab, setActiveTab] = React.useState<'access-codes' | 'admins'>('access-codes')
  const [admins, setAdmins] = React.useState<any[]>([])
  const [codes, setCodes] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [visibleCodes, setVisibleCodes] = React.useState<Set<string>>(new Set())
  const [generatingCode, setGeneratingCode] = React.useState(false)
  const [resendingId, setResendingId] = React.useState<string | null>(null)
  const [resettingEmail, setResettingEmail] = React.useState<string | null>(null)
  const [adminEmail, setAdminEmail] = React.useState('')
  const [adminName, setAdminName] = React.useState('')
  const [adminRole, setAdminRole] = React.useState('admin')
  const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>([])

  const INVITE_ROLE_OPTIONS = [
    {
      value: 'admin',
      label: 'Admin',
      description: 'Standard admin — empty permissions = full access; checkboxes limit the menu',
    },
    {
      value: 'super_admin',
      label: 'Super Admin',
      description: 'Full unrestricted admin access (permissions checkboxes ignored)',
    },
    ...WELFARE_INVITE_ROLE_OPTIONS,
  ]

  // Available permissions for admins — must stay in sync with PERMISSION_ROUTE_PREFIXES
  const ADMIN_PERMISSIONS = INVITE_PERMISSION_OPTIONS

  React.useEffect(() => {
    if (adminRole === 'welfare' || adminRole === 'founder' || adminRole === 'coordinator') {
      setSelectedPermissions(['manage_beneficiary'])
      return
    }
    if (adminRole === 'super_admin') {
      setSelectedPermissions([])
    }
  }, [adminRole])

  React.useEffect(() => {
    if (!firebaseUser) return
    loadData()
  }, [activeTab, firebaseUser])

  const loadData = async () => {
    try {
      if (!firebaseUser) {
        setLoading(false)
        return
      }
      const token = await firebaseUser.getIdToken()
      const headers = { Authorization: `Bearer ${token}` }
      if (activeTab === 'access-codes') {
        const res = await fetch('/api/admin/management?query=access-codes', {
          cache: 'no-store',
          headers,
        })
        const json = await res.json()
        if (json.success) setCodes(json.data)
      } else {
        const res = await fetch('/api/admin/management?query=admins', {
          cache: 'no-store',
          headers,
        })
        const json = await res.json()
        if (json.success) setAdmins(json.data)
      }
    } catch (error) {
      console.error('[v0] Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCode = async () => {
    if (!adminEmail) {
      alert('Please enter admin email address')
      return
    }
    if (!adminName) {
      alert('Please enter admin name')
      return
    }
    if (!firebaseUser) {
      alert('Sign in again as super admin, then retry.')
      return
    }

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    setGeneratingCode(true)
    const welfareDefaults = ['manage_beneficiary']
    const permissionsToSend =
      selectedPermissions.length > 0
        ? selectedPermissions
        : adminRole === 'super_admin'
          ? ['full_access']
          : adminRole === 'welfare' || adminRole === 'founder' || adminRole === 'coordinator'
            ? welfareDefaults
            : ['full_access']

    try {
      const token = await firebaseUser.getIdToken()
      const res = await fetch('/api/admin/management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          action: 'generate-access-code',
          adminName,
          adminEmail,
          role: adminRole,
          permissions: permissionsToSend,
          sendEmail: true,
          expiresAt: expiresAt.toISOString(),
        }),
      })
      const json = await res.json()
      if (json.success) {
        setCodes([json.data, ...codes])
        setAdminEmail('')
        setAdminName('')
        setSelectedPermissions([])
        if (json.emailSent) {
          alert(
            `✓ Invitation emailed to ${adminEmail}.\n\nThey will receive a branded Passive Blessings email with your signature and a 6-digit access code to complete /admin/setup.`
          )
        } else {
          alert(
            `Access code was created, but the email was NOT sent.\n\n${
              json.emailError || json.message || 'Check Admin → Integrations → Gmail SMTP.'
            }\n\nYou can still copy the 6-digit code from the list below and share it manually.`
          )
        }
        await loadData()
      } else {
        alert('Error: ' + (json.error || 'Failed to generate code'))
      }
    } catch (error) {
      console.error('[v0] Error generating code:', error)
      alert('Failed to generate code: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setGeneratingCode(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  const handleResendInvite = async (code: {
    id: string
    adminEmail?: string
    adminName?: string
    used?: boolean
    isUsed?: boolean
  }) => {
    if (!code?.id) return
    if (!code.adminEmail) {
      alert('This invite has no email address to resend to.')
      return
    }

    const used = Boolean(code.used || code.isUsed)
    const ok = confirm(
      used
        ? `Resend invitation to ${code.adminEmail}?\n\nThis code is marked used. They can still finish setup if their admin profile is incomplete.`
        : `Resend invitation email to ${code.adminEmail}?`
    )
    if (!ok) return

    setResendingId(code.id)
    try {
      if (!firebaseUser) {
        alert('Sign in again as super admin, then retry.')
        return
      }
      const token = await firebaseUser.getIdToken()
      const res = await fetch('/api/admin/management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'resend-invite',
          codeId: code.id,
          extendExpiry: true,
        }),
      })
      const json = await res.json()
      if (json.success && json.emailSent) {
        alert(`✓ Invitation resent to ${code.adminEmail}`)
        await loadData()
      } else {
        alert(
          `Could not resend invite.\n\n${
            json.emailError || json.error || json.message || 'Check Admin → Integrations → Gmail SMTP.'
          }`
        )
      }
    } catch (error) {
      console.error('[v0] Error resending invite:', error)
      alert('Failed to resend invite: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setResendingId(null)
    }
  }

  const handleSendPasswordReset = async (email?: string, adminName?: string) => {
    const targetEmail = String(email || '').trim().toLowerCase()
    if (!targetEmail) {
      alert('No email address available for password reset.')
      return
    }
    if (!firebaseUser) {
      alert('Sign in again, then retry sending the password reset.')
      return
    }

    const ok = confirm(
      `Send a password reset email to ${targetEmail}?\n\nThey will receive a link to choose a new password, then can sign in at Admin Login or finish /admin/setup.`
    )
    if (!ok) return

    setResettingEmail(targetEmail)
    try {
      const token = await firebaseUser.getIdToken()
      const res = await fetch('/api/admin/management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'send-password-reset',
          email: targetEmail,
          adminName: adminName || '',
        }),
      })
      const json = await res.json()
      if (json.success && json.emailSent) {
        alert(`✓ Password reset email sent to ${targetEmail}`)
      } else {
        alert(
          `Could not send password reset.\n\n${
            json.emailError || json.error || json.message || 'Check Admin → Integrations → Gmail SMTP.'
          }`
        )
      }
    } catch (error) {
      console.error('[v0] Error sending password reset:', error)
      alert(
        'Failed to send password reset: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      )
    } finally {
      setResettingEmail(null)
    }
  }

  const toggleCodeVisibility = (id: string) => {
    const newSet = new Set(visibleCodes)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setVisibleCodes(newSet)
  }

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      const res = await fetch(`/api/admin/management?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        setAdmins(admins.filter(a => a.id !== id))
      }
    } catch (error) {
      console.error('[v0] Error deleting admin:', error)
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title="Admin Management">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title="Admin Management">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-black">Admin Management</h2>

        {/* Tabs */}
        <div className="flex gap-3">
          {['access-codes', 'admins'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as any)
                setLoading(true)
              }}
              className={`px-6 py-2 font-medium text-sm rounded-full transition-colors ${
                activeTab === tab
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab === 'access-codes' ? 'Access Codes' : 'Active Admins'}
            </button>
          ))}
        </div>

        {/* Access Codes Tab */}
        {activeTab === 'access-codes' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Generate New Admin Invitation</h3>
              <p className="text-sm text-gray-600 mb-4">
                Invite a new admin with a role and permissions. They receive a branded Passive Blessings
                email signed by you, with a <strong>6-digit access code</strong> to complete setup at{' '}
                <code className="text-xs bg-gray-100 px-1 rounded">/admin/setup</code>.
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Name *</label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="e.g., John Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={adminRole}
                    onChange={(e) => setAdminRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    {INVITE_ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    {INVITE_ROLE_OPTIONS.find((option) => option.value === adminRole)?.description}
                  </p>
                  {isWelfareOperationalRole(adminRole) && (
                    <p className="text-xs text-amber-700 mt-1">
                      Welfare-tier roles can access beneficiary requests and sensitive documents when invited with this role.
                    </p>
                  )}
                </div>

                {/* Permissions Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Permissions (Optional)</label>
                  <p className="text-xs text-gray-500 mb-3">Select specific permissions or leave empty for full access</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {ADMIN_PERMISSIONS.map((permission) => (
                      <label key={permission.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions([...selectedPermissions, permission.id])
                            } else {
                              setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id))
                            }
                          }}
                          className="w-4 h-4 mt-0.5 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{permission.label}</div>
                          <div className="text-xs text-gray-600">{permission.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={handleGenerateCode}
                  disabled={generatingCode}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 font-medium transition"
                >
                  <Plus size={18} />
                  {generatingCode ? 'Generating...' : 'Generate & Send Invitation'}
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-3">Generated Access Codes</h3>
              <p className="text-sm text-gray-600 mb-4">
                Unused invites are removed automatically after 48 hours
              </p>
            </div>

            {codes.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No access codes generated yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {codes.map((code: any) => (
                  <div key={code.id} className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <code className="font-mono font-bold text-gray-900 bg-gray-50 px-3 py-1 rounded">
                          {visibleCodes.has(code.id) ? code.code : '••••••'}
                        </code>
                        <button
                          type="button"
                          onClick={() => toggleCodeVisibility(code.id)}
                          className="pb-ghost-btn p-2 text-gray-600 hover:bg-gray-100 rounded min-h-[40px] min-w-[40px] inline-flex items-center justify-center"
                          aria-label="Toggle code visibility"
                        >
                          {visibleCodes.has(code.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(code.code)}
                          className="pb-ghost-btn p-2 text-gray-600 hover:bg-gray-100 rounded min-h-[40px] min-w-[40px] inline-flex items-center justify-center"
                          aria-label="Copy code"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <div className="flex flex-col gap-0.5 text-xs text-gray-600">
                        {(code.adminName || code.adminEmail) && (
                          <p className="font-medium text-gray-900 break-words">
                            {code.adminName || 'Invitee'}
                            {code.adminEmail ? ` · ${code.adminEmail}` : ''}
                          </p>
                        )}
                        {(code.adminRole || code.role) && (
                          <p className="capitalize">
                            Role: {String(code.adminRole || code.role).replace(/_/g, ' ')}
                          </p>
                        )}
                        <p>Generated: {format(new Date(code.createdAt), 'MMM dd, yyyy h:mm a')}</p>
                        <p>Expires: {format(new Date(code.expiresAt), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end shrink-0">
                      <span
                        className={`self-start px-2 py-1 rounded text-xs font-medium ${
                          code.used || code.isUsed
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {code.used || code.isUsed ? 'Used' : 'Unused'}
                      </span>
                      {code.adminEmail ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleResendInvite(code)}
                            disabled={resendingId === code.id}
                            className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 px-3 py-1.5 bg-black !text-white rounded-lg text-xs font-medium hover:bg-neutral-900 disabled:opacity-50 min-h-[40px]"
                          >
                            <Mail size={14} />
                            {resendingId === code.id ? 'Sending…' : 'Resend invite'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void handleSendPasswordReset(code.adminEmail, code.adminName)
                            }
                            disabled={resettingEmail === String(code.adminEmail).trim().toLowerCase()}
                            className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 px-3 py-1.5 bg-black !text-white rounded-lg text-xs font-medium hover:bg-neutral-900 disabled:opacity-50 min-h-[40px]"
                            title="Email a password reset link (super admin)"
                          >
                            <KeyRound size={14} />
                            {resettingEmail === String(code.adminEmail).trim().toLowerCase()
                              ? 'Sending…'
                              : 'Reset password'}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{admins.length} active administrators</p>

            {admins.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No admins found. Generate an access code to create the first admin.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 min-w-0">
                <div className="admin-table-scroll">
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Admin</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Phone</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Role</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Created</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {admins.map((admin: any) => (
                      <tr key={admin.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <AdminUserCell
                            user={admin}
                            name={admin.name || 'Unnamed'}
                            hideSubtitle
                          />
                        </td>
                        <td className="px-6 py-3 text-gray-600">{admin.email}</td>
                        <td className="px-6 py-3 text-gray-600 whitespace-nowrap">
                          {formatUserPhoneDisplay(admin)}
                        </td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium capitalize">
                            {admin.role}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {admin.createdAt ? format(new Date(admin.createdAt), 'MMM dd, yyyy') : '-'}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1">
                            {admin.email ? (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleSendPasswordReset(admin.email, admin.name)
                                }
                                disabled={
                                  resettingEmail === String(admin.email).trim().toLowerCase()
                                }
                                className="p-1 text-black hover:bg-gray-100 rounded"
                                title="Send password reset email"
                              >
                                <KeyRound size={16} />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => handleDeleteAdmin(admin.id)}
                              className="p-1 bg-black !text-white hover:bg-neutral-800 rounded"
                              title="Remove admin"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
