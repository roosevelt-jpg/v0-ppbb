'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FormSubmission, CustomForm } from '@/lib/form-builder-types'
import { getSubmissionById, getFormById, updateSubmissionStatus } from '@/lib/form-builder-queries'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { BUTTON_PRIMARY, BUTTON_DANGER } from '@/lib/admin-design-system'

export default function SubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const submissionId = params?.id as string

  const [submission, setSubmission] = useState<FormSubmission | null>(null)
  const [form, setForm] = useState<CustomForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const submissionData = await getSubmissionById(submissionId)
        setSubmission(submissionData)

        if (submissionData) {
          const formData = await getFormById(submissionData.formId)
          setForm(formData)
          setNotes(submissionData.notes || '')
        }
      } catch (error) {
        console.error('[v0] Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [submissionId])

  const handleStatusUpdate = async (newStatus: 'pending' | 'reviewed' | 'approved' | 'rejected') => {
    if (!submission) return

    setIsUpdating(true)
    try {
      await updateSubmissionStatus(submission.id, newStatus, undefined, notes)
      setSubmission({ ...submission, status: newStatus, notes })
      alert('Status updated successfully')
    } catch (error) {
      console.error('[v0] Error updating status:', error)
      alert('Error updating status')
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading submission...</p>
      </div>
    )
  }

  if (!submission || !form) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Submission not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/forms/${submission.formId}/submissions`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Submission Details</h1>
          <p className="text-gray-600 mt-1">{form.title}</p>
        </div>
      </div>

      {/* Submission Meta */}
      <Card className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-semibold mt-1">{submission.userEmail || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="font-semibold mt-1 capitalize">{submission.status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Submitted</p>
            <p className="font-semibold mt-1">
              {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
          {submission.reviewedAt && (
            <div>
              <p className="text-sm text-gray-600">Reviewed</p>
              <p className="font-semibold mt-1">
                {new Date(submission.reviewedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Form Responses */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Responses</h2>
        <div className="space-y-6">
          {form.sections.map(section => (
            <div key={section.id}>
              {section.title && <h3 className="font-semibold mb-3">{section.title}</h3>}
              <div className="space-y-4 pl-4 border-l-2">
                {section.fields.map(field => {
                  const value = submission.responses[field.id]
                  return (
                    <div key={field.id}>
                      <p className="text-sm text-gray-600">{field.label}</p>
                      <p className="font-medium mt-1">
                        {Array.isArray(value) ? value.join(', ') : value || '(No response)'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Review Notes */}
      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">Review Notes</h2>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add your review notes here..."
          className="w-full p-3 border rounded text-sm"
          rows={4}
        />
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          onClick={() => handleStatusUpdate('pending')}
          disabled={isUpdating}
        >
          Mark as Pending
        </Button>
        <Button
          variant="outline"
          onClick={() => handleStatusUpdate('reviewed')}
          disabled={isUpdating}
        >
          Mark as Reviewed
        </Button>
        <Button
          className={BUTTON_PRIMARY}
          onClick={() => handleStatusUpdate('approved')}
          disabled={isUpdating}
        >
          Approve
        </Button>
        <Button
          className={BUTTON_DANGER}
          onClick={() => handleStatusUpdate('rejected')}
          disabled={isUpdating}
        >
          Reject
        </Button>
      </div>
    </div>
  )
}
