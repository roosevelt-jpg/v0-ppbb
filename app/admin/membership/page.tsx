'use client'

import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { Card } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore'
import { Crown, Gift, Zap, TrendingUp } from 'lucide-react'

export default function MembershipPage() {
  const [members, setMembers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'standard' | 'gold' | 'platinum'>('all')

  React.useEffect(() => {
    const fetchMembers = async () => {
      try {
        const membersSnap = await getDocs(collection(db, 'users'))
        const membersList = membersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setMembers(membersList)
      } catch (error) {
        console.error('[v0] Error fetching members:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [])

  const handleUpgradeTier = async (memberId: string, newTier: string) => {
    try {
      await updateDoc(doc(db, 'users', memberId), {
        membershipTier: newTier,
        upgradedAt: new Date()
      })
      setMembers(members.map(m => m.id === memberId ? { ...m, membershipTier: newTier } : m))
    } catch (error) {
      console.error('[v0] Error upgrading tier:', error)
    }
  }

  const filteredMembers = filter === 'all' 
    ? members 
    : members.filter(m => m.membershipTier === filter)

  const tiers = {
    standard: { icon: Gift, color: 'bg-blue-100', textColor: 'text-blue-700', perks: ['Basic community access', 'Event invitations', 'Email support'] },
    gold: { icon: Crown, color: 'bg-yellow-100', textColor: 'text-yellow-700', perks: ['All Standard perks', 'Priority event access', 'Monthly newsletter', 'Exclusive webinars'] },
    platinum: { icon: Zap, color: 'bg-purple-100', textColor: 'text-purple-700', perks: ['All Gold perks', 'VIP event access', 'Direct admin support', 'Governance voting rights'] },
  }

  const tierStats = {
    standard: members.filter(m => m.membershipTier === 'standard').length,
    gold: members.filter(m => m.membershipTier === 'gold').length,
    platinum: members.filter(m => m.membershipTier === 'platinum').length,
  }

  return (
    <>
      <AdminHeader title="Membership Management" subtitle="Track and manage member tiers and benefits" />
      
      <div className="p-8 bg-neutral-50 space-y-8">
        {/* Tier Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(tiers).map(([tierName, tierInfo]: [string, any]) => {
            const Icon = tierInfo.icon
            return (
              <Card key={tierName} className={`p-6 border-2 ${tierInfo.color}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`text-lg font-bold ${tierInfo.textColor} capitalize`}>{tierName} Tier</h3>
                    <p className={`text-sm ${tierInfo.textColor} font-semibold mt-1`}>{tierStats[tierName as keyof typeof tierStats]} members</p>
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

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'standard', 'gold', 'platinum'].map(f => (
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

        {/* Members Table */}
        <Card className="border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-100 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">Current Tier</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">Joined</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-neutral-600">Loading members...</td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-neutral-600">No members in this tier</td>
                  </tr>
                ) : (
                  filteredMembers.map(member => (
                    <tr key={member.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                      <td className="px-6 py-4 text-sm text-neutral-900">{member.firstName} {member.lastName}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600">{member.email}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
                          member.membershipTier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                          member.membershipTier === 'platinum' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {member.membershipTier || 'standard'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {member.memberSince ? new Date(member.memberSince).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          onChange={(e) => handleUpgradeTier(member.id, e.target.value)}
                          value={member.membershipTier || 'standard'}
                          className="text-sm px-3 py-1 border border-neutral-200 rounded-lg hover:border-neutral-300"
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
        </Card>
      </div>
    </>
  )
}
