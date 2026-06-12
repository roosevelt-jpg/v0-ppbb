'use client'

import React, { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore'
import { Plus, Edit, Trash2, Upload } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { Button } from '@/components/ui/button'

interface TeamMember {
  id?: string
  name: string
  role: string
  bio: string
  image?: string
  email?: string
  social?: {
    linkedin?: string
    twitter?: string
    instagram?: string
    website?: string
  }
  order: number
  isPublished: boolean
}

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<TeamMember>({
    name: '',
    role: '',
    bio: '',
    order: 0,
    isPublished: true,
    social: {}
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const teamQuery = query(
      collection(db, 'team'),
      orderBy('order', 'asc')
    )

    const unsubscribe = onSnapshot(teamQuery, (snapshot) => {
      const membersList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as TeamMember[]
      setMembers(membersList)
      setLoading(false)
    }, (error) => {
      console.error('[v0] Error fetching team members:', error)
      // Set loading to false on error so page doesn't hang
      setLoading(false)
    })

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('[v0] Team members loading timeout')
        setLoading(false)
      }
    }, 5000)

    return () => {
      unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return

    setUploading(true)
    const file = e.target.files[0]
    const storageRef = ref(storage, `team/${Date.now()}_${file.name}`)

    try {
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setFormData((prev) => ({ ...prev, image: url }))
    } catch (error) {
      console.error('[v0] Error uploading image:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        await updateDoc(doc(db, 'team', editingId), {
          ...formData,
          updatedAt: new Date(),
        })
      } else {
        await addDoc(collection(db, 'team'), {
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      setFormData({
        name: '',
        role: '',
        bio: '',
        order: members.length,
        isPublished: true,
        social: {}
      })
      setEditingId(null)
    } catch (error) {
      console.error('[v0] Error saving team member:', error)
    }
  }

  const handleEdit = (member: TeamMember) => {
    setFormData(member)
    setEditingId(member.id || null)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this team member?')) {
      try {
        await deleteDoc(doc(db, 'team', id))
      } catch (error) {
        console.error('[v0] Error deleting team member:', error)
      }
    }
  }

  if (loading) {
    return <div className="p-8">Loading team members...</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Manage Team Members</h1>

      {/* Form */}
      <div className="bg-white border border-[#e4e1da] rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6">
          {editingId ? 'Edit Team Member' : 'Add New Team Member'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-[#e4e1da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
                placeholder="Team member name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Role *</label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-[#e4e1da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
                placeholder="e.g. Founder, Director"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Bio *</label>
            <textarea
              required
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2 border border-[#e4e1da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
              placeholder="Brief biography"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-[#e4e1da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-[#e4e1da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">LinkedIn URL</label>
              <input
                type="url"
                value={formData.social?.linkedin || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  social: { ...formData.social, linkedin: e.target.value }
                })}
                className="w-full px-4 py-2 border border-[#e4e1da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Twitter URL</label>
              <input
                type="url"
                value={formData.social?.twitter || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  social: { ...formData.social, twitter: e.target.value }
                })}
                className="w-full px-4 py-2 border border-[#e4e1da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
                placeholder="https://twitter.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Instagram URL</label>
              <input
                type="url"
                value={formData.social?.instagram || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  social: { ...formData.social, instagram: e.target.value }
                })}
                className="w-full px-4 py-2 border border-[#e4e1da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
                placeholder="https://instagram.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Website</label>
              <input
                type="url"
                value={formData.social?.website || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  social: { ...formData.social, website: e.target.value }
                })}
                className="w-full px-4 py-2 border border-[#e4e1da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Profile Image</label>
            <div className="flex items-center gap-4">
              {formData.image && (
                <img src={formData.image} alt={formData.name} className="h-20 w-20 rounded-lg object-cover" />
              )}
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#111111] text-white rounded-lg hover:bg-[#333333]">
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading...' : 'Upload Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-semibold">Publish on website</span>
            </label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="bg-[#111111] hover:bg-[#333333] text-white">
              {editingId ? 'Update Team Member' : 'Add Team Member'}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null)
                  setFormData({
                    name: '',
                    role: '',
                    bio: '',
                    order: members.length,
                    isPublished: true,
                    social: {}
                  })
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Team Members List */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Team Members ({members.length})</h2>

        {members.length === 0 ? (
          <div className="text-center py-12 bg-[#f7f6f2] rounded-lg">
            <p className="text-[#888888]">No team members yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {members.map((member) => (
              <div key={member.id} className="bg-white border border-[#e4e1da] rounded-lg p-6 flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {member.image && (
                    <img src={member.image} alt={member.name} className="h-24 w-24 rounded-lg object-cover" />
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-[#111111]">{member.name}</h3>
                    <p className="text-sm font-semibold text-[#b8860b] mb-1">{member.role}</p>
                    <p className="text-sm text-[#333333] mb-2 line-clamp-2">{member.bio}</p>
                    <div className="flex gap-2 text-xs">
                      {!member.isPublished && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Not Published</span>
                      )}
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">Order: {member.order}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(member)}
                    className="p-2 text-[#111111] hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id || '')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
