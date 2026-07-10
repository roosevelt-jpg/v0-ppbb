'use client'

import React, { useState } from 'react'
import { X, Loader2, Plus, Trash2, Upload } from 'lucide-react'
import { uploadImageToFirebase } from '@/lib/upload-utils'

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
  communityBenefit: string
  services: string[]
  tradeLicenceURL: string
  productImages: string[]
}

const BUSINESS_TYPES = [
  'Services',
  'Products',
  'Coaching',
  'Consulting',
  'Education',
  'Merchandise',
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
    communityBenefit: '',
    services: [''],
    tradeLicenceURL: '',
    productImages: [],
  })
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState<'licence' | 'products' | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.businessName.trim()) {
      setError('Business name is required')
      return
    }
    if (!formData.businessType) {
      setError('Please select a category')
      return
    }
    if (!formData.communityBenefit.trim()) {
      setError('Please describe how you benefit the PB community')
      return
    }

    try {
      await onSubmit({
        ...formData,
        services: formData.services.map((s) => s.trim()).filter(Boolean),
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create business profile')
    }
  }

  const handleLicenceUpload = async (file: File) => {
    setUploading('licence')
    setError('')
    try {
      const url = await uploadImageToFirebase(file, 'businesses/trade-licences', {
        preset: 'content',
      })
      setFormData((prev) => ({ ...prev, tradeLicenceURL: url }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Trade licence upload failed')
    } finally {
      setUploading(null)
    }
  }

  const handleProductImagesUpload = async (files: FileList) => {
    setUploading('products')
    setError('')
    try {
      const urls: string[] = []
      for (const file of Array.from(files).slice(0, 6)) {
        const url = await uploadImageToFirebase(file, 'businesses/product-images', {
          preset: 'content',
        })
        urls.push(url)
      }
      setFormData((prev) => ({
        ...prev,
        productImages: [...prev.productImages, ...urls].slice(0, 8),
      }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Product image upload failed')
    } finally {
      setUploading(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <p className="eyebrow text-neutral-500 mb-1">UPGRADE</p>
            <h2 className="font-headline text-xl font-bold">List your business</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-neutral-500 hover:text-neutral-700 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm font-body">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium font-body text-neutral-700 mb-1">
              Business name *
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder="Enter your business name"
              disabled={isLoading}
              className="w-full min-h-[44px] px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-neutral-50 font-body"
            />
          </div>

          <div>
            <label className="block text-sm font-medium font-body text-neutral-700 mb-1">
              Category *
            </label>
            <select
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              disabled={isLoading}
              className="w-full min-h-[44px] px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-neutral-50 font-body"
            >
              <option value="">Select a category</option>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium font-body text-neutral-700 mb-1">
              How you benefit the PB community *
            </label>
            <textarea
              value={formData.communityBenefit}
              onChange={(e) => setFormData({ ...formData, communityBenefit: e.target.value })}
              placeholder="Describe the value you bring to members…"
              rows={3}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-neutral-50 font-body"
            />
          </div>

          <div>
            <label className="block text-sm font-medium font-body text-neutral-700 mb-1">
              Short description
            </label>
            <textarea
              value={formData.businessDescription}
              onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
              placeholder="One-line description for your directory card"
              rows={2}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-neutral-50 font-body"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium font-body text-neutral-700">
                Services offered
              </label>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, services: [...prev.services, ''] }))
                }
                className="inline-flex items-center gap-1 text-sm font-body text-neutral-700 hover:text-black min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {formData.services.map((service, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => {
                      const next = [...formData.services]
                      next[index] = e.target.value
                      setFormData({ ...formData, services: next })
                    }}
                    placeholder={`Service ${index + 1}`}
                    disabled={isLoading}
                    className="flex-1 min-h-[44px] px-3 py-2 border border-neutral-300 rounded-lg font-body"
                  />
                  {formData.services.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          services: prev.services.filter((_, i) => i !== index),
                        }))
                      }
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center bg-red-600 text-white rounded-lg"
                      aria-label="Remove service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium font-body text-neutral-700 mb-1">
              Trade licence
            </label>
            <p className="text-xs text-neutral-500 mb-2 font-body">
              Uploaded to Firebase Storage — only the URL is stored.
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-neutral-50 text-sm font-body min-h-[44px] bg-white text-black">
              <Upload className="w-4 h-4" />
              {uploading === 'licence'
                ? 'Uploading…'
                : formData.tradeLicenceURL
                  ? 'Replace licence'
                  : 'Upload licence'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isLoading || uploading !== null}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleLicenceUpload(file)
                  e.target.value = ''
                }}
              />
            </label>
            {formData.tradeLicenceURL && (
              <p className="text-xs text-green-700 mt-2 break-all font-body">Licence uploaded</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium font-body text-neutral-700 mb-1">
              Product / service images
            </label>
            <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-neutral-50 text-sm font-body min-h-[44px] bg-white text-black">
              <Upload className="w-4 h-4" />
              {uploading === 'products' ? 'Uploading…' : 'Upload images'}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={isLoading || uploading !== null}
                onChange={(e) => {
                  if (e.target.files?.length) void handleProductImagesUpload(e.target.files)
                  e.target.value = ''
                }}
              />
            </label>
            {formData.productImages.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {formData.productImages.map((url) => (
                  <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          productImages: prev.productImages.filter((u) => u !== url),
                        }))
                      }
                      className="absolute top-1 right-1 bg-red-600 text-white rounded p-1"
                      aria-label="Remove image"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-neutral-600 font-body">
            Submissions require admin approval before appearing in the public marketplace
            directory.
          </p>
        </form>

        <div className="flex gap-3 p-4 sm:p-6 border-t sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 min-h-[44px] px-4 py-2 bg-white text-black border border-neutral-300 rounded-lg font-body font-medium hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || uploading !== null}
            className="flex-1 min-h-[44px] px-4 py-2 bg-black text-white rounded-lg font-body font-medium hover:bg-gray-800 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              'Submit for review'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
