'use client'

import React, { useState, useEffect } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore'
import { EUDataProtectionPolicy } from '@/lib/types'
import { Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

export default function EUDataProtectionAdmin() {
  const [policy, setPolicy] = useState<EUDataProtectionPolicy | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('draft')
  const [requiresAcceptance, setRequiresAcceptance] = useState(true)

  // Load policy on mount
  useEffect(() => {
    const policyRef = doc(db, 'euDataProtectionPolicy', 'current')
    const unsubscribe = onSnapshot(policyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as EUDataProtectionPolicy
        setPolicy(data)
        setTitle(data.title)
        setContent(data.content)
        setStatus(data.status)
        setRequiresAcceptance(data.requiresAcceptance)
      } else {
        // Initialize with default policy if none exists
        setTitle('EU Data Protection Policy')
        setContent('Please read and accept our data protection policy to continue using this website.')
        setStatus('draft')
        setRequiresAcceptance(true)
      }
      setLoading(false)
    }, (error) => {
      console.error('[v0] Error loading policy:', error)
      setLoading(false)
      setMessage({ type: 'error', text: 'Error loading policy' })
    })

    return () => unsubscribe()
  }, [])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setMessage({ type: 'error', text: 'Title and content are required' })
      return
    }

    setSaving(true)
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        setMessage({ type: 'error', text: 'You must be logged in to update the policy' })
        setSaving(false)
        return
      }

      const newVersion = (policy?.version || 0) + 1
      const policyData: EUDataProtectionPolicy = {
        id: 'current',
        title: title.trim(),
        content: content.trim(),
        version: newVersion,
        status: status,
        effectiveDate: policy?.effectiveDate || new Date(),
        lastUpdated: new Date(),
        createdBy: policy?.createdBy || currentUser.email || 'admin',
        updatedBy: currentUser.email || 'admin',
        requiresAcceptance: requiresAcceptance,
        acceptanceRequired: requiresAcceptance,
      }

      await setDoc(doc(db, 'euDataProtectionPolicy', 'current'), policyData)
      
      setMessage({ 
        type: 'success', 
        text: `Policy updated successfully. Version ${newVersion} is now active.` 
      })
      
      // Clear success message after 5 seconds
      setTimeout(() => setMessage(null), 5000)
    } catch (error) {
      console.error('[v0] Error saving policy:', error)
      setMessage({ type: 'error', text: 'Error saving policy. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    setStatus('active')
    setSaving(true)
    
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        setMessage({ type: 'error', text: 'You must be logged in' })
        setSaving(false)
        return
      }

      const newVersion = (policy?.version || 0) + 1
      const policyData: EUDataProtectionPolicy = {
        id: 'current',
        title: title.trim(),
        content: content.trim(),
        version: newVersion,
        status: 'active',
        effectiveDate: policy?.effectiveDate || new Date(),
        lastUpdated: new Date(),
        createdBy: policy?.createdBy || currentUser.email || 'admin',
        updatedBy: currentUser.email || 'admin',
        requiresAcceptance: requiresAcceptance,
        acceptanceRequired: requiresAcceptance,
      }

      await setDoc(doc(db, 'euDataProtectionPolicy', 'current'), policyData)
      setMessage({ type: 'success', text: 'Policy published successfully!' })
      
      setTimeout(() => setMessage(null), 5000)
    } catch (error) {
      console.error('[v0] Error publishing policy:', error)
      setMessage({ type: 'error', text: 'Error publishing policy' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title="EU Data Protection Policy" subtitle="Manage GDPR compliance policy">
        <div className="p-8">
          <p style={{ color: '#888888' }}>Loading policy...</p>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title="EU Data Protection Policy" subtitle="Manage GDPR compliance and user acceptance tracking">
      <div className="p-8 space-y-8">
        {/* Status Message */}
        {message && (
          <Card 
            style={{ 
              borderColor: message.type === 'success' ? '#10b981' : '#ef4444',
              backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2'
            }}
            className="p-4 flex items-center gap-3"
          >
            {message.type === 'success' ? (
              <CheckCircle style={{ color: '#10b981' }} className="h-5 w-5" />
            ) : (
              <AlertCircle style={{ color: '#ef4444' }} className="h-5 w-5" />
            )}
            <p style={{ color: message.type === 'success' ? '#10b981' : '#ef4444' }}>
              {message.text}
            </p>
          </Card>
        )}

        {/* Policy Form */}
        <div className="space-y-6">
          <Card style={{ borderColor: '#e4e1da' }} className="p-8">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#111111' }}>
                  Policy Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="EU Data Protection Policy"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e4e1da',
                    borderRadius: '6px',
                    backgroundColor: '#f7f6f2',
                    color: '#111111',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#111111' }}>
                  Policy Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter the full EU Data Protection Policy text..."
                  rows={12}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e4e1da',
                    borderRadius: '6px',
                    backgroundColor: '#f7f6f2',
                    color: '#111111',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                />
              </div>

              {/* Requires Acceptance Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={requiresAcceptance}
                  onChange={(e) => setRequiresAcceptance(e.target.checked)}
                  id="requires-acceptance"
                  style={{ cursor: 'pointer' }}
                />
                <label 
                  htmlFor="requires-acceptance" 
                  style={{ color: '#111111', cursor: 'pointer' }}
                  className="font-medium"
                >
                  Require users to accept this policy before accessing the website
                </label>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#111111' }}>
                  Policy Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'active' | 'archived')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e4e1da',
                    borderRadius: '6px',
                    backgroundColor: '#f7f6f2',
                    color: '#111111',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="draft">Draft (Not visible to users)</option>
                  <option value="active">Active (Visible & Required)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Policy Info */}
              {policy && (
                <div style={{ backgroundColor: '#f9f8f5', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #111111' }}>
                  <p style={{ fontSize: '14px', color: '#666666', margin: 0 }}>
                    <strong>Version:</strong> {policy.version}
                  </p>
                  <p style={{ fontSize: '14px', color: '#666666', margin: '4px 0 0 0' }}>
                    <strong>Last Updated:</strong> {new Date(policy.lastUpdated).toLocaleString()}
                  </p>
                  <p style={{ fontSize: '14px', color: '#666666', margin: '4px 0 0 0' }}>
                    <strong>Status:</strong> {policy.status}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-between">
            <Button
              onClick={() => window.location.reload()}
              variant="ghost"
              disabled={saving}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                style={{ backgroundColor: '#f0f0f0', color: '#111111' }}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button
                onClick={handlePublish}
                disabled={saving}
                style={{ backgroundColor: '#111111', color: '#f7f6f2' }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {saving ? 'Publishing...' : 'Publish & Activate'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  )
}
