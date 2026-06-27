'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { format } from 'date-fns'
import { Plus, Trash2, Edit2, Eye } from 'lucide-react'

export default function AdminTeamPage() {
  const [members, setMembers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      const res = await fetch('/api/team', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        setMembers(json.data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)))
      }
    } catch (error) {
      console.error('[v0] Error fetching team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      const res = await fetch(`/api/team?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setMembers(members.filter(m => m.id !== id))
      }
    } catch (error) {
      console.error('[v0] Error deleting member:', error)
    }
  }

  const handlePublish = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published'
      const res = await fetch('/api/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      const json = await res.json()
      if (json.success) {
        loadMembers()
      }
    } catch (error) {
      console.error('[v0] Error updating member:', error)
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title="Team Members">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading team members...</p>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title="Team Members">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black">All Team Members</h2>
          <Link
            href="/admin/team/create"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            <Plus size={20} />
            Add Team Member
          </Link>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No team members found. Add your first team member!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {members.map((member: any) => (
              <div key={member.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex gap-6">
                  {member.imageUrl && (
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-black">{member.name}</h3>
                    <p className="text-sm text-gray-600 font-medium">{member.role}</p>
                    <p className="text-sm text-gray-700 mt-2">{member.bio}</p>
                    {member.socialLinks && (
                      <div className="flex gap-3 mt-3 text-sm">
                        {member.socialLinks.email && (
                          <a href={`mailto:${member.socialLinks.email}`} className="text-blue-600 hover:underline">Email</a>
                        )}
                        {member.socialLinks.linkedin && (
                          <a href={member.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>
                        )}
                        {member.socialLinks.twitter && (
                          <a href={member.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Twitter</a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-col">
                    <span className={`px-2 py-1 rounded text-xs font-medium w-fit ${
                      member.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {member.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/team/${member.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </Link>
                      <button
                        onClick={() => handlePublish(member.id, member.status)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Toggle Publish"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
