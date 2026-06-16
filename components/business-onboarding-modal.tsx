'use client'

import React, { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

interface BusinessOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: BusinessFormData) => Promise<void>
  isLoading?: boolean
}

export interface BusinessFormData {
  businessName: string
  businessType: string
  businessDescription: string
}

const BUSINESS_TYPES = [
  'Retail',
  'E-commerce',
  'Service',
  'Food & Beverage',
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Real Estate',
  'Manufacturing',
  'Consulting',
  'Other',
]

export function BusinessOnboardingModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: BusinessOnboardingModalProps) {
  const [formData, setFormData] = useState<BusinessFormData>({
    businessName: '',
    businessType: '',
    businessDescription: '',
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.businessName.trim()) {
      setError('Business name is required')
      return
    }
    if (!formData.businessType) {
      setError('Please select a business type')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err: any) {
      setError(err.message || 'Failed to create business profile')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Create Business Profile</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) =>
                setFormData({ ...formData, businessName: e.target.value })
              }
              placeholder="Enter your business name"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50"
            />
          </div>

          {/* Business Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Type *
            </label>
            <select
              value={formData.businessType}
              onChange={(e) =>
                setFormData({ ...formData, businessType: e.target.value })
              }
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50"
            >
              <option value="">Select a type</option>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Business Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Description
            </label>
            <textarea
              value={formData.businessDescription}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  businessDescription: e.target.value,
                })
              }
              placeholder="Tell us about your business"
              rows={3}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50"
            />
          </div>

          {/* Info Text */}
          <p className="text-xs text-gray-600">
            You can add more details to your business profile later from the Business Portal.
          </p>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Business Profile'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
