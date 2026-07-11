'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Copy, Trash2, Plus, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'
import { AdminUserCell } from '@/components/admin-user-cell'
import { formatUserPhoneDisplay } from '@/lib/user-profile'
import { WELFARE_INVITE_ROLE_OPTIONS, isWelfareOperationalRole } from '@/lib/charity-cases'
import { useAuth } from '@/lib/auth-context'

export default function AdminManagementPage() {
  const { firebaseUser } = useAuth()
  const [activeTab, setActiveTab] = React.useState<'access-codes' | 'admins'>('access-codes')
  const [admins, setAdmins] = React.useState<any[]>([])
  const [codes, setCodes] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [visibleCodes, setVisibleCodes] = React.useState<Set<string>>(new Set())
  const [generatingCode, setGeneratingCode] = React.useState(false)
  const [adminEmail, setAdminEmail] = React.useState('')
  const [adminName, setAdminName] = React.useState('')
  const [adminRole, setAdminRole] = React.useState('admin')
  const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>([])

  const INVITE_ROLE_OPTIONS = [
    { value: 'admin', label: 'Admin', description: 'Standard admin with configurable permissions' },
    { value: 'super_admin', label: 'Super Admin', description: 'Full unrestricted admin access' },
    ...WELFARE_INVITE_ROLE_OPTIONS,
  ]

  // Available permissions for admins
  const ADMIN_PERMISSIONS = [
    { id: 'manage_members', label: 'Manage Members', description: 'Add, edit, and remove members' },
    { id: 'manage_events', label: 'Manage Events', description: 'Create, edit, and delete events' },
    { id: 'manage_admins', label: 'Manage Admins', description: 'Create and manage admin accounts' },
    { id: 'manage_settings', label: 'Manage Settings', description: 'Update site settings and configurations' },
    { id: 'view_reports', label: 'View Reports', description: 'Access analytics and reporting dashboard' },
    { id: 'manage_content', label: 'Manage Content', description: 'Edit pages, FAQs, and content' },
    { id: 'manage_integrations', label: 'Manage Integrations', description: 'Configure external services' },
    {
      id: 'manage_beneficiary',
      label: 'Manage Beneficiary Requests',
      description: 'Review welfare applications and sensitive documents',
    },
  ]

  React.useEffect(() => {
    if (adminRole === 'welfare' || adminRole === 'founder' || adminRole === 'coordinator') {
      setSelectedPermissions(['manage_beneficiary'])
      return
    }
    if (adminRole === 'founder_admin' || adminRole === 'manager') {
      setSelectedPermissions([])
    }
  }, [adminRole])

  React.useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      if (activeTab === 'access-codes') {
        const res = await fetch('/api/admin/management?query=access-codes', { cache: 'no-store' })
        const json = await res.json()
        if (json.success) setCodes(json.data)
      } else {
        const res = await fetch('/api/admin/management?query=admins', { cache: 'no-store' })
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

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    setGeneratingCode(true)
    const permissionsToSend = selectedPermissions.length > 0 ? selectedPermissions : ['full_access']
    console.log('[v0] Generating access code with permissions:', {
      adminName,
      adminEmail,
      role: adminRole,
      selectedPermissions: selectedPermissions,
      finalPermissions: permissionsToSend,
    })

    try {
      const res = await fetch('/api/admin/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'generate-access-code',
          adminName,
          adminEmail,
          role: adminRole,
          permissions: permissionsToSend,
          sendEmail: true,
          expiresAt: expiresAt.toISOString(),
          invitedByUserId: firebaseUser?.uid || '',
        }),
      })
      const json = await res.json()
      console.log('[v0] Access code generation response:', {
        success: json.success,
        hasData: !!json.data,
        error: json.error,
      })
      if (json.success) {
        console.log('[v0] Access code created:', {
          code: json.data?.accessCode || json.data?.code,
          permissions: json.data?.permissions,
          emailSent: json.emailSent,
          emailError: json.emailError,
        })
        setCodes([json.data, ...codes])
        setAdminEmail('')
        setAdminName('')
        setSelectedPermissions([])
        if (json.emailSent) {
          alert(`✓ Invitation emailed to ${adminEmail} with access code and setup link.`)
        } else {
          alert(
            `Access code was created, but the email was NOT sent.\n\n${
              json.emailError || json.message || 'Check Admin → Integrations → Gmail SMTP.'
            }\n\nYou can still copy the code from the list below and share it manually.`
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
              <p className="text-sm text-gray-600 mb-4">Send an invitation to a new admin with an access code</p>
              
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
              <p className="text-sm text-gray-600 mb-4">All generated access codes (used and unused)</p>
            </div>

            {codes.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No access codes generated yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {codes.map((code: any) => (
                  <div key={code.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <code className="font-mono font-bold text-gray-900 bg-gray-50 px-3 py-1 rounded">
                          {visibleCodes.has(code.id) ? code.code : '••••••'}
                        </code>
                        <button
                          type="button"
                          onClick={() => toggleCodeVisibility(code.id)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          aria-label="Toggle code visibility"
                        >
                          {visibleCodes.has(code.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(code.code)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          aria-label="Copy code"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <div className="flex flex-col gap-0.5 text-xs text-gray-600">
                        {(code.adminName || code.adminEmail) && (
                          <p className="font-medium text-gray-900 truncate">
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
                    <span className={`shrink-0 px-2 py-1 rounded text-xs font-medium ${
                      code.used || code.isUsed ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {code.used || code.isUsed ? 'Used' : 'Unused'}
                    </span>
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
                          <button
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
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
