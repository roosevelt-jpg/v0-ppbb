'use client'

import React, { useState } from 'react'
import { CustomForm, FormSection, FormField, FormFieldType } from '@/lib/form-builder-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Edit2,
  Eye,
  EyeOff,
} from 'lucide-react'

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
  onPreview?: () => void
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
    const updatedSections = currentForm.sections.map(section => {
      if (section.id === sectionId) {
        const newField: FormField = {
          id: `field-${Date.now()}`,
          type: fieldType,
          label: 'New Field',
          required: false,
          order: section.fields.length + 1,
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
      <div className="bg-white rounded-lg p-6 border">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Form Title</label>
            <Input
              value={currentForm.title}
              onChange={e => setCurrentForm({ ...currentForm, title: e.target.value })}
              className="max-w-lg"
              placeholder="Enter form title"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              value={currentForm.description}
              onChange={e => setCurrentForm({ ...currentForm, description: e.target.value })}
              className="w-full max-w-lg p-2 border rounded text-sm"
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSection(section.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteField(section.id, field.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>

                      {/* Field Options */}
                      {(field.type === 'select' ||
                        field.type === 'multiselect' ||
                        field.type === 'radio' ||
                        field.type === 'checkbox') && (
                        <div className="mt-2 pt-2 border-t space-y-1">
                          {(field.options || []).map((opt, idx) => (
                            <div key={opt.id} className="text-xs">
                              {opt.label}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Field Settings */}
                      <div className="mt-2 pt-2 border-t flex gap-2">
                        <label className="text-xs flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={e =>
                              updateField(section.id, field.id, { required: e.target.checked })
                            }
                          />
                          Required
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Field Button */}
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs font-semibold mb-2 text-gray-700">Add Field</p>
                  <div className="grid grid-cols-3 gap-2">
                    {FIELD_TYPES.map(fieldType => (
                      <Button
                        key={fieldType.type}
                        variant="outline"
                        size="sm"
                        onClick={() => addFieldToSection(section.id, fieldType.type)}
                        className="text-xs"
                      >
                        {fieldType.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Add Section Button */}
      <Button onClick={addSection} className="w-full" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Section
      </Button>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4">
        <Button
          onClick={onPreview}
          variant="outline"
          disabled={isLoading}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button
          onClick={() => onSave(currentForm)}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Form'}
        </Button>
      </div>
    </div>
  )
}
