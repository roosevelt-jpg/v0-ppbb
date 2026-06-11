'use client'

import React from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, MessageSquare, Trash2 } from 'lucide-react'

interface Group {
  id: string
  name: string
  description: string
  type: string
  memberCount: number
  postCount: number
  isActive: boolean
}

export default function GroupsAdminPage() {
  const [groups, setGroups] = React.useState<Group[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [filteredGroups, setFilteredGroups] = React.useState<Group[]>([])

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'groups')),
      (snapshot) => {
        const groupsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Group[]
        setGroups(groupsData)
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error loading groups:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  React.useEffect(() => {
    const filtered = groups.filter(
      (g) =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredGroups(filtered)
  }, [searchTerm, groups])

  const handleDeactivate = async (groupId: string) => {
    if (!confirm('Deactivate this group?')) return
    try {
      await updateDoc(doc(db, 'groups', groupId), { isActive: false })
    } catch (error) {
      console.error('[v0] Error deactivating:', error)
    }
  }

  const handleDelete = async (groupId: string) => {
    if (!confirm('Delete permanently?')) return
    try {
      await deleteDoc(doc(db, 'groups', groupId))
    } catch (error) {
      console.error('[v0] Error deleting:', error)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Community Groups</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Total</p>
          <p className="text-2xl font-bold">{groups.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Active</p>
          <p className="text-2xl font-bold">{groups.filter((g) => g.isActive).length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Members</p>
          <p className="text-2xl font-bold">{groups.reduce((sum, g) => sum + g.memberCount, 0)}</p>
        </Card>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {!loading ? (
        <div className="space-y-4">
          {filteredGroups.map((group) => (
            <Card key={group.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">{group.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{group.description}</p>
                  <div className="flex gap-4 text-sm">
                    <span><Users className="w-4 h-4 inline mr-1" />{group.memberCount}</span>
                    <span><MessageSquare className="w-4 h-4 inline mr-1" />{group.postCount}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleDeactivate(group.id)} className="bg-yellow-600 hover:bg-yellow-700">
                    Deactivate
                  </Button>
                  <Button size="sm" onClick={() => handleDelete(group.id)} className="bg-red-600 hover:bg-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">Loading...</div>
      )}

      {!loading && filteredGroups.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-600">No groups found</p>
        </Card>
      )}
    </div>
  )
}
