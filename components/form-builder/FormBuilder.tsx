'use client'

import React, { useState } from 'react'
import { CustomForm, FormSection, FormField, FormFieldType } from '@/lib/form-builder-types'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  ImageIcon,
} from 'lucide-react'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_ICON_DANGER } from '@/lib/admin-design-system'

const FIELD_TYPES: { type: FormFieldType; label: string; icon: string }[] = [
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'email', label: 'Email', icon: '@' },
  { type: 'phone', label: 'Phone', icon: '📱' },
  { type: 'number', label: 'Number', icon: '#' },
  { type: 'textarea', label: 'Long Text', icon: '📝' },
  { type: 'select', label: 'Dropdown', icon: '▼' },
  { type: 'multiselect', label: 'Multi-Select', icon: '☑' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑' },
  { type: 'radio', label: 'Radio', icon: '◉' },
  { type: 'date', label: 'Date', icon: '📅' },
  { type: 'file', label: 'File Upload', icon: '📎' },
  { type: 'rating', label: 'Rating', icon: '⭐' },
]

interface FormBuilderProps {
  form: CustomForm
  onSave: (form: CustomForm) => void
  onPreview?: (form: CustomForm) => void
  isLoading?: boolean
}

export default function FormBuilder({
  form,
  onSave,
  onPreview,
  isLoading = false,
}: FormBuilderProps) {
  const [currentForm, setCurrentForm] = useState(form)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(currentForm.sections.map(s => s.id))
  )
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [bannerUploading, setBannerUploading] = useState(false)

  const uploadBanner = async (file: File) => {
    setBannerUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('folder', 'forms/banners')
      const res = await fetch('/api/upload', { method: 'POST', body })
      const json = await res.json()
      if (json.success && json.url) {
        setCurrentForm({ ...currentForm, bannerImageUrl: json.url })
      } else {
        alert(json.error || 'Banner upload failed')
      }
    } catch {
      alert('Banner upload failed')
    } finally {
      setBannerUploading(false)
    }
  }

  const addSection = () => {
    const newSection: FormSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      fields: [],
      order: currentForm.sections.length + 1,
    }
    setCurrentForm({
      ...currentForm,
      sections: [...currentForm.sections, newSection],
    })
  }

  const addFieldToSection = (sectionId: string, fieldType: FormFieldType) => {
    const needsOptions =
      fieldType === 'select' ||
      fieldType === 'multiselect' ||
      fieldType === 'radio' ||
      fieldType === 'checkbox'
    const updatedSections = currentForm.sections.map(section => {
      if (section.id === sectionId) {
        const newField: FormField = {
          id: `field-${Date.now()}`,
          type: fieldType,
          label: 'New Field',
          required: false,
          order: section.fields.length + 1,
          ...(needsOptions
            ? {
                options: [
                  { id: `opt-${Date.now()}-1`, label: 'Option 1', value: 'option-1' },
                  { id: `opt-${Date.now()}-2`, label: 'Option 2', value: 'option-2' },
                ],
              }
            : {}),
        }
        return {
          ...section,
          fields: [...section.fields, newField],
        }
      }
      return section
    })
    setCurrentForm({ ...currentForm, sections: updatedSections })
  }

  const updateField = (sectionId: string, fieldId: string, updates: Partial<FormField>) => {
    const updatedSections = currentForm.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          fields: section.fields.map(field =>
            field.id === fieldId ? { ...field, ...updates } : field
          ),
        }
      }
      return section
    })
    setCurrentForm({ ...currentForm, sections: updatedSections })
  }

  const addOption = (sectionId: string, fieldId: string) => {
    const section = currentForm.sections.find((s) => s.id === sectionId)
    const field = section?.fields.find((f) => f.id === fieldId)
    if (!field) return
    const n = (field.options?.length || 0) + 1
    const id = `opt-${Date.now()}-${n}`
    updateField(sectionId, fieldId, {
      options: [
        ...(field.options || []),
        { id, label: `Option ${n}`, value: `option-${n}` },
      ],
    })
  }

  const updateOption = (
    sectionId: string,
    fieldId: string,
    optionId: string,
    label: string
  ) => {
    const section = currentForm.sections.find((s) => s.id === sectionId)
    const field = section?.fields.find((f) => f.id === fieldId)
    if (!field) return
    const value = label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || optionId
    updateField(sectionId, fieldId, {
      options: (field.options || []).map((opt) =>
        opt.id === optionId ? { ...opt, label, value } : opt
      ),
    })
  }

  const removeOption = (sectionId: string, fieldId: string, optionId: string) => {
    const section = currentForm.sections.find((s) => s.id === sectionId)
    const field = section?.fields.find((f) => f.id === fieldId)
    if (!field) return
    updateField(sectionId, fieldId, {
      options: (field.options || []).filter((opt) => opt.id !== optionId),
    })
  }

  const deleteField = (sectionId: string, fieldId: string) => {
    const updatedSections = currentForm.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          fields: section.fields.filter(f => f.id !== fieldId),
        }
      }
      return section
    })
    setCurrentForm({ ...currentForm, sections: updatedSections })
  }

  const deleteSection = (sectionId: string) => {
    setCurrentForm({
      ...currentForm,
      sections: currentForm.sections.filter(s => s.id !== sectionId),
    })
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-neutral-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold font-body mb-2">Banner Image (optional)</label>
            {currentForm.bannerImageUrl ? (
              <div className="relative mb-3 max-w-lg">
                <img
                  src={currentForm.bannerImageUrl}
                  alt="Form banner"
                  className="w-full h-32 sm:h-40 object-cover rounded-lg border border-neutral-200"
                />
                <button
                  type="button"
                  onClick={() => setCurrentForm({ ...currentForm, bannerImageUrl: '' })}
                  className="absolute top-2 right-2 text-xs bg-white border border-black rounded px-2 py-1 font-body"
                >
                  Remove
                </button>
              </div>
            ) : null}
            <label className={`inline-flex items-center gap-2 cursor-pointer ${BUTTON_SECONDARY} text-sm`}>
              {bannerUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              {bannerUploading ? 'Uploading…' : 'Upload banner'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={bannerUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void uploadBanner(file)
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold font-body mb-2">Form Title</label>
              <Input
                value={currentForm.title}
                onChange={(e) => setCurrentForm({ ...currentForm, title: e.target.value })}
                className="max-w-lg"
                placeholder="Enter form title"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold font-body mb-2">Status</label>
              <select
                value={currentForm.status}
                onChange={(e) =>
                  setCurrentForm({
                    ...currentForm,
                    status: e.target.value as CustomForm['status'],
                  })
                }
                className="w-full max-w-lg px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900 font-body"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold font-body mb-2">Description</label>
            <textarea
              value={currentForm.description}
              onChange={(e) => setCurrentForm({ ...currentForm, description: e.target.value })}
              className="w-full max-w-2xl p-3 border border-neutral-300 rounded-lg text-sm font-body"
              rows={3}
              placeholder="Enter form description"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {currentForm.sections.map(section => (
          <Card key={section.id} className="overflow-hidden">
            {/* Section Header */}
            <div className="bg-gray-50 p-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-100">
              <div
                className="flex-1"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                  <div>
                    <h3 className="font-semibold text-sm">{section.title}</h3>
                    {section.description && (
                      <p className="text-xs text-gray-600">{section.description}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => deleteSection(section.id)}
                  className={BUTTON_ICON_DANGER}
                  title="Delete section"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Section Content */}
            {expandedSections.has(section.id) && (
              <div className="p-4 space-y-4">
                {/* Section Settings */}
                <div className="bg-blue-50 p-3 rounded space-y-2">
                  <Input
                    value={section.title}
                    onChange={e => {
                      const updatedSections = currentForm.sections.map(s =>
                        s.id === section.id ? { ...s, title: e.target.value } : s
                      )
                      setCurrentForm({ ...currentForm, sections: updatedSections })
                    }}
                    placeholder="Section title"
                    className="text-sm"
                  />
                  <textarea
                    value={section.description || ''}
                    onChange={e => {
                      const updatedSections = currentForm.sections.map(s =>
                        s.id === section.id ? { ...s, description: e.target.value } : s
                      )
                      setCurrentForm({ ...currentForm, sections: updatedSections })
                    }}
                    placeholder="Section description (optional)"
                    className="w-full p-2 border rounded text-xs"
                    rows={2}
                  />
                </div>

                {/* Fields in Section */}
                <div className="space-y-3">
                  {section.fields.map(field => (
                    <div
                      key={field.id}
                      className={`p-3 border rounded ${
                        selectedField === field.id ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                      onClick={() => setSelectedField(field.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Input
                            value={field.label}
                            onChange={e =>
                              updateField(section.id, field.id, { label: e.target.value })
                            }
                            placeholder="Field label"
                            className="text-sm font-semibold mb-2"
                          />
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="px-2 py-1 bg-gray-200 rounded">
                              {field.type}
                            </span>
                            {field.required && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => deleteField(section.id, field.id)}
                            className={BUTTON_ICON_DANGER}
                            title="Delete field"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Field Options — editable for dropdown / multi / radio / checkbox */}
                      {(field.type === 'select' ||
                        field.type === 'multiselect' ||
                        field.type === 'radio' ||
                        field.type === 'checkbox') && (
                        <div className="mt-3 pt-3 border-t space-y-2" onClick={(e) => e.stopPropagation()}>
                          <p className="text-xs font-semibold text-neutral-700">
                            Choices
                            {field.type === 'multiselect' ? ' (multi-select)' : ''}
                          </p>
                          {(field.options || []).map((opt, idx) => (
                            <div key={opt.id} className="flex items-center gap-2">
                              <span className="text-xs text-neutral-400 w-5 shrink-0">{idx + 1}.</span>
                              <Input
                                value={opt.label}
                                onChange={(e) =>
                                  updateOption(section.id, field.id, opt.id, e.target.value)
                                }
                                placeholder={`Option ${idx + 1}`}
                                className="text-sm flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(section.id, field.id, opt.id)}
                                className={BUTTON_ICON_DANGER}
                                title="Remove option"
                                disabled={(field.options || []).length <= 1}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(section.id, field.id)}
                            className={`${BUTTON_SECONDARY} text-xs py-1.5 px-3 inline-flex items-center gap-1`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add option
                          </button>
                        </div>
                      )}

                      {/* Field Settings */}
                      <div className="mt-3 pt-3 border-t border-neutral-200 flex items-center justify-between gap-3">
                        <label className="text-sm font-body flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) =>
                              updateField(section.id, field.id, { required: e.target.checked })
                            }
                            className="w-4 h-4 rounded border-neutral-400"
                          />
                          <span className="font-medium text-neutral-800">Required field</span>
                        </label>
                        <span className="text-xs text-neutral-500 font-body">
                          {field.required ? 'Submitter must fill this' : 'Optional'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Field Button */}
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs font-semibold mb-2 text-gray-700">Add Field</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {FIELD_TYPES.map((fieldType) => (
                      <button
                        key={fieldType.type}
                        type="button"
                        onClick={() => addFieldToSection(section.id, fieldType.type)}
                        className={`${BUTTON_SECONDARY} text-xs py-2`}
                      >
                        {fieldType.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Add Section Button */}
      <button type="button" onClick={addSection} className={`w-full ${BUTTON_SECONDARY}`}>
        <Plus className="h-4 w-4 mr-2 inline" />
        Add Section
      </button>

      <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4">
        <button
          type="button"
          onClick={() => onPreview?.(currentForm)}
          disabled={isLoading}
          className={`${BUTTON_SECONDARY} inline-flex items-center justify-center gap-2`}
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
        <button
          type="button"
          onClick={() => onSave(currentForm)}
          disabled={isLoading}
          className={`${BUTTON_PRIMARY} inline-flex items-center justify-center gap-2`}
        >
          {isLoading ? 'Saving…' : 'Save Form'}
        </button>
      </div>
    </div>
  )
}
