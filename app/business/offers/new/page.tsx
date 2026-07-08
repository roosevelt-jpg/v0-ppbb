'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/firebase'

export default function NewOffer() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSaving, setIsSaving] = React.useState(false)
  const [formData, setFormData] = React.useState({
    title: '',
    type: 'product',
    description: '',
    category: '',
    variant: '',
    price: 0,
    discountPercentage: 0,
    originalPrice: 0,
    validUntil: '',
    targetAudience: 'members',
    memberBenefit: 0,
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
      const token = await auth.currentUser?.getIdToken()
      if (!token) {
        alert('Please sign in again to post an offer.')
        return
      }
      const res = await fetch('/api/business/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          businessName: user.businessProfile?.businessName || 'Unknown',
          validUntil: formData.validUntil || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        alert(json.error || 'Error posting offer. Please try again.')
        return
      }
      alert('Offer submitted for admin approval. It will appear publicly once approved.')
      router.push('/business/offers')
    } catch (error) {
      console.error('[v0] Error posting offer:', error)
      alert('Error posting offer. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!user || (!hasBusinessAccess(user))) {
    return <div className="text-center py-8">Access Denied</div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '32px' }}>
        <div className="max-w-2xl mx-auto">
          <h1
            style={{
              color: '#111111',
              fontSize: '32px',
              fontWeight: 700,
              fontFamily: 'Cormorant Garamond, serif',
            }}
          >
            Post New Offer
          </h1>
          <p style={{ color: '#888888', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>
            Share a product, service, or discount — submitted for admin approval before it goes live
          </p>
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
        <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e4e1da',
                    borderRadius: '8px',
                    color: '#111111',
                    minHeight: '44px',
                  }}
                >
                  <option value="">Select category</option>
                  <option value="merchandise">Merchandise (shows on /shop when Published)</option>
                  <option value="product">Product</option>
                  <option value="service">Service</option>
                  <option value="discount">Discount</option>
                  <option value="books">Books</option>
                  <option value="courses">Courses</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Variant — used on /shop merch cards (colour / size) */}
            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Variant (colour / size)
              </label>
              <input
                type="text"
                name="variant"
                value={formData.variant}
                onChange={handleChange}
                placeholder="e.g., CREAM / BRONZE"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  color: '#111111',
                  minHeight: '44px',
                }}
              />
              <p style={{ color: '#888888', fontSize: '12px', marginTop: '6px' }}>
                Displayed on the public Shop page for Merchandise offers.
              </p>
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

            <div
              className="rounded-lg border border-amber-200 bg-amber-50 p-4"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <p
                className="text-xs uppercase tracking-[0.15em] text-amber-800 mb-1"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Approval
              </p>
              <p style={{ color: '#111111', fontSize: '14px' }}>
                Offers are submitted as <strong>pending approval</strong>. They appear on the
                marketplace or shop only after an admin publishes them.
              </p>
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
