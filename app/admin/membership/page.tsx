'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore'
import { Users, AlertCircle, CheckCircle, Download, Trash2, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { AdminUserCell } from '@/components/admin-user-cell'
import { AdminSelect } from '@/components/admin-select'
import { formatUserPhoneDisplay } from '@/lib/user-profile'
import { BUTTON_PRIMARY, BUTTON_ROW_COMPACT, ACTION_ROW } from '@/lib/admin-design-system'
import { useAdminAudit } from '@/lib/use-admin-audit'
import { adminApiFetch } from '@/lib/admin-api-client'
import { PricingPlan } from '@/lib/pricing-types'
import {
  countMembersForPlan,
  countUnassignedMembers,
  formatPlanPrice,
  getMemberAssignedPlan,
  getPlanIncludedItems,
  memberHasAssignedPlan,
  memberMatchesPlan,
} from '@/lib/pricing-utils'
import { isExpiringsoon } from '@/lib/membership-utils'
import { isAccountDeleted } from '@/lib/user-settings'

type MembershipFilter = 'all' | 'expiring' | 'unassigned' | string

export default function MembershipPage() {
  const audit = useAdminAudit()
  const [members, setMembers] = React.useState<Record<string, unknown>[]>([])
  const [plans, setPlans] = React.useState<PricingPlan[]>([])
  const [loadingMembers, setLoadingMembers] = React.useState(true)
  const [loadingPlans, setLoadingPlans] = React.useState(true)
  const [filter, setFilter] = React.useState<MembershipFilter>('all')
  const [selectedMembers, setSelectedMembers] = React.useState<Set<string>>(new Set())
  const [bulkTierTarget, setBulkTierTarget] = React.useState<string>('')
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [sortBy, setSortBy] = React.useState<'name' | 'joined' | 'tier'>('joined')

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const membersList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        setMembers(membersList)
        setLoadingMembers(false)
      },
      (error) => {
        console.error('[v0] Error fetching members:', error)
        setLoadingMembers(false)
      }
    )

    return () => unsubscribe()
  }, [])

  React.useEffect(() => {
    const q = query(collection(db, 'pricingPlans'), orderBy('order', 'asc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const plansData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as PricingPlan[]
        const activePlans = plansData.filter((plan) => plan.active !== false)
        setPlans(activePlans.length > 0 ? activePlans : plansData)
        setLoadingPlans(false)
      },
      (error) => {
        console.error('[v0] Error fetching pricing plans:', error)
        setLoadingPlans(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const loading = loadingMembers || loadingPlans

  const handleUpgradeTier = async (memberId: string, planId: string) => {
    if (!planId) return
    try {
      const member = members.find((m) => String(m.id) === memberId)
      const previousPlanName = String(
        member?.membershipPlanName || member?.membershipTier || ''
      ).trim()
      const plan = plans.find((p) => p.id === planId)
      const isBusiness = /business|partner|corporate|company/i.test(String(plan?.name || ''))
      await updateDoc(doc(db, 'users', memberId), {
        membershipTier: planId,
        membershipPlanId: planId,
        membershipPlanName: plan?.name ?? planId,
        membershipStatus: 'active',
        membershipRenewDate: new Date(
          new Date().setMonth(new Date().getMonth() + (plan?.billingPeriod === 'yearly' ? 12 : 1))
        ).toISOString(),
        upgradedAt: new Date(),
        ...(isBusiness
          ? {
              role: 'business',
              userType: 'business',
              hasBusinessProfile: true,
              roles: ['member', 'business'],
            }
          : {
              role: 'member',
              userType: 'member',
              roles: ['member'],
            }),
      })
      audit({
        actionType: 'update',
        action: `Updated membership tier for member ${memberId}`,
        entityType: 'member',
        entityId: memberId,
        entityName: plan?.name,
        status: 'success',
      })
      void adminApiFetch('/api/email/membership-upgrade', {
        method: 'POST',
        body: JSON.stringify({
          memberId,
          planName: plan?.name ?? planId,
          previousPlanName: previousPlanName || null,
        }),
      }).catch(() => {
        /* branded upgrade email is best-effort */
      })
    } catch (error) {
      console.error('[v0] Error upgrading tier:', error)
    }
  }

  const handleBulkAction = async () => {
    if (selectedMembers.size === 0 || !bulkTierTarget) return

    setIsProcessing(true)
    try {
      const plan = plans.find((p) => p.id === bulkTierTarget)
      const batch = writeBatch(db)
      selectedMembers.forEach((memberId) => {
        const userRef = doc(db, 'users', memberId)
        batch.update(userRef, {
          membershipTier: bulkTierTarget,
          membershipPlanId: bulkTierTarget,
          membershipPlanName: plan?.name ?? bulkTierTarget,
          lastTierChange: new Date(),
          bulkUpdateApplied: true,
        })
      })
      await batch.commit()

      audit({
        actionType: 'update',
        action: `Bulk membership tier update for ${selectedMembers.size} member(s)`,
        entityType: 'member',
        entityName: plan?.name,
        status: 'success',
        details: `Plan: ${plan?.name || bulkTierTarget}`,
      })

      setSelectedMembers(new Set())
      setBulkTierTarget('')
    } catch (error) {
      console.error('[v0] Error applying bulk action:', error)
      alert(error instanceof Error ? error.message : 'Bulk update failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedMembers)
    if (ids.length === 0) return
    if (
      !confirm(
        `Delete ${ids.length} selected member${ids.length === 1 ? '' : 's'}?\n\nThey will be removed from membership lists (soft-deleted).`
      )
    ) {
      return
    }

    setIsProcessing(true)
    try {
      const json = await adminApiFetch('/api/members', {
        method: 'POST',
        body: JSON.stringify({ action: 'bulk-delete', ids }),
      })
      if (!json.success) throw new Error(json.error || 'Delete failed')

      audit({
        actionType: 'delete',
        action: `Bulk deleted ${ids.length} member(s) from Membership`,
        entityType: 'member',
        status: 'success',
        details: `ids: ${ids.slice(0, 8).join(', ')}${ids.length > 8 ? '…' : ''}`,
      })

      setSelectedMembers(new Set())
    } catch (error) {
      console.error('[membership] bulk delete error:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete members')
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleMemberSelection = (memberId: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId)
    } else {
      newSelected.add(memberId)
    }
    setSelectedMembers(newSelected)
  }

  const toggleAllSelection = () => {
    if (selectedMembers.size === filteredAndSearchedMembers.length) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(filteredAndSearchedMembers.map((m) => String(m.id))))
    }
  }

  const exportMembershipData = () => {
    const csv = [
      ['Name', 'Email', 'Tier', 'Joined', 'Status'],
      ...filteredAndSearchedMembers.map((m) => {
        const plan = getMemberAssignedPlan(m, plans)
        return [
          `${m.firstName} ${m.lastName}`,
          m.email,
          plan?.name || String(m.membershipTier || 'Unassigned'),
          m.memberSince ? new Date(String(m.memberSince)).toLocaleDateString() : '-',
          m.active ? 'Active' : 'Inactive',
        ]
      }),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `membership-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const isMemberExpiring = (member: Record<string, unknown>) => {
    if (!member.membershipRenewDate) return false
    const renewDate = member.membershipRenewDate as { toDate?: () => Date }
    const date = renewDate.toDate?.() || new Date(String(member.membershipRenewDate))
    return isExpiringsoon(date)
  }

  const activeMembers = React.useMemo(
    () => members.filter((m) => !isAccountDeleted(m)),
    [members]
  )

  const filteredMembers =
    filter === 'all'
      ? activeMembers
      : filter === 'expiring'
        ? activeMembers.filter(isMemberExpiring)
        : filter === 'unassigned'
          ? activeMembers.filter((m) => !memberHasAssignedPlan(m))
          : activeMembers.filter((m) => {
              const plan = plans.find((p) => p.id === filter)
              return plan ? memberMatchesPlan(m, plan) : false
            })

  const filteredAndSearchedMembers = filteredMembers
    .filter((m) => {
      const name = `${m.firstName} ${m.lastName}`.toLowerCase()
      const email = String(m.email || '').toLowerCase()
      return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase())
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        case 'tier': {
          const planA = getMemberAssignedPlan(a, plans)
          const planB = getMemberAssignedPlan(b, plans)
          return (planA?.name || '').localeCompare(planB?.name || '')
        }
        case 'joined':
        default:
          return (
            ((b.memberSince as { toMillis?: () => number })?.toMillis?.() || 0) -
            ((a.memberSince as { toMillis?: () => number })?.toMillis?.() || 0)
          )
      }
    })

  const activeMemberCount = activeMembers.filter((m) => m.active).length
  const unassignedCount = countUnassignedMembers(activeMembers)

  const filterTabs: { key: MembershipFilter; label: string }[] = [
    { key: 'all', label: 'All Members' },
    ...plans.map((plan) => ({ key: plan.id, label: plan.name })),
    ...(unassignedCount > 0 ? [{ key: 'unassigned' as const, label: 'Unassigned' }] : []),
    { key: 'expiring', label: 'Expiring' },
  ]

  const getMemberPlanSelectValue = (member: Record<string, unknown>) => {
    const assigned = getMemberAssignedPlan(member, plans)
    return assigned?.id || ''
  }

  const tierSelectOptions = React.useMemo(
    () => [
      { value: '', label: 'Select tier…' },
      ...plans.map((plan) => ({
        value: plan.id,
        label: plan.active === false ? `${plan.name} (Inactive)` : plan.name,
      })),
    ],
    [plans]
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-neutral-50 space-y-6 lg:space-y-8 min-w-0">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-6 border border-neutral-200">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-neutral-600 uppercase tracking-wide font-body">Total Members</p>
              <p className="text-2xl sm:text-3xl font-headline font-bold text-neutral-900 mt-2">{activeMembers.length}</p>
              <p className="text-xs text-neutral-500 mt-1 font-body">{activeMemberCount} active</p>
            </div>
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-neutral-400 shrink-0" />
          </div>
        </Card>

        {unassignedCount > 0 && (
          <Card className="p-4 sm:p-6 border border-neutral-200 bg-neutral-50">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-neutral-600 uppercase tracking-wide font-body">Unassigned</p>
                <p className="text-2xl sm:text-3xl font-headline font-bold text-neutral-900 mt-2">{unassignedCount}</p>
              </div>
              <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-neutral-400 shrink-0" />
            </div>
          </Card>
        )}
      </div>

      {/* Plan detail cards — driven by pricingPlans in Firestore */}
      {plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((plan) => {
            const count = countMembersForPlan(activeMembers, plan)
            const accent = plan.color || '#111111'
            const items = getPlanIncludedItems(plan)

            return (
              <Card
                key={`detail-${plan.id}`}
                className="flex flex-col p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm transition hover:shadow-lg"
                style={{ borderTop: `4px solid ${accent}`, backgroundColor: `${accent}06` }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="flex items-center justify-center w-11 h-11 rounded-full text-xl shrink-0"
                      style={{ backgroundColor: `${accent}1a` }}
                    >
                      {plan.icon || '🎯'}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-lg font-headline font-bold leading-tight truncate" style={{ color: accent }}>
                        {plan.name}
                      </h3>
                      <p className="text-xs font-semibold font-body mt-0.5" style={{ color: accent }}>
                        {count} member{count === 1 ? '' : 's'} · {formatPlanPrice(plan)}
                      </p>
                    </div>
                  </div>
                  {plan.active === false ? (
                    <span className="px-2 py-1 bg-neutral-200 text-neutral-600 text-xs font-medium rounded-full shrink-0">
                      Inactive
                    </span>
                  ) : null}
                </div>
                {plan.description ? (
                  <p className="text-sm text-neutral-600 font-body mb-4 pb-4 border-b border-neutral-100">
                    {plan.description}
                  </p>
                ) : null}
                <div className="flex-1 space-y-2">
                  {items.length > 0 ? (
                    items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} strokeWidth={2.5} />
                        <p className="text-sm text-neutral-700 font-body leading-snug">{item}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500 font-body">
                      No features listed. Edit this plan under Pricing Plans.
                    </p>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-6 border border-dashed border-neutral-300 bg-white">
          <p className="text-sm text-neutral-600 font-body">
            No pricing plans configured yet. Create plans in{' '}
            <a href="/admin/pricing" className="underline text-neutral-900">
              Pricing Plans
            </a>{' '}
            to manage membership tiers.
          </p>
        </Card>
      )}

      {/* Bulk actions */}
      {selectedMembers.size > 0 && (
        <Card className="p-4 sm:p-6 border-2 border-black bg-white sticky top-2 z-20 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-neutral-900 font-body">
                {selectedMembers.size} member{selectedMembers.size === 1 ? '' : 's'} selected
              </h3>
              <p className="text-sm text-neutral-600 mt-1 font-body">
                Change tier or delete selected members
              </p>
            </div>
            <div className={`${ACTION_ROW} flex-wrap gap-2 w-full lg:w-auto`}>
              <select
                value={bulkTierTarget}
                onChange={(e) => setBulkTierTarget(e.target.value)}
                className="h-8 min-h-0 px-2.5 border border-neutral-300 rounded-md text-xs bg-white font-body"
              >
                <option value="">Select target tier...</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void handleBulkAction()}
                disabled={!bulkTierTarget || isProcessing}
                className={`${BUTTON_ROW_COMPACT} disabled:opacity-50`}
              >
                {isProcessing ? 'Working…' : 'Apply tier'}
              </button>
              <button
                type="button"
                onClick={() => void handleBulkDelete()}
                disabled={isProcessing}
                className={`${BUTTON_ROW_COMPACT} disabled:opacity-50`}
                title="Delete selected"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
              <button
                type="button"
                onClick={() => setSelectedMembers(new Set())}
                disabled={isProcessing}
                className={`${BUTTON_ROW_COMPACT} disabled:opacity-50`}
              >
                Clear
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Filters and search */}
      <div className="space-y-4 min-w-0">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap shrink-0 font-body ${
                filter === tab.key
                  ? 'bg-black text-white'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
          <div className="w-full sm:flex-1 min-w-0">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm font-body"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'joined' | 'tier')}
            className="w-full sm:w-auto px-4 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-body"
          >
            <option value="joined">Sort by: Joined Date</option>
            <option value="name">Sort by: Name</option>
            <option value="tier">Sort by: Tier</option>
          </select>
          <button
            onClick={exportMembershipData}
            className={`${BUTTON_PRIMARY} w-full sm:w-auto flex items-center justify-center gap-2`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Members table */}
      <Card className="border border-neutral-200 min-w-0">
        <div className="admin-table-scroll">
          <table className="w-full min-w-[900px]">
            <thead className="bg-neutral-100 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedMembers.size === filteredAndSearchedMembers.length &&
                      filteredAndSearchedMembers.length > 0
                    }
                    onChange={toggleAllSelection}
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-neutral-700 whitespace-nowrap">
                  Member
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-neutral-700 whitespace-nowrap">
                  Email
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-neutral-700 whitespace-nowrap">
                  Phone
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-neutral-700 whitespace-nowrap">
                  Tier
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-neutral-700 whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-neutral-700 whitespace-nowrap">
                  Joined
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-neutral-700 whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-neutral-600 font-body">
                    Loading members...
                  </td>
                </tr>
              ) : filteredAndSearchedMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-neutral-600 font-body">
                    No members found
                  </td>
                </tr>
              ) : (
                filteredAndSearchedMembers.map((member) => {
                  const assignedPlan = getMemberAssignedPlan(member, plans)
                  const tierColor = assignedPlan?.color || '#111111'

                  return (
                    <tr
                      key={String(member.id)}
                      className={`border-b border-neutral-200 hover:bg-neutral-50 ${
                        selectedMembers.has(String(member.id)) ? 'bg-neutral-100' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedMembers.has(String(member.id))}
                          onChange={() => toggleMemberSelection(String(member.id))}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm">
                        <AdminUserCell user={member} />
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-neutral-600 max-w-[200px] truncate">
                        {String(member.email || '')}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-neutral-600 whitespace-nowrap">
                        {formatUserPhoneDisplay(member)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className="text-xs px-3 py-1 rounded-full font-medium"
                          style={{
                            backgroundColor: `${tierColor}20`,
                            color: tierColor,
                          }}
                        >
                          {assignedPlan?.name || String(member.membershipTier || 'Unassigned')}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {member.active ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-neutral-700" />
                              <span className="text-xs text-neutral-700 font-medium">Active</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-neutral-500" />
                              <span className="text-xs text-neutral-500 font-medium">Inactive</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-neutral-600 whitespace-nowrap">
                        {member.memberSince
                          ? formatDistanceToNow(
                              (member.memberSince as { toDate?: () => Date }).toDate?.() ||
                                new Date(String(member.memberSince)),
                              { addSuffix: true }
                            )
                          : '-'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap min-w-[10rem]">
                        <div
                          className="relative z-20"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <AdminSelect
                            value={getMemberPlanSelectValue(member)}
                            onChange={(planId) => handleUpgradeTier(String(member.id), planId)}
                            options={tierSelectOptions}
                            aria-label={`Assign membership tier for ${member.firstName || 'member'}`}
                            className="min-w-[10rem]"
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 sm:px-6 py-4 bg-neutral-50 border-t border-neutral-200 text-sm text-neutral-600 font-body">
          Showing {filteredAndSearchedMembers.length} of {activeMembers.length} members
        </div>
      </Card>
    </div>
  )
}
