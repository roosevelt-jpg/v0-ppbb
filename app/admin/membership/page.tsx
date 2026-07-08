'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, updateDoc, doc, writeBatch, onSnapshot } from 'firebase/firestore'
import { Crown, Gift, Zap, TrendingUp, Users, AlertCircle, CheckCircle, Download, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { AdminUserCell } from '@/components/admin-user-cell'
import { formatUserPhoneDisplay } from '@/lib/user-profile'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/lib/admin-design-system'

export default function MembershipPage() {
  const [members, setMembers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'standard' | 'gold' | 'platinum' | 'expiring'>('all')
  const [selectedMembers, setSelectedMembers] = React.useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = React.useState<'upgrade' | 'downgrade' | 'renewal' | null>(null)
  const [bulkTierTarget, setBulkTierTarget] = React.useState<string>('')
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [sortBy, setSortBy] = React.useState<'name' | 'joined' | 'tier'>('joined')

  React.useEffect(() => {
    // Subscribe to real-time member updates
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const membersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setMembers(membersList)
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching members:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleUpgradeTier = async (memberId: string, newTier: string) => {
    try {
      await updateDoc(doc(db, 'users', memberId), {
        membershipTier: newTier,
        upgradedAt: new Date()
      })
    } catch (error) {
      console.error('[v0] Error upgrading tier:', error)
    }
  }

  const handleBulkAction = async () => {
    if (selectedMembers.size === 0 || !bulkAction || !bulkTierTarget) return

    setIsProcessing(true)
    try {
      const batch = writeBatch(db)
      selectedMembers.forEach((memberId) => {
        const userRef = doc(db, 'users', memberId)
        batch.update(userRef, {
          membershipTier: bulkTierTarget,
          lastTierChange: new Date(),
          bulkUpdateApplied: true
        })
      })
      await batch.commit()

      setSelectedMembers(new Set())
      setBulkAction(null)
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
      setSelectedMembers(new Set(filteredAndSearchedMembers.map(m => m.id)))
    }
  }

  const exportMembershipData = () => {
    const csv = [
      ['Name', 'Email', 'Tier', 'Joined', 'Status'],
      ...filteredAndSearchedMembers.map(m => [
        `${m.firstName} ${m.lastName}`,
        m.email,
        m.membershipTier || 'standard',
        m.memberSince ? new Date(m.memberSince).toLocaleDateString() : '-',
        m.active ? 'Active' : 'Inactive'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `membership-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  let filteredMembers = filter === 'all'
    ? members
    : filter === 'expiring'
      ? members.filter(m => {
          // Assuming expiring within 30 days
          return true // Simplified for now
        })
      : members.filter(m => m.membershipTier === filter)

  const filteredAndSearchedMembers = filteredMembers
    .filter(m => {
      const name = `${m.firstName} ${m.lastName}`.toLowerCase()
      const email = m.email?.toLowerCase() || ''
      return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase())
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        case 'tier':
          return (a.membershipTier || 'standard').localeCompare(b.membershipTier || 'standard')
        case 'joined':
        default:
          return (b.memberSince?.toMillis?.() || 0) - (a.memberSince?.toMillis?.() || 0)
      }
    })

  const tierStats = {
    standard: members.filter(m => m.membershipTier === 'standard' || !m.membershipTier).length,
    gold: members.filter(m => m.membershipTier === 'gold').length,
    platinum: members.filter(m => m.membershipTier === 'platinum').length,
    active: members.filter(m => m.active).length,
  }

  const tiers = {
    standard: {
      icon: Gift,
      color: 'bg-blue-100',
      textColor: 'text-blue-700',
      perks: ['Basic community access', 'Event invitations', 'Email support']
    },
    gold: {
      icon: Crown,
      color: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      perks: ['All Standard perks', 'Priority event access', 'Monthly newsletter', 'Exclusive webinars']
    },
    platinum: {
      icon: Zap,
      color: 'bg-purple-100',
      textColor: 'text-purple-700',
      perks: ['All Gold perks', 'VIP event access', 'Direct admin support', 'Governance voting rights']
    },
  }

  return (
    <>

      <div className="p-8 bg-neutral-50 space-y-8">
        {/* Tier Overview - Enhanced Analytics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total Members</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{tierStats.active}</p>
              </div>
              <Users className="w-8 h-8 text-neutral-400" />
            </div>
          </Card>
          {Object.entries(tiers).map(([tierName, tierInfo]: [string, any]) => {
            const Icon = tierInfo.icon
            return (
              <Card key={tierName} className={`p-6 border-2 ${tierInfo.color}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${tierInfo.textColor} capitalize`}>{tierName}</p>
                    <p className={`text-2xl font-bold ${tierInfo.textColor} mt-2`}>{tierStats[tierName as keyof typeof tierStats]}</p>
                  </div>
                  <Icon className={`w-6 h-6 ${tierInfo.textColor} opacity-60`} />
                </div>
              </Card>
            )
          })}
        </div>

        {/* Tier Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(tiers).map(([tierName, tierInfo]: [string, any]) => {
            const Icon = tierInfo.icon
            return (
              <Card key={tierName} className={`p-6 border-2 ${tierInfo.color}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`text-lg font-bold ${tierInfo.textColor} capitalize`}>{tierName} Tier</h3>
                    <p className={`text-sm ${tierInfo.textColor} font-semibold mt-1`}>
                      {tierStats[tierName as keyof typeof tierStats]} members
                    </p>
                  </div>
                  <Icon className={`w-6 h-6 ${tierInfo.textColor}`} />
                </div>
                <div className="space-y-2">
                  {tierInfo.perks.map((perk: string, i: number) => (
                    <p key={i} className="text-sm text-neutral-700">• {perk}</p>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Bulk Actions */}
        {selectedMembers.size > 0 && (
          <Card className="p-6 border-2 border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-semibold text-neutral-900">{selectedMembers.size} members selected</h3>
                <p className="text-sm text-neutral-600 mt-1">Apply bulk actions to selected members</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={bulkTierTarget}
                  onChange={(e) => setBulkTierTarget(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                >
                  <option value="">Select target tier...</option>
                  <option value="standard">Standard</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkTierTarget || isProcessing}
                  className={`${BUTTON_PRIMARY}`}
                >
                  {isProcessing ? 'Processing...' : 'Apply to All'}
                </button>
                <button
                  onClick={() => setSelectedMembers(new Set())}
                  className={`${BUTTON_SECONDARY}`}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Filters and Search */}
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'standard', 'gold', 'platinum', 'expiring'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                  filter === f
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {f === 'all' ? 'All Members' : f}
              </button>
            ))}
          </div>

          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-neutral-300 rounded-lg text-sm"
            >
              <option value="joined">Sort by: Joined Date</option>
              <option value="name">Sort by: Name</option>
              <option value="tier">Sort by: Tier</option>
            </select>
            <button
              onClick={exportMembershipData}
              className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Members Table */}
        <Card className="border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-100 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedMembers.size === filteredAndSearchedMembers.length && filteredAndSearchedMembers.length > 0}
                      onChange={toggleAllSelection}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">Member</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">Tier</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">Joined</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-neutral-600">Loading members...</td>
                  </tr>
                ) : filteredAndSearchedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-neutral-600">No members found</td>
                  </tr>
                ) : (
                  filteredAndSearchedMembers.map(member => (
                    <tr key={member.id} className={`border-b border-neutral-200 hover:bg-neutral-50 ${selectedMembers.has(member.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedMembers.has(member.id)}
                          onChange={() => toggleMemberSelection(member.id)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <AdminUserCell user={member} />
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">{member.email}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600 whitespace-nowrap">
                        {formatUserPhoneDisplay(member)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
                          member.membershipTier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                          member.membershipTier === 'platinum' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {member.membershipTier || 'standard'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {member.active ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-xs text-green-700 font-medium">Active</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                              <span className="text-xs text-orange-700 font-medium">Inactive</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {member.memberSince ? formatDistanceToNow(member.memberSince.toDate?.() || new Date(member.memberSince), { addSuffix: true }) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          onChange={(e) => handleUpgradeTier(member.id, e.target.value)}
                          value={member.membershipTier || 'standard'}
                          className="text-sm px-3 py-1 border border-neutral-200 rounded-lg hover:border-neutral-300 cursor-pointer"
                        >
                          <option value="standard">Standard</option>
                          <option value="gold">Gold</option>
                          <option value="platinum">Platinum</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 text-sm text-neutral-600">
            Showing {filteredAndSearchedMembers.length} of {members.length} members
          </div>
        </Card>
      </div>
    </>
  )
}
