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
import {
  BUTTON_PRIMARY,
  FILTER_PILL_ACTIVE,
  FILTER_PILL_INACTIVE,
} from '@/lib/admin-design-system'

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
  const isBusinessAccount = (m: { role?: string; userType?: string }) =>
    m.role === 'business' || m.userType === 'business'
  const isSponsorAccount = (m: { role?: string; userType?: string }) =>
    m.role === 'sponsor' || m.userType === 'sponsor'

  const individualCount = allMembers.filter(
    (m) => !isBusinessAccount(m) && !isSponsorAccount(m)
  ).length
  const volunteerCount = allMembers.filter(
    (m) => m.role === 'volunteer' || m.userType === 'volunteer'
  ).length
  const businessCount = allMembers.filter((m) => isBusinessAccount(m)).length

  const displayMembers =
    userType === 'all'
      ? allMembers.filter((m) => !isBusinessAccount(m) && !isSponsorAccount(m))
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
      <AdminPageLayout
        title="Individual Members"
        subtitle="Individuals can volunteer and join the PB team · Business members are managed separately"
      >
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500 dark:text-muted-foreground">Loading members...</p>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout
      title="Individual Members"
      subtitle="Individuals can volunteer and join the PB team · Business members live under Business Members"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-black dark:text-foreground">All Members</h2>
            <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
              Select one or more members to update their role/status or delete them.
            </p>
          </div>
          {selectedList.length === 0 ? (
            <p className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-muted-foreground">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border p-4 min-w-0">
            <p className="text-sm text-gray-600 dark:text-muted-foreground">Individual members</p>
            <p className="text-2xl font-bold text-black dark:text-foreground">{individualCount}</p>
          </div>
          <div className="bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border p-4 min-w-0">
            <p className="text-sm text-gray-600 dark:text-muted-foreground">Volunteers / PB team</p>
            <p className="text-2xl font-bold text-black dark:text-foreground">{volunteerCount}</p>
          </div>
          <div className="bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border p-4 min-w-0">
            <p className="text-sm text-gray-600 dark:text-muted-foreground">Business accounts (see Business Members)</p>
            <p className="text-2xl font-bold text-black dark:text-foreground">{businessCount}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex gap-2 overflow-x-auto pb-1 min-w-0">
            {[
              { id: 'all', label: 'All individuals' },
              { id: 'member', label: 'Members' },
              { id: 'volunteer', label: 'Volunteers' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setUserType(type.id)
                  setLoading(true)
                }}
                className={userType === type.id ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-card rounded-md border border-gray-200 dark:border-border px-2.5 min-w-0 h-8">
            <Search size={14} className="text-gray-400 dark:text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search by name, email, or location..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setLoading(true)
              }}
              className="flex-1 py-1 outline-none bg-transparent text-xs text-gray-700 dark:text-foreground"
            />
          </div>
        </div>

        {selectedList.length > 0 ? (
          <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-md border border-neutral-300 dark:border-border bg-white dark:bg-card px-2.5 py-2 shadow-none">
            <p className="text-[11px] font-semibold text-black dark:text-foreground w-full sm:w-auto">
              {selectedList.length} member{selectedList.length === 1 ? '' : 's'} selected
            </p>
            <label className="text-[10px] font-medium text-neutral-600 dark:text-muted-foreground">
              Set status
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="mt-0.5 block h-6 min-h-0 rounded-md border border-neutral-300 dark:border-border px-2 text-[11px] bg-white dark:bg-card"
              >
                <option value="">—</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
            <label className="text-[10px] font-medium text-neutral-600 dark:text-muted-foreground">
              Set type / role
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value)}
                className="mt-0.5 block h-6 min-h-0 rounded-md border border-neutral-300 dark:border-border px-2 text-[11px] bg-white dark:bg-card"
              >
                <option value="">—</option>
                <option value="member">Individual member</option>
                <option value="volunteer">Volunteer / PB team</option>
                <option value="business">Business member</option>
              </select>
            </label>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => void runBulkUpdate()}
              className={`${BUTTON_PRIMARY} !text-white disabled:opacity-50`}
            >
              {bulkBusy ? 'Working…' : 'Update selected'}
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => void runBulkDelete()}
              className={`${BUTTON_PRIMARY} gap-1 !text-white disabled:opacity-50`}
            >
              <Trash2 size={12} />
              {bulkBusy ? 'Working…' : 'Delete selected'}
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => setSelectedIds(new Set())}
              className={`${BUTTON_PRIMARY} !text-white disabled:opacity-50`}
            >
              Clear selection
            </button>
          </div>
        ) : null}

        {displayMembers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-muted rounded-lg">
            <p className="text-gray-500 dark:text-muted-foreground">No members found matching your filters.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border admin-table-scroll min-w-0">
            <table className="w-full min-w-[1080px]">
              <thead className="bg-gray-50 dark:bg-muted border-b border-gray-200 dark:border-border">
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-foreground">Member</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-foreground">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-foreground">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-foreground">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-foreground">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-foreground">
                    Volunteer Hours
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-foreground">Joined</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-foreground whitespace-nowrap">
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
                      className={selected ? 'bg-neutral-100 dark:bg-muted' : 'hover:bg-gray-50'}
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
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-muted-foreground hidden md:table-cell">
                        {member.email}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-muted-foreground whitespace-nowrap">
                        {formatUserPhoneDisplay(member)}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className="px-2 py-0.5 bg-neutral-100 dark:bg-muted text-neutral-900 dark:text-foreground rounded text-[10px] font-medium capitalize">
                          {member.role || member.userType || 'member'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-muted-foreground">
                        {member.location?.city || member.emirate || member.location || '-'}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className="font-medium text-gray-900 dark:text-foreground">
                          {member.volunteerHours || 0} hrs
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            member.status === 'active'
                              ? 'bg-neutral-900 text-white'
                              : 'bg-gray-100 dark:bg-muted text-gray-800 dark:text-foreground'
                          }`}
                        >
                          {member.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-muted-foreground">
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
