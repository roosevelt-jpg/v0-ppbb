'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { createGroup } from '@/lib/community-service'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'

export default function CreateGroupPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
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
          name: formData.name,
          description: formData.description,
          type: formData.type as any,
          about: formData.about,
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
    <div className="flex min-h-screen bg-gray-50">
      <MemberHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 p-6 lg:p-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">Create New Group</h1>

          <Card className="p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Group Name *</label>
                <Input
                  placeholder="e.g., Frontend Developers"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  placeholder="Brief description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="member_networking">Member Networking</option>
                  <option value="cause_discussion">Cause Discussion</option>
                  <option value="business_networking">Business Networking</option>
                  <option value="volunteer_coordination">Volunteer Coordination</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">About</label>
                <textarea
                  placeholder="More details..."
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm h-32"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={handleCreateGroup} disabled={loading} className="bg-blue-600 hover:bg-blue-700 flex-1">
                  {loading ? 'Creating...' : 'Create Group'}
                </Button>
                <Button onClick={() => router.back()} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
