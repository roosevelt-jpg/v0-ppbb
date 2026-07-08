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
  where,
} from 'firebase/firestore'
import { Users, AlertCircle, CheckCircle, Download } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { AdminUserCell } from '@/components/admin-user-cell'
import { formatUserPhoneDisplay } from '@/lib/user-profile'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/lib/admin-design-system'
import { PricingPlan } from '@/lib/pricing-types'
import {
  countMembersForPlan,
  getMemberAssignedPlan,
  getPlanIncludedItems,
  memberMatchesPlan,
} from '@/lib/pricing-utils'
import { isExpiringsoon } from '@/lib/membership-utils'

type MembershipFilter = 'all' | 'expiring' | string

export default function MembershipPage() {
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
    const q = query(
      collection(db, 'pricingPlans'),
      where('active', '==', true),
      orderBy('order', 'asc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const plansData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as PricingPlan[]
        setPlans(plansData)
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
    try {
      const plan = plans.find((p) => p.id === planId)
      await updateDoc(doc(db, 'users', memberId), {
        membershipTier: planId,
        membershipPlanId: planId,
        membershipPlanName: plan?.name ?? planId,
        upgradedAt: new Date(),
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

      setSelectedMembers(new Set())
      setBulkTierTarget('')
    } catch (error) {
      console.error('[v0] Error applying bulk action:', error)
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

  const filteredMembers =
    filter === 'all'
      ? members
      : filter === 'expiring'
        ? members.filter(isMemberExpiring)
        : members.filter((m) => {
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

  const activeMemberCount = members.filter((m) => m.active).length

  const filterTabs: { key: MembershipFilter; label: string }[] = [
    { key: 'all', label: 'All Members' },
    ...plans.map((plan) => ({ key: plan.id, label: plan.name })),
    { key: 'expiring', label: 'Expiring' },
  ]

  const getMemberPlanSelectValue = (member: Record<string, unknown>) => {
    const assigned = getMemberAssignedPlan(member, plans)
    return assigned?.id || String(member.membershipTier || plans[0]?.id || '')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-neutral-50 space-y-6 lg:space-y-8 min-w-0">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-6 border border-neutral-200">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-neutral-600 uppercase tracking-wide font-body">Total Members</p>
              <p className="text-2xl sm:text-3xl font-headline font-bold text-neutral-900 mt-2">{activeMemberCount}</p>
            </div>
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-neutral-400 shrink-0" />
          </div>
        </Card>

        {plans.map((plan) => {
          const count = countMembersForPlan(members, plan)
          const accent = plan.color || '#111111'
          return (
            <Card
              key={plan.id}
              className="p-4 sm:p-6 border-2"
              style={{ borderColor: accent, backgroundColor: `${accent}12` }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate" style={{ color: accent }}>
                    {plan.name}
                  </p>
                  <p className="text-2xl sm:text-3xl font-headline font-bold mt-2" style={{ color: accent }}>
                    {count}
                  </p>
                </div>
                <span className="text-2xl sm:text-3xl shrink-0" aria-hidden>
                  {plan.icon || '🎯'}
                </span>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Plan detail cards */}
      {plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((plan) => {
            const count = countMembersForPlan(members, plan)
            const accent = plan.color || '#111111'
            const items = getPlanIncludedItems(plan)

            return (
              <Card
                key={`detail-${plan.id}`}
                className="p-4 sm:p-6 border-2"
                style={{ borderColor: accent, backgroundColor: `${accent}08` }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-headline font-bold truncate" style={{ color: accent }}>
                      {plan.name} Tier
                    </h3>
                    <p className="text-sm font-medium mt-1" style={{ color: accent }}>
                      {count} members
                    </p>
                  </div>
                  <span className="text-2xl shrink-0">{plan.icon || '🎯'}</span>
                </div>
                <div className="space-y-2">
                  {items.length > 0 ? (
                    items.map((item, i) => (
                      <p key={i} className="text-sm text-neutral-700 font-body">
                        • {item}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500 font-body">No features listed for this plan.</p>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Bulk actions */}
      {selectedMembers.size > 0 && (
        <Card className="p-4 sm:p-6 border border-neutral-300 bg-neutral-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-neutral-900 font-body">{selectedMembers.size} members selected</h3>
              <p className="text-sm text-neutral-600 mt-1 font-body">Apply bulk actions to selected members</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <select
                value={bulkTierTarget}
                onChange={(e) => setBulkTierTarget(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-body"
              >
                <option value="">Select target tier...</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkTierTarget || isProcessing}
                className={`${BUTTON_PRIMARY} w-full sm:w-auto disabled:bg-neutral-300 disabled:text-neutral-500 disabled:hover:bg-neutral-300`}
              >
                {isProcessing ? 'Processing...' : 'Apply to All'}
              </button>
              <button
                onClick={() => setSelectedMembers(new Set())}
                className={`${BUTTON_SECONDARY} w-full sm:w-auto`}
              >
                Clear Selection
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
        <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
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
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <select
                          onChange={(e) => handleUpgradeTier(String(member.id), e.target.value)}
                          value={getMemberPlanSelectValue(member)}
                          className="text-sm px-3 py-1.5 border border-neutral-200 rounded-lg hover:border-neutral-400 cursor-pointer bg-white font-body min-w-[120px]"
                        >
                          {plans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 sm:px-6 py-4 bg-neutral-50 border-t border-neutral-200 text-sm text-neutral-600 font-body">
          Showing {filteredAndSearchedMembers.length} of {members.length} members
        </div>
      </Card>
    </div>
  )
}
