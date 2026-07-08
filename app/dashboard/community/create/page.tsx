'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { createGroup } from '@/lib/community-service'
import type { Group } from '@/lib/community-service'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import { DashboardPageShell } from '@/components/dashboard-states'

export default function CreateGroupPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    type: 'member_networking',
    about: '',
  })

  const handleCreateGroup = async () => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser || !formData.name.trim()) {
      alert('Please fill in required fields')
      return
    }

    setLoading(true)
    try {
      const groupId = await createGroup(
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
          type: formData.type as Group['type'],
          about: formData.about.trim(),
          isActive: true,
          isPublic: true,
          requiresApproval: false,
          bannedMembers: [],
        },
        firebaseUser.uid
      )
      router.push(`/dashboard/community/${groupId}`)
    } catch (error) {
      console.error('[v0] Error:', error)
      alert('Error creating group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardPageShell title="Create New Group" subtitle="Build a group for your community">
      <button
        type="button"
        onClick={() => router.push('/dashboard/community')}
        className="flex items-center gap-2 !bg-transparent !text-black !shadow-none px-0 mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="w-full max-w-2xl mx-auto">
        <Card className="p-6 sm:p-8 border border-neutral-200 w-full">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-neutral-700">Group Name *</label>
              <Input
                placeholder="e.g., Frontend Developers"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-neutral-700">Description *</label>
              <textarea
                placeholder="Brief description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-y min-h-[6rem]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-neutral-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900"
              >
                <option value="member_networking">Member Networking</option>
                <option value="cause_discussion">Cause Discussion</option>
                <option value="business_networking">Business Networking</option>
                <option value="volunteer_coordination">Volunteer Coordination</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-neutral-700">About</label>
              <textarea
                placeholder="More details..."
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                rows={5}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-y min-h-[8rem]"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:justify-end">
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={loading}
                className="!bg-black !text-white px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard/community')}
                className="!bg-white !text-black border border-gray-300 px-6 py-2.5 rounded-lg text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardPageShell>
  )
}
