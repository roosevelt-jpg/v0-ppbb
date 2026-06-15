'use client'

import React, { useState } from 'react'
import { CustomForm, FormSubmissionValue } from '@/lib/form-builder-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DynamicFormRendererProps {
  form: CustomForm
  onSubmit: (responses: FormSubmissionValue) => Promise<void>
  isLoading?: boolean
}

export default function DynamicFormRenderer({
  form,
  onSubmit,
  isLoading = false,
}: DynamicFormRendererProps) {
  const [responses, setResponses] = useState<FormSubmissionValue>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value,
    }))
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    form.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.required && (!responses[field.id] || responses[field.id] === '')) {
          newErrors[field.id] = `${field.label} is required`
        }

        if (field.type === 'email' && responses[field.id]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(responses[field.id])) {
            newErrors[field.id] = 'Please enter a valid email'
          }
        }

        if (field.type === 'phone' && responses[field.id]) {
          const phoneRegex = /^\+?[\d\s\-()]{7,}$/
          if (!phoneRegex.test(responses[field.id])) {
            newErrors[field.id] = 'Please enter a valid phone number'
          }
        }
      })
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(responses)
    } catch (error) {
      console.error('[v0] Error submitting form:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* Form Title */}
      <div>
        <h1 className="text-2xl font-bold">{form.title}</h1>
        {form.description && (
          <p className="text-gray-600 mt-2">{form.description}</p>
        )}
      </div>

      {/* Sections */}
      {form.sections.map((section, sectionIdx) => (
        <div key={section.id} className="space-y-4 pb-6 border-b last:border-b-0">
          {/* Section Title */}
          {section.title && (
            <div>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              {section.description && (
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
              )}
            </div>
          )}

          {/* Fields */}
          <div className="space-y-4">
            {section.fields.map(field => {
              const error = errors[field.id]

              return (
                <div key={field.id}>
                  <label className="block text-sm font-medium mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.description && (
                    <p className="text-xs text-gray-600 mb-2">{field.description}</p>
                  )}

                  {/* Text Input */}
                  {field.type === 'text' && (
                    <Input
                      type="text"
                      placeholder={field.placeholder}
                      value={responses[field.id] || ''}
                      onChange={e => handleChange(field.id, e.target.value)}
                      className={error ? 'border-red-500' : ''}
                    />
                  )}

                  {/* Email Input */}
                  {field.type === 'email' && (
                    <Input
                      type="email"
                      placeholder={field.placeholder}
                      value={responses[field.id] || ''}
                      onChange={e => handleChange(field.id, e.target.value)}
                      className={error ? 'border-red-500' : ''}
                    />
                  )}

                  {/* Phone Input */}
                  {field.type === 'phone' && (
                    <Input
                      type="tel"
                      placeholder={field.placeholder}
                      value={responses[field.id] || ''}
                      onChange={e => handleChange(field.id, e.target.value)}
                      className={error ? 'border-red-500' : ''}
                    />
                  )}

                  {/* Number Input */}
                  {field.type === 'number' && (
                    <Input
                      type="number"
                      placeholder={field.placeholder}
                      value={responses[field.id] || ''}
                      onChange={e => handleChange(field.id, e.target.value)}
                      className={error ? 'border-red-500' : ''}
                    />
                  )}

                  {/* Textarea */}
                  {field.type === 'textarea' && (
                    <textarea
                      placeholder={field.placeholder}
                      value={responses[field.id] || ''}
                      onChange={e => handleChange(field.id, e.target.value)}
                      className={`w-full p-2 border rounded text-sm ${error ? 'border-red-500' : ''}`}
                      rows={4}
                    />
                  )}

                  {/* Select */}
                  {field.type === 'select' && (
                    <select
                      value={responses[field.id] || ''}
                      onChange={e => handleChange(field.id, e.target.value)}
                      className={`w-full p-2 border rounded text-sm ${error ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select an option</option>
                      {field.options?.map(opt => (
                        <option key={opt.id} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Multi-Select */}
                  {field.type === 'multiselect' && (
                    <select
                      multiple
                      value={Array.isArray(responses[field.id]) ? responses[field.id] : []}
                      onChange={e => {
                        const values = Array.from(e.target.selectedOptions, option => option.value)
                        handleChange(field.id, values)
                      }}
                      className={`w-full p-2 border rounded text-sm ${error ? 'border-red-500' : ''}`}
                    >
                      {field.options?.map(opt => (
                        <option key={opt.id} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Checkbox */}
                  {field.type === 'checkbox' && (
                    <div className="space-y-2">
                      {field.options?.map(opt => (
                        <label key={opt.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            value={opt.value}
                            checked={
                              Array.isArray(responses[field.id])
                                ? responses[field.id].includes(opt.value)
                                : false
                            }
                            onChange={e => {
                              const current = Array.isArray(responses[field.id])
                                ? responses[field.id]
                                : []
                              const newValue = e.target.checked
                                ? [...current, opt.value]
                                : current.filter(v => v !== opt.value)
                              handleChange(field.id, newValue)
                            }}
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Radio */}
                  {field.type === 'radio' && (
                    <div className="space-y-2">
                      {field.options?.map(opt => (
                        <label key={opt.id} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={field.id}
                            value={opt.value}
                            checked={responses[field.id] === opt.value}
                            onChange={e => handleChange(field.id, e.target.value)}
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Date Input */}
                  {field.type === 'date' && (
                    <Input
                      type="date"
                      value={responses[field.id] || ''}
                      onChange={e => handleChange(field.id, e.target.value)}
                      className={error ? 'border-red-500' : ''}
                    />
                  )}

                  {/* File Input */}
                  {field.type === 'file' && (
                    <Input
                      type="file"
                      onChange={e => handleChange(field.id, e.target.files?.[0])}
                      className={error ? 'border-red-500' : ''}
                    />
                  )}

                  {/* Rating */}
                  {field.type === 'rating' && (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => handleChange(field.id, rating)}
                          className={`text-2xl ${
                            responses[field.id] === rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Error Message */}
                  {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Submit Button */}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Submitting...' : 'Submit Form'}
      </Button>
    </form>
  )
}
