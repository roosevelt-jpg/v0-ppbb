'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CustomForm } from '@/lib/form-builder-types'
import { getFormById, createForm, updateForm } from '@/lib/form-builder-queries'
import FormBuilder from '@/components/form-builder/FormBuilder'
import { FormPreviewModal } from '@/components/form-builder/FormPreviewModal'
import { AdminPageLayout } from '@/components/admin-page-layout'

function FormEditorSkeleton() {
  return (
    <div className="max-w-4xl space-y-6 animate-pulse">
      <div className="h-8 bg-neutral-200 rounded w-1/3" />
      <div className="h-40 bg-neutral-200 rounded" />
      <div className="h-64 bg-neutral-200 rounded" />
    </div>
  )
}

export default function FormEditorPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params?.id as string
  const isNew = formId === 'new'

  const [form, setForm] = useState<CustomForm | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [previewForm, setPreviewForm] = useState<CustomForm | null>(null)

  useEffect(() => {
    if (!isNew) {
      const loadForm = async () => {
        try {
          const loadedForm = await getFormById(formId)
          if (loadedForm) {
            setForm(loadedForm)
          } else {
            alert('Form not found')
            router.push('/admin/forms')
          }
        } catch (error) {
          console.error('[v0] Error loading form:', error)
          alert('Error loading form')
          router.push('/admin/forms')
        } finally {
          setLoading(false)
        }
      }
      loadForm()
    } else {
      setForm({
        id: '',
        title: 'New Form',
        description: '',
        category: 'other',
        sections: [
          {
            id: 'section-1',
            title: 'Section 1',
            fields: [],
            order: 1,
          },
        ],
        status: 'active',
        createdBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        submissionCount: 0,
        bannerImageUrl: '',
        slug: '',
      })
      setLoading(false)
    }
  }, [isNew, formId, router])

  const handleSave = async (updatedForm: CustomForm) => {
    setIsSaving(true)
    try {
      if (isNew) {
        const newFormId = await createForm({
          title: updatedForm.title,
          description: updatedForm.description,
          category: updatedForm.category,
          sections: updatedForm.sections,
          status: updatedForm.status,
          createdBy: updatedForm.createdBy,
          bannerImageUrl: updatedForm.bannerImageUrl || '',
          slug: updatedForm.slug,
        })
        router.push(`/admin/forms/${newFormId}`)
      } else {
        await updateForm(formId, updatedForm)
        setForm({ ...updatedForm, id: formId })
        alert('Form saved successfully')
      }
    } catch (error) {
      console.error('[v0] Error saving form:', error)
      alert('Error saving form')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title="Form Builder" subtitle="Loading…">
        <FormEditorSkeleton />
      </AdminPageLayout>
    )
  }

  if (!form) {
    return (
      <AdminPageLayout title="Form Builder" subtitle="Error">
        <p className="text-red-600 font-body">Error loading form</p>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout
      title={isNew ? 'Create New Form' : 'Edit Form'}
      subtitle={isNew ? 'Build a custom form for any purpose' : form.title}
    >
      <div className="max-w-4xl w-full">
        <FormBuilder
          form={form}
          onSave={handleSave}
          onPreview={setPreviewForm}
          isLoading={isSaving}
        />
      </div>

      {previewForm ? (
        <FormPreviewModal form={previewForm} onClose={() => setPreviewForm(null)} />
      ) : null}
    </AdminPageLayout>
  )
}
