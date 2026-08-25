'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy } from 'firebase/firestore'
import { Policy } from '@/lib/types'
import { POLICY_TEMPLATES } from '@/lib/policy-manager'
import { Save, RefreshCw, Plus } from 'lucide-react'

export default function AdminPolicies() {
  const [policies, setPolicies] = useState<Record<string, Policy>>({})
  const [customPolicies, setCustomPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPolicy, setNewPolicy] = useState({ title: '', slug: '', content: '' })

  useEffect(() => {
    const loadPolicies = async () => {
      try {
        const policiesData: Record<string, Policy> = {}
        
        for (const [type, template] of Object.entries(POLICY_TEMPLATES)) {
          try {
            const docRef = doc(db, 'policies', type)
            const docSnap = await getDoc(docRef)
            
            if (docSnap.exists()) {
              policiesData[type] = docSnap.data() as Policy
            } else {
              // Create with fresh template
              const now = new Date()
              policiesData[type] = {
                id: type,
                type: type as 'privacy' | 'terms' | 'codeofconduct',
                title: template.title,
                slug: template.slug,
                content: template.getContent(),
                version: 1,
                lastUpdated: now,
                effectiveDate: now,
                status: 'active',
                createdAt: now,
                updatedAt: now,
              }
            }
          } catch (error) {
            console.error('[v0] Error loading policy:', type, error)
          }
        }
        
        // Load custom policies
        const customRef = collection(db, 'policies')
        const customQuery = query(customRef, orderBy('createdAt', 'desc'))
        const customSnap = await getDocs(customQuery)
        const custom = customSnap.docs
          .map(doc => ({ ...doc.data(), id: doc.id } as Policy))
          .filter(p => !['privacy', 'terms', 'codeofconduct'].includes(p.id || ''))
        
        setPolicies(policiesData)
        setCustomPolicies(custom)
      } catch (error) {
        console.error('[v0] Error loading policies:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPolicies()
  }, [])

  const handleSavePolicy = async (policyType: string) => {
    const policy = policies[policyType]
    if (!policy) return

    setSaving(true)
    try {
      const now = new Date()
      const policyData = {
        ...policy,
        version: (policy.version || 1) + 1,
        lastUpdated: now,
        updatedAt: now,
      }
      
      await setDoc(doc(db, 'policies', policyType), policyData)
      
      setPolicies({ ...policies, [policyType]: policyData })
      setEditingPolicy(null)
      
      // Show success message
      alert(`${policy.title} updated successfully`)
    } catch (error) {
      console.error('[v0] Error saving policy:', error)
      alert('Error saving policy. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPolicy = (policyType: string) => {
    const template = POLICY_TEMPLATES[policyType as keyof typeof POLICY_TEMPLATES]
    if (!template) return

    if (!confirm(`Reset ${template.title} to default content? This cannot be undone.`)) {
      return
    }

    const now = new Date()
    const resetPolicy: Policy = {
      id: policyType,
      type: policyType as 'privacy' | 'terms' | 'codeofconduct',
      title: template.title,
      slug: template.slug,
      content: template.getContent(),
      version: 1,
      lastUpdated: now,
      effectiveDate: now,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }

    setPolicies({ ...policies, [policyType]: resetPolicy })
    setEditingPolicy(policyType)
  }

  const handleCreatePolicy = async () => {
    if (!newPolicy.title || !newPolicy.slug || !newPolicy.content) {
      alert('Please fill in all required fields')
      return
    }
    setSaving(true)
    try {
      const now = new Date()
      const policyId = `custom_${Date.now()}`
      const policy: Policy = {
        id: policyId,
        type: 'privacy' as const,
        title: newPolicy.title,
        slug: newPolicy.slug,
        content: newPolicy.content,
        version: 1,
        lastUpdated: now,
        effectiveDate: now,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }
      await setDoc(doc(db, 'policies', policyId), policy)
      setCustomPolicies([policy, ...customPolicies])
      setShowCreateModal(false)
      setNewPolicy({ title: '', slug: '', content: '' })
      alert('Policy created successfully!')
    } catch (error) {
      console.error('[v0] Error creating policy:', error)
      alert('Error creating policy')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('Delete this policy?')) return
    try {
      await setDoc(doc(db, 'policies', policyId), { status: 'deleted' }, { merge: true })
      setCustomPolicies(customPolicies.filter(p => p.id !== policyId))
      alert('Policy deleted successfully')
    } catch (error) {
      console.error('[v0] Error deleting policy:', error)
      alert('Error deleting policy')
    }
  }

  if (loading) {
    return (
      <>
        <div className="p-8">
          <p style={{ color: 'var(--muted-foreground)' }}>Loading policies...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 style={{ color: 'var(--foreground)' }} className="text-3xl font-bold">Policies</h1>
          <Button onClick={() => setShowCreateModal(true)} style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Policy
          </Button>
        </div>
        
        {/* Custom Policies */}
        {customPolicies.length > 0 && (
          <div className="mb-12">
            <h2 style={{ color: 'var(--foreground)' }} className="text-2xl font-bold mb-6">Custom Policies</h2>
            <div className="space-y-4">
              {customPolicies.map((policy) => (
                <Card key={policy.id} style={{ borderColor: 'var(--border)' }} className="p-6 flex justify-between items-center">
                  <div>
                    <h3 style={{ color: 'var(--foreground)' }} className="font-semibold">{policy.title}</h3>
                    <p style={{ color: 'var(--muted-foreground)' }} className="text-sm">/{policy.slug}</p>
                  </div>
                  <Button
                    onClick={() => handleDeletePolicy(policy.id!)}
                    variant="ghost"
                    className="text-red-600 dark:text-red-400"
                    size="sm"
                  >
                    Delete
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Template Policies */}
        <h2 style={{ color: 'var(--foreground)' }} className="text-2xl font-bold mb-6">Template Policies</h2>
        <div className="space-y-6">
          {Object.entries(policies).map(([policyType, policy]) => (
            <Card 
              key={policyType} 
              style={{ borderColor: 'var(--border)' }}
              className="p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 style={{ color: 'var(--foreground)' }} className="text-xl font-bold">
                    {policy.title}
                  </h3>
                  <p style={{ color: 'var(--muted-foreground)' }} className="text-sm mt-1">
                    Slug: /{policy.slug} • Version: {policy.version}
                  </p>
                  <p style={{ color: 'var(--muted-foreground)' }} className="text-xs mt-2">
                    Last updated: {new Date(policy.lastUpdated).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setEditingPolicy(editingPolicy === policyType ? null : policyType)}
                    variant="outline"
                    size="sm"
                  >
                    {editingPolicy === policyType ? 'Hide' : 'Edit'}
                  </Button>
                  <Button
                    onClick={() => handleResetPolicy(policyType)}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {editingPolicy === policyType && (
                <div className="mt-6 space-y-4 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <label style={{ color: 'var(--accent)' }} className="block text-sm font-medium mb-2">
                      Policy Title
                    </label>
                    <input
                      type="text"
                      value={policy.title}
                      onChange={(e) =>
                        setPolicies({
                          ...policies,
                          [policyType]: { ...policy, title: e.target.value },
                        })
                      }
                      style={{ borderColor: 'var(--border)', color: 'var(--accent)', backgroundColor: 'var(--input)' }}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label style={{ color: 'var(--accent)' }} className="block text-sm font-medium mb-2">
                      Slug (URL path)
                    </label>
                    <input
                      type="text"
                      value={policy.slug}
                      onChange={(e) =>
                        setPolicies({
                          ...policies,
                          [policyType]: { ...policy, slug: e.target.value },
                        })
                      }
                      style={{ borderColor: 'var(--border)', color: 'var(--accent)', backgroundColor: 'var(--input)' }}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label style={{ color: 'var(--accent)' }} className="block text-sm font-medium mb-2">
                      Content
                    </label>
                    <textarea
                      value={policy.content}
                      onChange={(e) =>
                        setPolicies({
                          ...policies,
                          [policyType]: { ...policy, content: e.target.value },
                        })
                      }
                      style={{ borderColor: 'var(--border)', color: 'var(--accent)', backgroundColor: 'var(--input)' }}
                      className="w-full px-4 py-2 border rounded-lg font-mono text-sm h-96"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={{ color: 'var(--accent)' }} className="block text-sm font-medium mb-2">
                        Status
                      </label>
                      <select
                        value={policy.status}
                        onChange={(e) =>
                          setPolicies({
                            ...policies,
                            [policyType]: { ...policy, status: e.target.value as 'active' | 'archived' },
                          })
                        }
                        style={{ borderColor: 'var(--border)', color: 'var(--accent)', backgroundColor: 'var(--input)' }}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ color: 'var(--accent)' }} className="block text-sm font-medium mb-2">
                        Effective Date
                      </label>
                      <input
                        type="date"
                        value={policy.effectiveDate instanceof Date ? policy.effectiveDate.toISOString().split('T')[0] : ''}
                        onChange={(e) =>
                          setPolicies({
                            ...policies,
                            [policyType]: { ...policy, effectiveDate: new Date(e.target.value) },
                          })
                        }
                        style={{ borderColor: 'var(--border)', color: 'var(--accent)', backgroundColor: 'var(--input)' }}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => handleSavePolicy(policyType)}
                      disabled={saving}
                      style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Policy'}
                    </Button>
                    <Button
                      onClick={() => setEditingPolicy(null)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Preview URLs */}
        <Card style={{ borderColor: 'var(--border)', backgroundColor: 'var(--secondary)' }} className="p-6 mt-8">
          <h3 style={{ color: 'var(--foreground)' }} className="text-lg font-bold mb-4">
            Public Policy URLs
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(policies).map(([policyType, policy]) => (
              <div key={policyType}>
                <p style={{ color: 'var(--muted-foreground)' }} className="text-xs font-medium uppercase mb-2">
                  {policy.title}
                </p>
                <a
                  href={`/pages/${policy.slug === 'terms-conditions' ? 'terms-of-service' : policy.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono break-all hover:underline text-blue-600 dark:text-blue-400"
                >
                  /pages/{policy.slug === 'terms-conditions' ? 'terms-of-service' : policy.slug}
                </a>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Create Policy Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ borderColor: 'var(--border)', width: '90%', maxWidth: '500px' }} className="p-8 space-y-4">
            <h2 style={{ color: 'var(--foreground)' }} className="text-2xl font-bold">Create New Policy</h2>
            <input
              type="text"
              placeholder="Policy Title"
              value={newPolicy.title}
              onChange={(e) => setNewPolicy({ ...newPolicy, title: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--secondary)', color: 'var(--foreground)', boxSizing: 'border-box' }}
            />
            <input
              type="text"
              placeholder="URL Slug"
              value={newPolicy.slug}
              onChange={(e) => setNewPolicy({ ...newPolicy, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--secondary)', color: 'var(--foreground)', boxSizing: 'border-box' }}
            />
            <textarea
              placeholder="Policy Content"
              value={newPolicy.content}
              onChange={(e) => setNewPolicy({ ...newPolicy, content: e.target.value })}
              rows={6}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--secondary)', color: 'var(--foreground)', boxSizing: 'border-box' }}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreatePolicy} style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }} disabled={saving}>
                {saving ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
