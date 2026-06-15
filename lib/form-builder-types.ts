// Form Builder Types

export type FormFieldType = 
  | 'text' 
  | 'email' 
  | 'phone' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'multiselect' 
  | 'checkbox' 
  | 'radio' 
  | 'date' 
  | 'file' 
  | 'rating'

export interface FormFieldOption {
  id: string
  label: string
  value: string
}

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  placeholder?: string
  required: boolean
  description?: string
  options?: FormFieldOption[]
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    customMessage?: string
  }
  order: number
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
  order: number
}

export interface CustomForm {
  id: string
  title: string
  description: string
  category: 'charity' | 'event' | 'volunteer' | 'partnership' | 'other'
  sections: FormSection[]
  status: 'active' | 'inactive' | 'archived'
  createdBy: string
  createdAt: Date
  updatedAt: Date
  submissionCount: number
  responseRate?: number
}

export interface FormSubmissionValue {
  [fieldId: string]: any
}

export interface FormSubmission {
  id: string
  formId: string
  userId?: string
  userEmail?: string
  responses: FormSubmissionValue
  status: 'pending' | 'reviewed' | 'approved' | 'rejected'
  notes?: string
  submittedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
}

export interface FormStatistics {
  totalForms: number
  activeForms: number
  totalSubmissions: number
  pendingReviews: number
  averageResponseRate: number
}
