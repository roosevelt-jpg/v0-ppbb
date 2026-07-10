'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { uploadGroupIcon } from '@/lib/firebase-storage'
import { useAuth } from '@/lib/auth-context'
import { adminApiFetch } from '@/lib/admin-api-client'
import { AdminGroupForm, type AdminGroupFormValues } from '@/components/admin/admin-group-form'

const defaultValues: AdminGroupFormValues = {
  name: '',
  description: '',
  type: 'discussion',
  genderRestriction: 'mixed',
  requiresApproval: false,
  capacity: '',
}

export default function CreateGroupPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const communityId = params.id as string

  const [formData, setFormData] = React.useState<AdminGroupFormValues>(defaultValues)
  const [icon, setIcon] = React.useState<File | null>(null)
  const [iconPreview, setIconPreview] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Group name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      let iconURL = ''
      if (icon) {
        iconURL = await uploadGroupIcon(communityId, `new_${Date.now()}`, icon)
      }

      const json = await adminApiFetch<{ id: string }>('/api/groups', {
        method: 'POST',
        body: JSON.stringify({
          communityId,
          name: formData.name.trim(),
          description: formData.description,
          type: formData.type,
          genderRestriction: formData.genderRestriction,
          iconURL,
          requiresApproval: formData.requiresApproval,
          capacity: formData.capacity ? Number(formData.capacity) : null,
          createdBy: user?.id,
        }),
      })

      if (json.success) {
        router.push(`/admin/communities/${communityId}/groups`)
      } else {
        setError(json.error || 'Failed to create group')
      }
    } catch (err) {
      console.error('[v0] Error creating group:', err)
      setError('An error occurred while creating the group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminPageLayout title="Create Group" subtitle="Add a group with chat, members, and join rules">
      <div className="max-w-2xl space-y-6">
        <Link
          href={`/admin/communities/${communityId}/groups`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft size={20} />
          Back to Groups
        </Link>

        <div>
          <h2 className="text-2xl font-bold text-black">Create New Group</h2>
          <p className="text-sm text-gray-600 mt-1">
            Groups support member chat, file sharing, join approval, gender rules, and capacity limits.
          </p>
        </div>

        <AdminGroupForm
          communityId={communityId}
          values={formData}
          onChange={setFormData}
          iconPreview={iconPreview}
          onIconChange={(file, preview) => {
            setIcon(file)
            setIconPreview(preview)
          }}
          loading={loading}
          error={error}
          submitLabel="Create Group"
          onSubmit={handleSubmit}
          cancelHref={`/admin/communities/${communityId}/groups`}
        />
      </div>
    </AdminPageLayout>
  )
}
