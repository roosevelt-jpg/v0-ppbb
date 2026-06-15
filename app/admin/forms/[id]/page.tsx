'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CustomForm } from '@/lib/form-builder-types'
import { getFormById, createForm, updateForm } from '@/lib/form-builder-queries'
import FormBuilder from '@/components/form-builder/FormBuilder'
import { useState as useStateCallback } from 'react'

export default function FormEditorPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params?.id as string
  const isNew = formId === 'new'

  const [form, setForm] = useState<CustomForm | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)

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
      // New form template
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
      })
      setLoading(false)
    }
  }, [isNew, formId, router])

  const handleSave = async (updatedForm: CustomForm) => {
    setIsSaving(true)
    try {
      if (isNew) {
        const newFormId = await createForm({
          ...updatedForm,
          id: '', // Will be generated
          createdAt: new Date(),
          updatedAt: new Date(),
          submissionCount: 0,
        })
        alert('Form created successfully')
        router.push(`/admin/forms/${newFormId}`)
      } else {
        await updateForm(formId, updatedForm)
        alert('Form saved successfully')
        router.push('/admin/forms')
      }
    } catch (error) {
      console.error('[v0] Error saving form:', error)
      alert('Error saving form')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    // This would open a preview modal or navigate to a preview page
    alert('Preview functionality coming soon')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading form...</p>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Error loading form</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{isNew ? 'Create New Form' : 'Edit Form'}</h1>
        <p className="text-gray-600 mt-1">
          {isNew ? 'Create a custom form for your needs' : 'Modify your form fields and structure'}
        </p>
      </div>

      <FormBuilder
        form={form}
        onSave={handleSave}
        onPreview={handlePreview}
        isLoading={isSaving}
      />
    </div>
  )
}
