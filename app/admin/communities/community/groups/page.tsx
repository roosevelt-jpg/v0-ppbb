'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, updateDoc, doc, deleteDoc, addDoc, Timestamp } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, MessageSquare, Trash2, Edit, Plus, X, CheckCircle, AlertCircle } from 'lucide-react'

interface Group {
  id: string
  name: string
  description: string
  type: 'member_networking' | 'cause_discussion' | 'business_networking' | 'volunteer_coordination'
  coverImage?: string
  about?: string
  createdBy: string
  createdAt: any
  memberCount: number
  postCount: number
  isActive: boolean
  causeId?: string
  businessId?: string
  isPublic: boolean
  requiresApproval: boolean
  bannedMembers: string[]
}

const GROUP_TYPES = [
  { value: 'member_networking', label: 'Member Networking' },
  { value: 'cause_discussion', label: 'Cause Discussion' },
  { value: 'business_networking', label: 'Business Networking' },
  { value: 'volunteer_coordination', label: 'Volunteer Coordination' },
]

export default function GroupsAdminPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'member_networking',
    about: '',
    isPublic: true,
    requiresApproval: false,
  })

  useEffect(() => {
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
        setMessage({ type: 'error', text: 'Failed to load groups' })
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const filtered = groups.filter(
      (g) =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredGroups(filtered)
  }, [searchTerm, groups])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingGroup) {
        // Update existing group
        await updateDoc(doc(db, 'groups', editingGroup.id), {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          about: formData.about,
          isPublic: formData.isPublic,
          requiresApproval: formData.requiresApproval,
        })
        setMessage({ type: 'success', text: 'Group updated successfully' })
      } else {
        // Create new group
        await addDoc(collection(db, 'groups'), {
          ...formData,
          createdBy: 'admin',
          createdAt: Timestamp.now(),
          memberCount: 1,
          postCount: 0,
          isActive: true,
          bannedMembers: [],
        })
        setMessage({ type: 'success', text: 'Group created successfully' })
      }
      resetForm()
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('[v0] Error saving group:', error)
      setMessage({ type: 'error', text: 'Failed to save group' })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'member_networking',
      about: '',
      isPublic: true,
      requiresApproval: false,
    })
    setEditingGroup(null)
    setShowForm(false)
  }

  const handleEdit = (group: Group) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description,
      type: group.type,
      about: group.about || '',
      isPublic: group.isPublic,
      requiresApproval: group.requiresApproval,
    })
    setShowForm(true)
  }

  const handleToggleActive = async (groupId: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, 'groups', groupId), { isActive: !isActive })
      setMessage({ type: 'success', text: `Group ${!isActive ? 'activated' : 'deactivated'}` })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('[v0] Error toggling group:', error)
      setMessage({ type: 'error', text: 'Failed to update group' })
    }
  }

  const handleDelete = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete "${groupName}"? This action cannot be undone.`)) return
    try {
      await deleteDoc(doc(db, 'groups', groupId))
      setMessage({ type: 'success', text: 'Group deleted successfully' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('[v0] Error deleting group:', error)
      setMessage({ type: 'error', text: 'Failed to delete group' })
    }
  }

  const activeCount = groups.filter((g) => g.isActive).length
  const totalMembers = groups.reduce((sum, g) => sum + g.memberCount, 0)

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Community Groups</h1>
          <p className="text-gray-600 mt-2">Create, edit, and manage community groups</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Create Group
        </Button>
      </div>

      {/* Messages */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Total Groups</p>
          <p className="text-3xl font-bold">{groups.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Active Groups</p>
          <p className="text-3xl font-bold">{activeCount}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Total Members</p>
          <p className="text-3xl font-bold">{totalMembers}</p>
        </Card>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="p-6 mb-8 border-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{editingGroup ? 'Edit Group' : 'Create New Group'}</h2>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Group Name *</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Tech Innovators"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Group Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {GROUP_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of the group..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">About</label>
              <textarea
                value={formData.about}
                onChange={(e) => setFormData({...formData, about: e.target.value})}
                placeholder="Detailed information about the group..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm">Public Group</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requiresApproval}
                  onChange={(e) => setFormData({...formData, requiresApproval: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm">Requires Approval to Join</span>
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit">{editingGroup ? 'Update Group' : 'Create Group'}</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search groups by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Groups List */}
      {!loading ? (
        <div className="space-y-4">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <Card key={group.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg">{group.name}</h3>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {GROUP_TYPES.find(t => t.value === group.type)?.label}
                      </span>
                      {!group.isActive && (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Inactive</span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{group.description}</p>
                    {group.about && (
                      <p className="text-sm text-gray-500 mb-3 italic">{group.about}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {group.memberCount} members
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {group.postCount} posts
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {group.isPublic ? 'Public' : 'Private'}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {group.requiresApproval ? 'Approval Required' : 'Open Join'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(group)}
                      className="gap-1"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleToggleActive(group.id, group.isActive)}
                      className={group.isActive ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}
                    >
                      {group.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(group.id, group.name)}
                      className="bg-red-600 hover:bg-red-700 gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600">{searchTerm ? 'No groups found matching your search' : 'No groups created yet'}</p>
            </Card>
          )}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-gray-600">Loading groups...</p>
        </Card>
      )}
    </div>
  )
}
