import type { FormField, FormFieldType } from '@/lib/form-builder-types'

export const FORM_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024

export const FORM_ATTACHMENT_ACCEPTED_EXTENSIONS = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'txt',
  'csv',
  'xlsx',
] as const

export const FORM_ATTACHMENT_ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
  'text/csv',
  'application/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
] as const

export type FormFileValue = {
  url: string
  name: string
  size: number
  contentType: string
}

export function slugifyFormTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function getPublicFormPath(slug: string): string {
  return `/forms/${slug}`
}

export function validateAttachmentFile(file: File): string | null {
  if (file.size > FORM_ATTACHMENT_MAX_BYTES) {
    return `File must be ${FORM_ATTACHMENT_MAX_BYTES / (1024 * 1024)}MB or smaller`
  }

  const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : ''
  const mimeOk =
    FORM_ATTACHMENT_ACCEPTED_MIME_TYPES.includes(
      file.type as (typeof FORM_ATTACHMENT_ACCEPTED_MIME_TYPES)[number]
    ) ||
    (ext && FORM_ATTACHMENT_ACCEPTED_EXTENSIONS.includes(ext as (typeof FORM_ATTACHMENT_ACCEPTED_EXTENSIONS)[number]))

  if (!mimeOk) {
    return 'Unsupported file type. Allowed: PDF, JPG, PNG, TXT, CSV, XLSX'
  }

  return null
}

export function isFieldValueEmpty(value: unknown, field: FormField): boolean {
  if (value === undefined || value === null || value === '') return true

  if (field.type === 'file') {
    if (typeof value === 'string') return !value.trim()
    if (typeof value === 'object' && value && 'url' in value) {
      return !(value as FormFileValue).url
    }
    return true
  }

  if (field.type === 'checkbox' || field.type === 'multiselect') {
    return !Array.isArray(value) || value.length === 0
  }

  if (field.type === 'rating') {
    return value === 0 || value === '' || value === null
  }

  return false
}

export function formatFieldDisplayValue(value: unknown, fieldType: FormFieldType): string {
  if (value === undefined || value === null || value === '') return '(No response)'
  if (fieldType === 'file' && typeof value === 'object' && value && 'url' in value) {
    return (value as FormFileValue).name || (value as FormFileValue).url
  }
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

export function isFileFieldValue(value: unknown): value is FormFileValue {
  return typeof value === 'object' && value !== null && 'url' in value && typeof (value as FormFileValue).url === 'string'
}
