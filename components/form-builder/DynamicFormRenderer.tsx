'use client'

import React, { useState } from 'react'
import { CustomForm, FormSubmissionValue } from '@/lib/form-builder-types'
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
} from '@/lib/admin-design-system'
import {
  validateAttachmentFile,
  isFieldValueEmpty,
  type FormFileValue,
} from '@/lib/form-builder-utils'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface DynamicFormRendererProps {
  form: CustomForm
  onSubmit?: (responses: FormSubmissionValue) => Promise<void>
  isLoading?: boolean
  previewMode?: boolean
  formSlug?: string
  formId?: string
}

export default function DynamicFormRenderer({
  form,
  onSubmit,
  isLoading = false,
  previewMode = false,
  formSlug,
  formId,
}: DynamicFormRendererProps) {
  const [responses, setResponses] = useState<FormSubmissionValue>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({})

  const handleChange = (fieldId: string, value: unknown) => {
    setResponses((prev) => ({ ...prev, [fieldId]: value }))
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    form.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.required && isFieldValueEmpty(responses[field.id], field)) {
          newErrors[field.id] = `${field.label} is required`
        }

        if (field.type === 'email' && responses[field.id]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(String(responses[field.id]))) {
            newErrors[field.id] = 'Please enter a valid email'
          }
        }

        if (field.type === 'phone' && responses[field.id]) {
          const phoneRegex = /^\+?[\d\s\-()]{7,}$/
          if (!phoneRegex.test(String(responses[field.id]))) {
            newErrors[field.id] = 'Please enter a valid phone number'
          }
        }
      })
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileSelect = async (fieldId: string, file: File | undefined) => {
    if (!file) {
      handleChange(fieldId, null)
      return
    }

    const validationError = validateAttachmentFile(file)
    if (validationError) {
      setErrors((prev) => ({ ...prev, [fieldId]: validationError }))
      return
    }

    if (previewMode) {
      handleChange(fieldId, { url: '', name: file.name, size: file.size, contentType: file.type } satisfies FormFileValue)
      return
    }

    setUploadingFields((prev) => ({ ...prev, [fieldId]: true }))
    try {
      const body = new FormData()
      body.append('file', file)
      if (formId) body.append('formId', formId)
      if (formSlug) body.append('slug', formSlug)

      const res = await fetch('/api/forms/upload', { method: 'POST', body })
      const json = await res.json()
      if (!json.success) {
        setErrors((prev) => ({ ...prev, [fieldId]: json.error || 'Upload failed' }))
        return
      }
      handleChange(fieldId, json.file as FormFileValue)
    } catch {
      setErrors((prev) => ({ ...prev, [fieldId]: 'Upload failed. Please try again.' }))
    } finally {
      setUploadingFields((prev) => ({ ...prev, [fieldId]: false }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (previewMode) return

    if (!validateForm()) return

    try {
      await onSubmit?.(responses)
      setSubmitted(true)
    } catch (error) {
      console.error('[v0] Error submitting form:', error)
      setErrors({ _form: 'Submission failed. Please try again.' })
    }
  }

  if (submitted && !previewMode) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-4">
        <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-4" aria-hidden />
        <h2 className="font-headline text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">Thank you!</h2>
        <p className="font-body text-neutral-600">
          Your response to <strong>{form.title}</strong> has been submitted successfully.
        </p>
      </div>
    )
  }

  const inputClass = (fieldId: string) =>
    `w-full px-4 py-2 border rounded-lg bg-white text-neutral-900 text-base font-body ${
      errors[fieldId] ? 'border-red-500' : 'border-neutral-300'
    } focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent`

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto w-full">
      {form.bannerImageUrl ? (
        <div className="w-full overflow-hidden rounded-lg border border-neutral-200">
          <img
            src={form.bannerImageUrl}
            alt=""
            className="w-full h-40 sm:h-52 md:h-64 object-cover"
          />
        </div>
      ) : null}

      <div>
        <p className="font-body text-xs uppercase tracking-[0.15em] text-neutral-500 mb-2">Form</p>
        <h1 className="font-headline text-2xl sm:text-3xl font-bold text-neutral-900">{form.title}</h1>
        {form.description ? (
          <p className="font-body text-neutral-600 mt-2 text-sm sm:text-base">{form.description}</p>
        ) : null}
        {previewMode ? (
          <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-body">
            Preview mode — submissions are disabled.
          </p>
        ) : null}
      </div>

      {errors._form ? (
        <p className="text-red-600 text-sm font-body bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {errors._form}
        </p>
      ) : null}

      {form.sections.map((section) => (
        <div key={section.id} className="space-y-4 pb-6 border-b border-neutral-200 last:border-b-0">
          {section.title ? (
            <div>
              <h2 className="font-headline text-lg sm:text-xl font-semibold text-neutral-900">{section.title}</h2>
              {section.description ? (
                <p className="font-body text-sm text-neutral-600 mt-1">{section.description}</p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-5">
            {section.fields.map((field) => {
              const error = errors[field.id]
              const uploading = uploadingFields[field.id]
              const fileValue = responses[field.id] as FormFileValue | undefined

              return (
                <div key={field.id}>
                  <label className="block text-sm font-medium font-body text-neutral-800 mb-1">
                    {field.label}
                    {field.required ? <span className="text-red-600 ml-1">*</span> : null}
                  </label>

                  {field.description ? (
                    <p className="text-xs text-neutral-500 font-body mb-2">{field.description}</p>
                  ) : null}

                  {field.type === 'text' && (
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={(responses[field.id] as string) || ''}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className={inputClass(field.id)}
                    />
                  )}

                  {field.type === 'email' && (
                    <input
                      type="email"
                      placeholder={field.placeholder}
                      value={(responses[field.id] as string) || ''}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className={inputClass(field.id)}
                    />
                  )}

                  {field.type === 'phone' && (
                    <input
                      type="tel"
                      placeholder={field.placeholder}
                      value={(responses[field.id] as string) || ''}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className={inputClass(field.id)}
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      placeholder={field.placeholder}
                      value={(responses[field.id] as string) || ''}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className={inputClass(field.id)}
                    />
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      placeholder={field.placeholder}
                      value={(responses[field.id] as string) || ''}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className={`${inputClass(field.id)} min-h-28 resize-y`}
                      rows={4}
                    />
                  )}

                  {field.type === 'select' && (
                    <select
                      value={(responses[field.id] as string) || ''}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className={inputClass(field.id)}
                    >
                      <option value="">Select an option</option>
                      {field.options?.map((opt) => (
                        <option key={opt.id} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'multiselect' && (
                    <select
                      multiple
                      value={Array.isArray(responses[field.id]) ? (responses[field.id] as string[]) : []}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, (o) => o.value)
                        handleChange(field.id, values)
                      }}
                      className={`${inputClass(field.id)} min-h-28`}
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.id} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'checkbox' && (
                    <div className="space-y-2">
                      {field.options?.map((opt) => (
                        <label key={opt.id} className="flex items-center gap-2 font-body text-sm">
                          <input
                            type="checkbox"
                            value={opt.value}
                            checked={
                              Array.isArray(responses[field.id])
                                ? (responses[field.id] as string[]).includes(opt.value)
                                : false
                            }
                            onChange={(e) => {
                              const current = Array.isArray(responses[field.id])
                                ? (responses[field.id] as string[])
                                : []
                              const newValue = e.target.checked
                                ? [...current, opt.value]
                                : current.filter((v) => v !== opt.value)
                              handleChange(field.id, newValue)
                            }}
                            className="w-4 h-4"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === 'radio' && (
                    <div className="space-y-2">
                      {field.options?.map((opt) => (
                        <label key={opt.id} className="flex items-center gap-2 font-body text-sm">
                          <input
                            type="radio"
                            name={field.id}
                            value={opt.value}
                            checked={responses[field.id] === opt.value}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            className="w-4 h-4"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === 'date' && (
                    <input
                      type="date"
                      value={(responses[field.id] as string) || ''}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className={inputClass(field.id)}
                    />
                  )}

                  {field.type === 'file' && (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.txt,.csv,.xlsx"
                        onChange={(e) => void handleFileSelect(field.id, e.target.files?.[0])}
                        className={inputClass(field.id)}
                        disabled={uploading}
                      />
                      <p className="text-xs text-neutral-500 font-body">
                        PDF, JPG, PNG, TXT, CSV, XLSX — max 10MB
                      </p>
                      {uploading ? (
                        <p className="text-xs text-neutral-600 flex items-center gap-1 font-body">
                          <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                        </p>
                      ) : null}
                      {fileValue?.name ? (
                        <p className="text-xs text-green-700 font-body">Attached: {fileValue.name}</p>
                      ) : null}
                    </div>
                  )}

                  {field.type === 'rating' && (
                    <div className="flex flex-nowrap items-center gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => {
                        const selected = Number(responses[field.id]) === rating
                        return (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleChange(field.id, rating)}
                            className={`pb-rating-btn pb-compact-btn inline-flex items-center justify-center h-6 w-6 rounded-full text-[11px] leading-none border-0 shadow-none ${
                              selected
                                ? 'bg-black text-white ring-2 ring-offset-1 ring-black'
                                : 'bg-black text-white opacity-45 hover:opacity-80'
                            }`}
                            aria-label={`Rate ${rating}`}
                            aria-pressed={selected}
                          >
                            ★
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {error ? <p className="text-red-600 text-xs mt-1 font-body">{error}</p> : null}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {!previewMode ? (
        <button
          type="submit"
          disabled={isLoading || Object.values(uploadingFields).some(Boolean)}
          className={`w-full sm:w-auto ${BUTTON_PRIMARY} px-6 py-3 disabled:opacity-50`}
        >
          {isLoading ? 'Submitting…' : 'Submit Form'}
        </button>
      ) : (
        <button type="button" disabled className={`w-full sm:w-auto ${BUTTON_SECONDARY} opacity-60 cursor-not-allowed`}>
          Submit Form (preview)
        </button>
      )}
    </form>
  )
}
