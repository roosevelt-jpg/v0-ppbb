'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Search, Trash2, CheckSquare } from 'lucide-react'
import { AdminUserCell } from '@/components/admin-user-cell'
import { formatUserPhoneDisplay } from '@/lib/user-profile'
import { AdminUserProfileModal, AdminViewProfileButton } from '@/components/admin-user-profile-modal'
import { profileFromMember } from '@/lib/admin-profile-view'
import type { AdminProfileViewData } from '@/lib/admin-profile-view'
import { useAuth } from '@/lib/auth-context'

export default function AdminMembersPage() {
  const { firebaseUser } = useAuth()
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
  const [message, setMessage] = React.useState<string | null>(null)

  const openProfile = (member: Record<string, unknown>) => {
    setActiveProfile(profileFromMember(member))
    setProfileOpen(true)
  }

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const token = await firebaseUser?.getIdToken()
    if (!token) throw new Error('Sign in again to manage members')
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
  }

  React.useEffect(() => {
    void loadMembers({ clearSelection: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType, search])

  const loadMembers = async (opts?: { clearSelection?: boolean }) => {
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
        if (opts?.clearSelection) setSelectedIds(new Set())
      }
    } catch (error) {
      console.error('[v0] Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const allMembers = members
  const memberCount = allMembers.filter((m) => m.role === 'member' || m.userType === 'member').length
  const volunteerCount = allMembers.filter(
    (m) => m.role === 'volunteer' || m.userType === 'volunteer'
  ).length
  const businessCount = allMembers.filter(
    (m) => m.role === 'business' || m.userType === 'business'
  ).length
  const sponsorCount = allMembers.filter((m) => m.role === 'sponsor' || m.userType === 'sponsor').length

  const displayMembers =
    userType === 'all'
      ? allMembers
      : allMembers.filter((m) => m.role === userType || m.userType === userType)

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
    setMessage(null)
    try {
      const headers = await getAuthHeaders()
      const payload: Record<string, unknown> = {
        action: 'bulk-update',
        ids: selectedList,
      }
      if (bulkStatus) payload.status = bulkStatus
      if (bulkRole) payload.role = bulkRole
      const res = await fetch('/api/members', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Update failed')
      setMessage(json.message || `Updated ${selectedList.length} members`)
      setBulkStatus('')
      setBulkRole('')
      setSelectedIds(new Set())
      await loadMembers({ clearSelection: false })
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
        `Delete ${selectedList.length} selected member(s)?\n\nThey will be removed from member lists (soft-deleted).`
      )
    ) {
      return
    }
    setBulkBusy(true)
    setMessage(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/members', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'bulk-delete', ids: selectedList }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Delete failed')
      setMessage(json.message || `Deleted ${selectedList.length} members`)
      setSelectedIds(new Set())
      await loadMembers({ clearSelection: false })
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-black">All Members</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select one or more members to update their role/status or delete them.
            </p>
          </div>
          {selectedList.length === 0 ? (
            <p className="inline-flex items-center gap-2 text-sm text-gray-500">
              <CheckSquare className="w-4 h-4" />
              Use the checkboxes to multi-select
            </p>
          ) : null}
        </div>

        {message ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        ) : null}

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
            {['all', 'member', 'volunteer', 'business', 'sponsor'].map((type) => (
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

        {selectedList.length > 0 ? (
          <div className="sticky top-2 z-20 flex flex-wrap items-end gap-3 rounded-lg border-2 border-black bg-white p-4 shadow-md">
            <p className="text-sm font-semibold text-black w-full sm:w-auto">
              {selectedList.length} member{selectedList.length === 1 ? '' : 's'} selected
            </p>
            <label className="text-sm text-gray-700">
              Set status
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="mt-1 block min-h-[40px] rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white"
              >
                <option value="">—</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
            <label className="text-sm text-gray-700">
              Set type / role
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value)}
                className="mt-1 block min-h-[40px] rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white"
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
              className="min-h-[40px] rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-50"
            >
              {bulkBusy ? 'Working…' : 'Update selected'}
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => void runBulkDelete()}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 size={14} />
              {bulkBusy ? 'Working…' : 'Delete selected'}
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => setSelectedIds(new Set())}
              className="min-h-[40px] rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear selection
            </button>
          </div>
        ) : null}

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
                      className="h-4 w-4 accent-black"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Member</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Volunteer Hours
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                    Profile
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayMembers.map((member: any) => {
                  const selected = selectedIds.has(member.id)
                  return (
                    <tr
                      key={member.id}
                      className={selected ? 'bg-neutral-100' : 'hover:bg-gray-50'}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleOne(member.id)}
                          aria-label={`Select ${member.name || member.email || member.id}`}
                          className="h-4 w-4 accent-black"
                        />
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <AdminUserCell user={member} />
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600 hidden md:table-cell">
                        {member.email}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatUserPhoneDisplay(member)}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium capitalize">
                          {member.role || member.userType || 'member'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {member.location?.city || member.emirate || member.location || '-'}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className="font-medium text-gray-900">
                          {member.volunteerHours || 0} hrs
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            member.status === 'active'
                              ? 'bg-neutral-900 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {member.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {member.dateJoined
                          ? new Date(member.dateJoined).toLocaleDateString()
                          : member.joinedAt
                            ? new Date(member.joinedAt).toLocaleDateString()
                            : '-'}
                      </td>
                      <td className="px-6 py-3 text-sm whitespace-nowrap">
                        <AdminViewProfileButton compact onClick={() => openProfile(member)} />
                      </td>
                    </tr>
                  )
                })}
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
