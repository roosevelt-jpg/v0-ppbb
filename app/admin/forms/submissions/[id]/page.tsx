'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FormSubmission, CustomForm } from '@/lib/form-builder-types'
import { getSubmissionById, getFormById } from '@/lib/form-builder-queries'
import { Card } from '@/components/ui/card'
import { ChevronLeft, Check, X, BookOpenCheck, RotateCcw } from 'lucide-react'
import { BUTTON_PRIMARY, BUTTON_OUTLINE, BUTTON_SECONDARY } from '@/lib/admin-design-system'
import {
  formatFieldDisplayValue,
  isFileFieldValue,
} from '@/lib/form-builder-utils'
import { adminApiFetch } from '@/lib/admin-api-client'

type SubmissionStatus = FormSubmission['status']

export default function SubmissionDetailPage() {
  const params = useParams()
  const submissionId = params?.id as string

  const [submission, setSubmission] = useState<FormSubmission | null>(null)
  const [form, setForm] = useState<CustomForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

    void loadData()
  }, [submissionId])

  const handleStatusUpdate = async (newStatus: SubmissionStatus) => {
    if (!submission) return

    setIsUpdating(true)
    setMessage(null)
    try {
      const res = await adminApiFetch('/api/admin/form-submissions', {
        method: 'PATCH',
        body: JSON.stringify({
          id: submission.id,
          status: newStatus,
          notes,
        }),
      })
      if (!res.success) {
        setMessage({ type: 'error', text: res.error || 'Error updating status' })
        return
      }
      setSubmission({ ...submission, status: newStatus, notes, reviewedAt: new Date() })
      setMessage({ type: 'success', text: `Marked as ${newStatus}` })
    } catch (error) {
      console.error('[v0] Error updating status:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error updating status',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-neutral-600 dark:text-muted-foreground">Loading submission...</p>
      </div>
    )
  }

  if (!submission || !form) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-red-600">Submission not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/forms/${submission.formId}/submissions`}
          className={`${BUTTON_SECONDARY} inline-flex items-center gap-2`}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">Submission Details</h1>
          <p className="text-neutral-600 dark:text-muted-foreground mt-1 truncate">{form.title}</p>
        </div>
      </div>

      {message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-neutral-300 dark:border-border bg-neutral-50 dark:bg-muted text-neutral-900 dark:text-foreground'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-neutral-600 dark:text-muted-foreground">Email</p>
            <p className="font-semibold mt-1 break-all">{submission.userEmail || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-muted-foreground">Status</p>
            <p className="font-semibold mt-1 capitalize">{submission.status}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-muted-foreground">Submitted</p>
            <p className="font-semibold mt-1">
              {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
          {submission.reviewedAt ? (
            <div>
              <p className="text-sm text-neutral-600 dark:text-muted-foreground">Reviewed</p>
              <p className="font-semibold mt-1">
                {new Date(submission.reviewedAt).toLocaleString()}
              </p>
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Responses</h2>
        <div className="space-y-6">
          {form.sections.map((section) => (
            <div key={section.id}>
              {section.title ? <h3 className="font-semibold mb-3">{section.title}</h3> : null}
              <div className="space-y-4 pl-4 border-l-2 border-neutral-200 dark:border-border">
                {section.fields.map((field) => {
                  const value = submission.responses[field.id]
                  return (
                    <div key={field.id}>
                      <p className="text-sm text-neutral-600 dark:text-muted-foreground">{field.label}</p>
                      {field.type === 'file' && isFileFieldValue(value) ? (
                        <a
                          href={value.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium mt-1 text-black dark:text-foreground underline break-all"
                        >
                          {value.name || 'Download attachment'}
                        </a>
                      ) : (
                        <p className="font-medium mt-1 break-words">
                          {formatFieldDisplayValue(value, field.type)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">Review Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add your review notes here..."
          className="w-full p-3 border border-neutral-300 dark:border-border rounded text-sm"
          rows={4}
        />
        <p className="text-xs text-neutral-500 dark:text-muted-foreground mt-2">Notes are saved when you change status.</p>
      </Card>

      <div className="flex flex-wrap gap-2 justify-end">
        <button
          type="button"
          onClick={() => void handleStatusUpdate('pending')}
          disabled={isUpdating || submission.status === 'pending'}
          className={`${BUTTON_OUTLINE} gap-1 disabled:opacity-50`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Pending
        </button>
        <button
          type="button"
          onClick={() => void handleStatusUpdate('reviewed')}
          disabled={isUpdating || submission.status === 'reviewed'}
          className={`${BUTTON_OUTLINE} gap-1 disabled:opacity-50`}
        >
          <BookOpenCheck className="h-3.5 w-3.5" />
          Reviewed
        </button>
        <button
          type="button"
          onClick={() => void handleStatusUpdate('approved')}
          disabled={isUpdating || submission.status === 'approved'}
          className={`${BUTTON_PRIMARY} gap-1 disabled:opacity-50`}
        >
          <Check className="h-3.5 w-3.5" />
          Approve
        </button>
        <button
          type="button"
          onClick={() => void handleStatusUpdate('rejected')}
          disabled={isUpdating || submission.status === 'rejected'}
          className={`${BUTTON_OUTLINE} gap-1 disabled:opacity-50`}
        >
          <X className="h-3.5 w-3.5" />
          Reject
        </button>
      </div>
    </div>
  )
}
