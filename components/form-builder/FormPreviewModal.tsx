'use client'

import React from 'react'
import { CustomForm } from '@/lib/form-builder-types'
import DynamicFormRenderer from '@/components/form-builder/DynamicFormRenderer'
import { BUTTON_SECONDARY } from '@/lib/admin-design-system'
import { X } from 'lucide-react'

interface FormPreviewModalProps {
  form: CustomForm
  onClose: () => void
}

export function FormPreviewModal({ form, onClose }: FormPreviewModalProps) {
  return (
    <div className="admin-modal-overlay p-4 z-50" role="dialog" aria-modal="true" aria-label="Form preview">
      <div className="admin-modal-content bg-neutral-50 rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-200 bg-white rounded-t-lg flex-shrink-0">
          <h2 className="font-headline text-xl font-bold text-neutral-900">Form Preview</h2>
          <button type="button" onClick={onClose} className={BUTTON_SECONDARY} aria-label="Close preview">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 sm:p-8">
          <DynamicFormRenderer form={form} previewMode />
        </div>
      </div>
    </div>
  )
}
