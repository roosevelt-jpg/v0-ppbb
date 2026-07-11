'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { PricingEmojiPicker } from '@/components/pricing-emoji-picker'
import { PricingColorPicker } from '@/components/pricing-color-picker'
import { AdminSelect } from '@/components/admin-select'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { PricingPlan } from '@/lib/pricing-types'
import { getPlanIncludedItems } from '@/lib/pricing-utils'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { BUTTON_PRIMARY, INPUT_STYLE, TEXTAREA_STYLE } from '@/lib/admin-design-system'
import { useAdminAudit } from '@/lib/use-admin-audit'

export const dynamic = 'force-dynamic'

const EMPTY_FORM: Partial<PricingPlan> = {
  name: '',
  description: '',
  price: 0,
  currency: 'USD',
  billingPeriod: 'monthly',
  features: [],
  benefits: [],
  icon: '🎯',
  color: '#111111',
  active: true,
  order: 0,
}

export default function PricingManagementPage() {
  const audit = useAdminAudit()
  const [plans, setPlans] = React.useState<PricingPlan[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [formData, setFormData] = React.useState<Partial<PricingPlan>>({ ...EMPTY_FORM })
  const [newIncludedItem, setNewIncludedItem] = React.useState('')
  const [saveLoading, setSaveLoading] = React.useState(false)

  React.useEffect(() => {
    const q = query(collection(db, 'pricingPlans'), orderBy('order', 'asc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const plansData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as PricingPlan[]
        setPlans(plansData)
        setLoading(false)
      },
      (error) => {
        console.error('[v0] pricingPlans onSnapshot permission error:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const includedItems = formData.features || []

  const handleAddIncludedItem = () => {
    const trimmed = newIncludedItem.trim()
    if (!trimmed) return
    const merged = getPlanIncludedItems({
      features: [...includedItems, trimmed],
      benefits: [],
    })
    setFormData({ ...formData, features: merged })
    setNewIncludedItem('')
  }

  const handleRemoveIncludedItem = (index: number) => {
    setFormData({
      ...formData,
      features: includedItems.filter((_, i) => i !== index),
    })
  }

  const handleSavePlan = async () => {
    if (!formData.name?.trim() || formData.price === undefined) {
      alert('Please fill in name and price')
      return
    }

    setSaveLoading(true)
    try {
      const consolidatedFeatures = getPlanIncludedItems({
        features: formData.features || [],
        benefits: formData.benefits || [],
      })

      const payload = sanitizeForFirestore({
        name: formData.name,
        description: formData.description || '',
        price: formData.price,
        currency: formData.currency || 'USD',
        billingPeriod: formData.billingPeriod || 'monthly',
        features: consolidatedFeatures,
        benefits: [],
        icon: formData.icon || '🎯',
        color: formData.color || '#111111',
        active: formData.active ?? true,
        order: formData.order ?? 0,
        paymentGateway: (formData as PricingPlan).paymentGateway,
        stripeProductId: formData.stripeProductId,
        stripePriceId: formData.stripePriceId,
        paypalPlanId: formData.paypalPlanId,
        ziinaPlanId: formData.ziinaPlanId,
        updatedAt: serverTimestamp(),
      })

      if (editingId) {
        await updateDoc(doc(db, 'pricingPlans', editingId), payload)
        audit({
          actionType: 'update',
          action: `Updated pricing plan: ${formData.name}`,
          entityType: 'pricing',
          entityId: editingId,
          entityName: formData.name,
          status: 'success',
        })
      } else {
        const ref = await addDoc(collection(db, 'pricingPlans'), {
          ...payload,
          createdAt: serverTimestamp(),
        })
        audit({
          actionType: 'create',
          action: `Created pricing plan: ${formData.name}`,
          entityType: 'pricing',
          entityId: ref.id,
          entityName: formData.name,
          status: 'success',
        })
      }

      setFormData({ ...EMPTY_FORM })
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
    setFormData({
      ...plan,
      features: getPlanIncludedItems(plan),
      benefits: [],
    })
    setEditingId(plan.id)
    setShowAddForm(true)
  }

  const handleDeletePlan = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId)
    if (confirm('Are you sure you want to delete this plan?')) {
      try {
        await deleteDoc(doc(db, 'pricingPlans', planId))
        audit({
          actionType: 'delete',
          action: `Deleted pricing plan: ${plan?.name || planId}`,
          entityType: 'pricing',
          entityId: planId,
          entityName: plan?.name || planId,
          status: 'success',
        })
        alert('Plan deleted successfully!')
      } catch (error) {
        console.error('[v0] Error deleting plan:', error)
        alert('Failed to delete plan')
      }
    }
  }

  const handleCancel = () => {
    setFormData({ ...EMPTY_FORM })
    setEditingId(null)
    setShowAddForm(false)
    setNewIncludedItem('')
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
    <AdminPageLayout title="Pricing Plans" subtitle="Create and manage subscription plans">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className={`${BUTTON_PRIMARY} flex items-center gap-2`}
              >
                <Plus className="w-4 h-4" />
                Add Plan
              </button>
            )}
          </div>
        </div>

      {showAddForm && (
        <Card className="p-4 sm:p-6 border border-neutral-200 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-headline font-bold">{editingId ? 'Edit Plan' : 'Create New Plan'}</h2>
            <button onClick={handleCancel} className="text-neutral-500 hover:text-neutral-700" aria-label="Close form">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <AdminSelect
                value={formData.currency || 'USD'}
                onChange={(currency) => setFormData({ ...formData, currency })}
                aria-label="Currency"
                options={[
                  { value: 'USD', label: 'USD' },
                  { value: 'GBP', label: 'GBP' },
                  { value: 'EUR', label: 'EUR' },
                  { value: 'AED', label: 'AED' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Billing Period</label>
              <AdminSelect
                value={formData.billingPeriod || 'monthly'}
                onChange={(billingPeriod) =>
                  setFormData({ ...formData, billingPeriod: billingPeriod as PricingPlan['billingPeriod'] })
                }
                aria-label="Billing period"
                options={[
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'yearly', label: 'Yearly' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Payment Gateway</label>
              <AdminSelect
                value={(formData as PricingPlan).paymentGateway || 'stripe'}
                onChange={(paymentGateway) =>
                  setFormData({ ...formData, paymentGateway: paymentGateway as PricingPlan['paymentGateway'] })
                }
                aria-label="Payment gateway"
                options={[
                  { value: 'stripe', label: 'Stripe' },
                  { value: 'paypal', label: 'PayPal' },
                  { value: 'ziina', label: 'Ziina' },
                ]}
              />
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
              <label className="block text-sm font-medium mb-2">Icon (Emoji)</label>
              <PricingEmojiPicker
                value={formData.icon || '🎯'}
                onChange={(emoji) => setFormData({ ...formData, icon: emoji })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Color (Hex)</label>
              <PricingColorPicker
                value={formData.color || '#111111'}
                onChange={(color) => setFormData({ ...formData, color })}
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
                  className="w-4 h-4 rounded border-neutral-300 accent-black"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-4">
            <h3 className="font-semibold mb-3">What&apos;s Included</h3>
            <div className="space-y-2">
              {includedItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-neutral-50 p-3 rounded-lg gap-2">
                  <span className="text-sm">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIncludedItem(idx)}
                    className="text-red-600 hover:text-red-700 shrink-0"
                    aria-label="Remove item"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newIncludedItem}
                  onChange={(e) => setNewIncludedItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIncludedItem())}
                  className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="Add a feature or benefit..."
                />
                <button
                  type="button"
                  onClick={handleAddIncludedItem}
                  className={`${BUTTON_PRIMARY} text-sm px-3 py-2`}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={handleSavePlan}
              disabled={saveLoading}
              className={`${BUTTON_PRIMARY} flex-1 flex items-center justify-center gap-2`}
            >
              <Save className="w-4 h-4" />
              {saveLoading ? 'Saving...' : 'Save Plan'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className={`${BUTTON_PRIMARY} !text-white flex-1`}
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      {!showAddForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const items = getPlanIncludedItems(plan)
            return (
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

              {items.length > 0 && (
                <div className="space-y-1 mb-4">
                  <p className="text-xs font-semibold text-neutral-600 mb-2">What&apos;s Included:</p>
                  {items.map((item, idx) => (
                    <p key={idx} className="text-xs text-neutral-700">• {item}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => handleEditPlan(plan)}
                  className={`${BUTTON_PRIMARY} !text-white flex-1 flex items-center justify-center gap-2 text-sm`}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePlan(plan.id)}
                  className={`${BUTTON_PRIMARY} !text-white flex-1 flex items-center justify-center gap-2 text-sm`}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </Card>
          )})}
        </div>
      )}

      {!showAddForm && plans.length === 0 && (
        <Card className="p-12 border border-neutral-200 text-center">
          <p className="text-neutral-600 mb-4">No pricing plans yet. Create your first plan to get started.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className={`${BUTTON_PRIMARY} inline-flex items-center gap-2`}
          >
            <Plus className="w-4 h-4" />
            Create Plan
          </button>
        </Card>
      )}
      </div>
    </AdminPageLayout>
  )
}
