'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { uploadGroupIcon } from '@/lib/firebase-storage'
import { adminApiFetch } from '@/lib/admin-api-client'
import { AdminGroupForm, type AdminGroupFormValues } from '@/components/admin/admin-group-form'
import type { GroupType } from '@/lib/community-types'

export default function EditGroupPage() {
  const params = useParams()
  const router = useRouter()
  const communityId = params.id as string
  const groupId = params.groupId as string

  const [formData, setFormData] = React.useState<AdminGroupFormValues | null>(null)
  const [existingIconURL, setExistingIconURL] = React.useState('')
  const [icon, setIcon] = React.useState<File | null>(null)
  const [iconPreview, setIconPreview] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [pageLoading, setPageLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    void (async () => {
      try {
        const json = await adminApiFetch<Record<string, unknown>>(
          `/api/groups/${groupId}?communityId=${communityId}`
        )
        if (!json.success || !json.data) {
          setError(json.error || 'Group not found')
          return
        }
        const g = json.data
        setFormData({
          name: String(g.name || ''),
          description: String(g.description || ''),
          type: (String(g.type || 'discussion') as GroupType),
          genderRestriction: String(g.genderRestriction || 'mixed'),
          requiresApproval: g.requiresApproval === true,
          capacity: typeof g.capacity === 'number' ? String(g.capacity) : '',
        })
        const iconURL = String(g.iconURL || '')
        setExistingIconURL(iconURL)
        setIconPreview(iconURL)
      } catch {
        setError('Failed to load group')
      } finally {
        setPageLoading(false)
      }
    })()
  }, [communityId, groupId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData?.name.trim()) {
      setError('Group name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      let iconURL = existingIconURL
      if (icon) {
        iconURL = await uploadGroupIcon(communityId, groupId, icon)
      }

      const json = await adminApiFetch(`/api/groups/${groupId}?communityId=${communityId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description,
          type: formData.type,
          genderRestriction: formData.genderRestriction,
          iconURL,
          requiresApproval: formData.requiresApproval,
          capacity: formData.capacity ? Number(formData.capacity) : null,
        }),
      })

      if (json.success) {
        router.push(`/admin/communities/${communityId}/groups`)
      } else {
        setError(json.error || 'Failed to update group')
      }
    } catch (err) {
      console.error('[v0] Error updating group:', err)
      setError('An error occurred while updating the group')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <AdminPageLayout title="Edit Group">
        <div className="py-12 text-center text-gray-500 dark:text-muted-foreground">Loading group…</div>
      </AdminPageLayout>
    )
  }

  if (!formData) {
    return (
      <AdminPageLayout title="Edit Group">
        <div className="py-12 text-center">
          <p className="text-red-600 mb-4">{error || 'Group not found'}</p>
          <Link href={`/admin/communities/${communityId}/groups`} className="text-black dark:text-foreground underline">
            Back to groups
          </Link>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title="Edit Group" subtitle="Update group settings and join rules">
      <div className="max-w-2xl space-y-6">
        <Link
          href={`/admin/communities/${communityId}/groups`}
          className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground hover:text-gray-900"
        >
          <ChevronLeft size={20} />
          Back to Groups
        </Link>

        <h2 className="text-2xl font-bold text-black dark:text-foreground">Edit Group</h2>

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
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
          cancelHref={`/admin/communities/${communityId}/groups`}
        />
      </div>
    </AdminPageLayout>
  )
}
