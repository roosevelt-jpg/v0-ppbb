'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Policy } from '@/lib/types'
import { POLICY_TEMPLATES } from '@/lib/policy-manager'
import { Save, RefreshCw } from 'lucide-react'

export default function AdminPolicies() {
  const [policies, setPolicies] = useState<Record<string, Policy>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<string | null>(null)

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
        
        setPolicies(policiesData)
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

  if (loading) {
    return (
      <>
        <div className="p-8">
          <p style={{ color: '#888888' }}>Loading policies...</p>
        </div>
      </>
    )
  }

  return (
    <>
      
      <div className="p-8">
        <div className="space-y-6">
          {Object.entries(policies).map(([policyType, policy]) => (
            <Card 
              key={policyType} 
              style={{ borderColor: '#e4e1da' }}
              className="p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 style={{ color: '#111111' }} className="text-xl font-bold">
                    {policy.title}
                  </h3>
                  <p style={{ color: '#888888' }} className="text-sm mt-1">
                    Slug: /{policy.slug} • Version: {policy.version}
                  </p>
                  <p style={{ color: '#888888' }} className="text-xs mt-2">
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
                <div className="mt-6 space-y-4 pt-6 border-t" style={{ borderColor: '#e4e1da' }}>
                  <div>
                    <label style={{ color: '#333333' }} className="block text-sm font-medium mb-2">
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
                      style={{ borderColor: '#e4e1da', color: '#333333', backgroundColor: '#ffffff' }}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label style={{ color: '#333333' }} className="block text-sm font-medium mb-2">
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
                      style={{ borderColor: '#e4e1da', color: '#333333', backgroundColor: '#ffffff' }}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label style={{ color: '#333333' }} className="block text-sm font-medium mb-2">
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
                      style={{ borderColor: '#e4e1da', color: '#333333', backgroundColor: '#ffffff' }}
                      className="w-full px-4 py-2 border rounded-lg font-mono text-sm h-96"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={{ color: '#333333' }} className="block text-sm font-medium mb-2">
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
                        style={{ borderColor: '#e4e1da', color: '#333333', backgroundColor: '#ffffff' }}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ color: '#333333' }} className="block text-sm font-medium mb-2">
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
                        style={{ borderColor: '#e4e1da', color: '#333333', backgroundColor: '#ffffff' }}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => handleSavePolicy(policyType)}
                      disabled={saving}
                      style={{ backgroundColor: '#111111', color: '#ffffff' }}
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
        <Card style={{ borderColor: '#e4e1da' }} className="p-6 mt-8 bg-[#f7f6f2]">
          <h3 style={{ color: '#111111' }} className="text-lg font-bold mb-4">
            Public Policy URLs
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(policies).map(([policyType, policy]) => (
              <div key={policyType}>
                <p style={{ color: '#888888' }} className="text-xs font-medium uppercase mb-2">
                  {policy.title}
                </p>
                <a
                  href={`/policies/${policy.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#1565C0' }}
                  className="text-sm font-mono break-all hover:underline"
                >
                  /policies/{policy.slug}
                </a>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
