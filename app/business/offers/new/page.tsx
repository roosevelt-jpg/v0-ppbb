'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createOffer } from '@/lib/business-queries'

export default function NewOffer() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSaving, setIsSaving] = React.useState(false)
  const [formData, setFormData] = React.useState({
    title: '',
    type: 'product',
    description: '',
    category: '',
    price: 0,
    discountPercentage: 0,
    originalPrice: 0,
    validUntil: '',
    targetAudience: 'members',
    memberBenefit: 0,
    status: 'active' as const,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setIsSaving(true)
      const validUntil = formData.validUntil ? new Date(formData.validUntil) : undefined
      await createOffer(user.id, user.businessProfile?.businessName || 'Unknown', {
        ...formData,
        validUntil,
        views: 0,
        conversions: 0,
      })
      alert('Offer posted successfully!')
      router.push('/business/offers')
    } catch (error) {
      console.error('[v0] Error posting offer:', error)
      alert('Error posting offer. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!user || (user.role !== 'business' && user.role !== 'super_admin')) {
    return <div className="text-center py-8">Access Denied</div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '32px' }}>
        <div className="max-w-2xl mx-auto">
          <h1 style={{ color: '#111111', fontSize: '32px', fontWeight: 700 }}>
            Post New Offer
          </h1>
          <p style={{ color: '#888888', marginTop: '8px' }}>
            Share a product, service, or discount
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto p-8">
        <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Offer Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Web Design Service"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  color: '#111111',
                }}
              />
            </div>

            {/* Type and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e4e1da',
                    borderRadius: '8px',
                    color: '#111111',
                  }}
                >
                  <option value="product">Product</option>
                  <option value="service">Service</option>
                  <option value="discount">Discount</option>
                </select>
              </div>
              <div>
                <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Design, Consulting"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e4e1da',
                    borderRadius: '8px',
                    color: '#111111',
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Describe your offer..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  color: '#111111',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Price (AED) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e4e1da',
                    borderRadius: '8px',
                    color: '#111111',
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Original Price (AED)
                </label>
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e4e1da',
                    borderRadius: '8px',
                    color: '#111111',
                  }}
                />
              </div>
            </div>

            {/* Discount and Valid Until */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Discount %
                </label>
                <input
                  type="number"
                  name="discountPercentage"
                  value={formData.discountPercentage}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e4e1da',
                    borderRadius: '8px',
                    color: '#111111',
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Valid Until
                </label>
                <input
                  type="date"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e4e1da',
                    borderRadius: '8px',
                    color: '#111111',
                  }}
                />
              </div>
            </div>

            {/* Member Benefit */}
            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Member Benefit (%)
              </label>
              <input
                type="number"
                name="memberBenefit"
                value={formData.memberBenefit}
                onChange={handleChange}
                min="0"
                max="100"
                placeholder="Additional discount for members"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  color: '#111111',
                }}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSaving}
                style={{
                  backgroundColor: '#111111',
                  color: '#ffffff',
                  padding: '12px 24px',
                }}
              >
                {isSaving ? 'Posting...' : 'Post Offer'}
              </Button>
              <Button
                type="button"
                onClick={() => router.back()}
                style={{
                  backgroundColor: '#e4e1da',
                  color: '#111111',
                  padding: '12px 24px',
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
