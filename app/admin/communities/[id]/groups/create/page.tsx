'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { uploadImageToFirebase } from '@/lib/upload-utils'
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

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out. Please try again.`)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export default function CreateGroupPage() {
  const params = useParams()
  const router = useRouter()
  const { user, firebaseUser } = useAuth()
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
    if (!firebaseUser && !user?.id) {
      setError('You must be signed in as an admin to create a group.')
      return
    }

    setLoading(true)
    setError('')

    try {
      let iconURL = ''
      if (icon) {
        try {
          iconURL = await withTimeout(
            uploadImageToFirebase(icon, `communities/${communityId}/groups`, {
              preset: 'logo',
              maxDimension: 512,
            }),
            45000,
            'Icon upload'
          )
        } catch (uploadErr) {
          console.error('[v0] Group icon upload failed:', uploadErr)
          setError(
            uploadErr instanceof Error
              ? `${uploadErr.message} (You can create the group without an icon.)`
              : 'Icon upload failed. You can create the group without an icon.'
          )
          setLoading(false)
          return
        }
      }

      const json = await withTimeout(
        adminApiFetch<{ id: string }>('/api/groups', {
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
            createdBy: firebaseUser?.uid || user?.id,
          }),
        }),
        30000,
        'Create group'
      )

      if (json.success) {
        router.push(`/admin/communities/${communityId}/groups`)
        return
      }

      setError(json.error || 'Failed to create group')
    } catch (err) {
      console.error('[v0] Error creating group:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while creating the group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminPageLayout title="Create Group" subtitle="Add a group with chat, members, and join rules">
      <div className="max-w-2xl space-y-6">
        <Link
          href={`/admin/communities/${communityId}/groups`}
          className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground hover:text-gray-900"
        >
          <ChevronLeft size={20} />
          Back to Groups
        </Link>

        <div>
          <h2 className="text-2xl font-bold text-black dark:text-foreground">Create New Group</h2>
          <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
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
