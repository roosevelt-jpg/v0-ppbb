'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Search } from 'lucide-react'

export default function AdminMembersPage() {
  const [members, setMembers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [userType, setUserType] = React.useState<string>('all')
  const [search, setSearch] = React.useState('')

  React.useEffect(() => {
    loadMembers()
  }, [userType, search])

  const loadMembers = async () => {
    try {
      let query = '/api/members?'
      if (userType !== 'all') {
        query += `userType=${userType}&`
      }
      if (search) {
        query += `search=${encodeURIComponent(search)}`
      }

      const res = await fetch(query, { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        setMembers(json.data)
      }
    } catch (error) {
      console.error('[v0] Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get stats by type
  const allMembers = members
  const memberCount = allMembers.filter(m => m.role === 'member' || m.userType === 'member').length
  const volunteerCount = allMembers.filter(m => m.role === 'volunteer' || m.userType === 'volunteer').length
  const businessCount = allMembers.filter(m => m.role === 'business' || m.userType === 'business').length
  const sponsorCount = allMembers.filter(m => m.role === 'sponsor' || m.userType === 'sponsor').length

  const displayMembers = userType === 'all' ? allMembers : allMembers.filter(m => m.role === userType || m.userType === userType)

  if (loading) {
    return (
      <AdminPageLayout title="Members">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading members...</p>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title="Members">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-black">All Members</h2>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Members</p>
            <p className="text-2xl font-bold text-black">{memberCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Volunteers</p>
            <p className="text-2xl font-bold text-black">{volunteerCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Businesses</p>
            <p className="text-2xl font-bold text-black">{businessCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Sponsors</p>
            <p className="text-2xl font-bold text-black">{sponsorCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex gap-2">
            {['all', 'member', 'volunteer', 'business', 'sponsor'].map(type => (
              <button
                key={type}
                onClick={() => {
                  setUserType(type)
                  setLoading(true)
                }}
                className={`px-4 py-2 rounded font-medium text-sm transition-colors ${
                  userType === type
                    ? 'bg-black text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1 flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-4">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or location..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setLoading(true)
              }}
              className="flex-1 py-2 outline-none bg-transparent text-gray-700"
            />
          </div>
        </div>

        {/* Table */}
        {displayMembers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No members found matching your filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Volunteer Hours</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayMembers.map((member: any) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{member.name || member.firstName + ' ' + member.lastName || 'Unknown'}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{member.email}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium capitalize">
                        {member.role || member.userType || 'member'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">{member.location?.city || member.emirate || member.location || '-'}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className="font-medium text-gray-900">{member.volunteerHours || 0} hrs</span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {member.dateJoined ? new Date(member.dateJoined).toLocaleDateString() : member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
