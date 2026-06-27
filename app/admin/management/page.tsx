'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Copy, Trash2, Plus, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminManagementPage() {
  const [activeTab, setActiveTab] = React.useState<'access-codes' | 'admins'>('access-codes')
  const [admins, setAdmins] = React.useState<any[]>([])
  const [codes, setCodes] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [visibleCodes, setVisibleCodes] = React.useState<Set<string>>(new Set())
  const [generatingCode, setGeneratingCode] = React.useState(false)
  const [adminEmail, setAdminEmail] = React.useState('')
  const [adminName, setAdminName] = React.useState('')
  const [adminRole, setAdminRole] = React.useState('admin')

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

    setGeneratingCode(true)
    try {
      const res = await fetch('/api/admin/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'generate-access-code',
          email: adminEmail,
          name: adminName,
          role: adminRole,
          sendEmail: true
        }),
      })
      const json = await res.json()
      if (json.success) {
        setCodes([json.data, ...codes])
        setAdminEmail('')
        setAdminName('')
        alert('Access code generated and invitation email sent to ' + adminEmail)
      } else {
        alert('Error: ' + (json.error || 'Failed to generate code'))
      }
    } catch (error) {
      console.error('[v0] Error generating code:', error)
      alert('Failed to generate code')
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
      const res = await fetch('/api/admin/management', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
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
        <div className="flex gap-4 border-b border-gray-200">
          {['access-codes', 'admins'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as any)
                setLoading(true)
              }}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
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
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
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
              <p className="text-sm text-gray-600 mb-4">Active access codes ready to be used</p>
            </div>

            {codes.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No access codes generated yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {codes.map((code: any) => (
                  <div key={code.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="font-mono font-bold text-gray-900 bg-gray-50 px-3 py-1 rounded">
                          {visibleCodes.has(code.id) ? code.code : '••••••'}
                        </code>
                        <button
                          onClick={() => toggleCodeVisibility(code.id)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          {visibleCodes.has(code.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleCopyCode(code.code)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Expires: {format(new Date(code.expiresAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      code.used ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {code.used ? 'Used' : 'Unused'}
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
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Role</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Created</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {admins.map((admin: any) => (
                      <tr key={admin.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-900 font-medium">{admin.name || 'Unnamed'}</td>
                        <td className="px-6 py-3 text-gray-600">{admin.email}</td>
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
            )}
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
