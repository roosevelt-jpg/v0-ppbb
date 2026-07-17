'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Search, Trash2 } from 'lucide-react'
import { AdminUserCell } from '@/components/admin-user-cell'
import { formatUserPhoneDisplay } from '@/lib/user-profile'
import { AdminUserProfileModal, AdminViewProfileButton } from '@/components/admin-user-profile-modal'
import { profileFromMember } from '@/lib/admin-profile-view'
import type { AdminProfileViewData } from '@/lib/admin-profile-view'

export default function AdminMembersPage() {
  const [members, setMembers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [userType, setUserType] = React.useState<string>('all')
  const [search, setSearch] = React.useState('')
  const [profileOpen, setProfileOpen] = React.useState(false)
  const [activeProfile, setActiveProfile] = React.useState<AdminProfileViewData | null>(null)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = React.useState(false)
  const [bulkStatus, setBulkStatus] = React.useState('')
  const [bulkRole, setBulkRole] = React.useState('')

  const openProfile = (member: Record<string, unknown>) => {
    setActiveProfile(profileFromMember(member))
    setProfileOpen(true)
  }

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
        setSelectedIds(new Set())
      }
    } catch (error) {
      console.error('[v0] Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const allMembers = members
  const memberCount = allMembers.filter(m => m.role === 'member' || m.userType === 'member').length
  const volunteerCount = allMembers.filter(m => m.role === 'volunteer' || m.userType === 'volunteer').length
  const businessCount = allMembers.filter(m => m.role === 'business' || m.userType === 'business').length
  const sponsorCount = allMembers.filter(m => m.role === 'sponsor' || m.userType === 'sponsor').length

  const displayMembers = userType === 'all' ? allMembers : allMembers.filter(m => m.role === userType || m.userType === userType)

  const allVisibleSelected =
    displayMembers.length > 0 && displayMembers.every((m) => selectedIds.has(m.id))

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        displayMembers.forEach((m) => next.delete(m.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        displayMembers.forEach((m) => next.add(m.id))
        return next
      })
    }
  }

  const selectedList = Array.from(selectedIds)

  const runBulkUpdate = async () => {
    if (!selectedList.length) return
    if (!bulkStatus && !bulkRole) {
      alert('Choose a status and/or role to apply')
      return
    }
    if (!confirm(`Update ${selectedList.length} selected member(s)?`)) return
    setBulkBusy(true)
    try {
      const payload: Record<string, unknown> = { ids: selectedList }
      if (bulkStatus) payload.status = bulkStatus
      if (bulkRole) payload.role = bulkRole
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Update failed')
      setBulkStatus('')
      setBulkRole('')
      await loadMembers()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bulk update failed')
    } finally {
      setBulkBusy(false)
    }
  }

  const runBulkDelete = async () => {
    if (!selectedList.length) return
    if (
      !confirm(
        `Delete ${selectedList.length} selected member(s)? They will be marked deleted and hidden from lists.`
      )
    ) {
      return
    }
    setBulkBusy(true)
    try {
      const res = await fetch('/api/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedList }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Delete failed')
      await loadMembers()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bulk delete failed')
    } finally {
      setBulkBusy(false)
    }
  }

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 min-w-0">
            <p className="text-sm text-gray-600">Total Members</p>
            <p className="text-2xl font-bold text-black">{memberCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 min-w-0">
            <p className="text-sm text-gray-600">Volunteers</p>
            <p className="text-2xl font-bold text-black">{volunteerCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 min-w-0">
            <p className="text-sm text-gray-600">Businesses</p>
            <p className="text-2xl font-bold text-black">{businessCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 min-w-0">
            <p className="text-sm text-gray-600">Sponsors</p>
            <p className="text-2xl font-bold text-black">{sponsorCount}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex gap-2 overflow-x-auto pb-1 min-w-0">
            {['all', 'member', 'volunteer', 'business', 'sponsor'].map(type => (
              <button
                key={type}
                onClick={() => {
                  setUserType(type)
                  setLoading(true)
                }}
                className={`px-4 py-2 rounded font-medium text-sm transition-colors whitespace-nowrap shrink-0 ${
                  userType === type
                    ? 'bg-black text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1 flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-4 min-w-0">
            <Search size={18} className="text-gray-400 shrink-0" />
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

        {selectedList.length > 0 && (
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-neutral-50 p-4">
            <p className="text-sm font-medium text-gray-800 w-full sm:w-auto">
              {selectedList.length} selected
            </p>
            <label className="text-sm text-gray-700">
              Set status
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                <option value="">—</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
            <label className="text-sm text-gray-700">
              Set role
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value)}
                className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                <option value="">—</option>
                <option value="member">Member</option>
                <option value="volunteer">Volunteer</option>
                <option value="business">Business</option>
                <option value="sponsor">Sponsor</option>
              </select>
            </label>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => void runBulkUpdate()}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
            >
              Update selected
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => void runBulkDelete()}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={14} />
              Delete selected
            </button>
          </div>
        )}

        {displayMembers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No members found matching your filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 admin-table-scroll min-w-0">
            <table className="w-full min-w-[1080px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label="Select all visible members"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Member</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Volunteer Hours</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayMembers.map((member: any) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(member.id)}
                        onChange={() => toggleOne(member.id)}
                        aria-label={`Select ${member.name || member.email || member.id}`}
                      />
                    </td>
                    <td className="px-6 py-3 text-sm">
                        <AdminUserCell user={member} />
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 hidden md:table-cell">{member.email}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatUserPhoneDisplay(member)}
                    </td>
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
                        member.status === 'active' ? 'bg-neutral-900 text-white' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {member.dateJoined ? new Date(member.dateJoined).toLocaleDateString() : member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-3 text-sm whitespace-nowrap">
                      <AdminViewProfileButton compact onClick={() => openProfile(member)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminUserProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={activeProfile}
        editLabel="Edit member"
      />
    </AdminPageLayout>
  )
}
