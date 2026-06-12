'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { PricingPlan } from '@/lib/pricing-types'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function PricingManagementPage() {
  const [plans, setPlans] = React.useState<PricingPlan[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [formData, setFormData] = React.useState<Partial<PricingPlan>>({
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    billingPeriod: 'monthly',
    features: [],
    benefits: [],
    icon: '🎯',
    color: '#3b82f6',
    active: true,
    order: 0,
  })
  const [newFeature, setNewFeature] = React.useState('')
  const [newBenefit, setNewBenefit] = React.useState('')
  const [saveLoading, setSaveLoading] = React.useState(false)

  React.useEffect(() => {
    const q = query(collection(db, 'pricingPlans'), orderBy('order', 'asc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const plansData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PricingPlan[]
        setPlans(plansData)
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching pricing plans:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), newFeature],
      })
      setNewFeature('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: (formData.features || []).filter((_, i) => i !== index),
    })
  }

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      setFormData({
        ...formData,
        benefits: [...(formData.benefits || []), newBenefit],
      })
      setNewBenefit('')
    }
  }

  const handleRemoveBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: (formData.benefits || []).filter((_, i) => i !== index),
    })
  }

  const handleSavePlan = async () => {
    if (!formData.name?.trim() || formData.price === undefined) {
      alert('Please fill in name and price')
      return
    }

    setSaveLoading(true)
    try {
      if (editingId) {
        // Update existing plan
        await updateDoc(doc(db, 'pricingPlans', editingId), {
          ...formData,
          updatedAt: serverTimestamp(),
        })
      } else {
        // Add new plan
        await addDoc(collection(db, 'pricingPlans'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        price: 0,
        currency: 'USD',
        billingPeriod: 'monthly',
        features: [],
        benefits: [],
        icon: '🎯',
        color: '#3b82f6',
        active: true,
        order: 0,
      })
      setEditingId(null)
      setShowAddForm(false)
      alert(editingId ? 'Plan updated successfully!' : 'Plan created successfully!')
    } catch (error) {
      console.error('[v0] Error saving plan:', error)
      alert('Failed to save plan')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleEditPlan = (plan: PricingPlan) => {
    setFormData(plan)
    setEditingId(plan.id)
    setShowAddForm(true)
  }

  const handleDeletePlan = async (planId: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      try {
        await deleteDoc(doc(db, 'pricingPlans', planId))
        alert('Plan deleted successfully!')
      } catch (error) {
        console.error('[v0] Error deleting plan:', error)
        alert('Failed to delete plan')
      }
    }
  }

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      billingPeriod: 'monthly',
      features: [],
      benefits: [],
      icon: '🎯',
      color: '#3b82f6',
      active: true,
      order: 0,
    })
    setEditingId(null)
    setShowAddForm(false)
    setNewFeature('')
    setNewBenefit('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
          <p className="mt-4 text-neutral-600">Loading pricing plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pricing Plans Management</h1>
          <p className="text-neutral-600 mt-1">Create and manage subscription plans that users can purchase</p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Plan
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="p-6 border border-neutral-200 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{editingId ? 'Edit Plan' : 'Create New Plan'}</h2>
            <button onClick={handleCancel} className="text-neutral-500 hover:text-neutral-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium mb-1">Plan Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="e.g., Standard, Gold, Platinum"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Price (in cents) *</label>
              <input
                type="number"
                value={formData.price || 0}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="e.g., 9900 for $99.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <select
                value={formData.currency || 'USD'}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
                <option value="AED">AED</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Billing Period</label>
              <select
                value={formData.billingPeriod || 'monthly'}
                onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value as any })}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="Brief description of this plan"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Icon (Emoji)</label>
              <input
                type="text"
                value={formData.icon || ''}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="e.g., 🎯"
                maxLength={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Color (Hex)</label>
              <input
                type="text"
                value={formData.color || ''}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="#3b82f6"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input
                type="number"
                value={formData.order || 0}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="Lower numbers appear first"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active ?? true}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
          </div>

          {/* Features */}
          <div className="border-t border-neutral-200 pt-4">
            <h3 className="font-semibold mb-3">Features</h3>
            <div className="space-y-2">
              {(formData.features || []).map((feature, idx) => (
                <div key={idx} className="flex items-center justify-between bg-neutral-50 p-3 rounded-lg">
                  <span className="text-sm">{feature}</span>
                  <button
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                  className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="Add a feature..."
                />
                <button
                  onClick={handleAddFeature}
                  className="px-3 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition text-sm font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="border-t border-neutral-200 pt-4">
            <h3 className="font-semibold mb-3">Benefits</h3>
            <div className="space-y-2">
              {(formData.benefits || []).map((benefit, idx) => (
                <div key={idx} className="flex items-center justify-between bg-neutral-50 p-3 rounded-lg">
                  <span className="text-sm">{benefit}</span>
                  <button
                    onClick={() => handleRemoveBenefit(idx)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddBenefit()}
                  className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="Add a benefit..."
                />
                <button
                  onClick={handleAddBenefit}
                  className="px-3 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition text-sm font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4 border-t border-neutral-200">
            <button
              onClick={handleSavePlan}
              disabled={saveLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saveLoading ? 'Saving...' : 'Save Plan'}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* Plans Grid */}
      {!showAddForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="p-6 border-2 transition hover:shadow-lg"
              style={{ borderColor: plan.color || '#e5e7eb' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{plan.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    {plan.description && <p className="text-xs text-neutral-600">{plan.description}</p>}
                  </div>
                </div>
                {!plan.active && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">Inactive</span>
                )}
              </div>

              <div className="mb-4 pb-4 border-b border-neutral-200">
                <p className="text-2xl font-bold">
                  {plan.currency} {(plan.price / 100).toFixed(2)}
                </p>
                <p className="text-xs text-neutral-600">per {plan.billingPeriod}</p>
              </div>

              <div className="space-y-3 mb-4">
                {plan.features && plan.features.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-neutral-600 mb-2">Features:</p>
                    <div className="space-y-1">
                      {plan.features.map((feature, idx) => (
                        <p key={idx} className="text-xs text-neutral-700">• {feature}</p>
                      ))}
                    </div>
                  </div>
                )}

                {plan.benefits && plan.benefits.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-neutral-600 mb-2">Benefits:</p>
                    <div className="space-y-1">
                      {plan.benefits.map((benefit, idx) => (
                        <p key={idx} className="text-xs text-neutral-700">✓ {benefit}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => handleEditPlan(plan)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!showAddForm && plans.length === 0 && (
        <Card className="p-12 border border-neutral-200 text-center">
          <p className="text-neutral-600 mb-4">No pricing plans yet. Create your first plan to get started.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Plan
          </button>
        </Card>
      )}
    </div>
  )
}
