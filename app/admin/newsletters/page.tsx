'use client'

import React, { useState, useEffect } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { db } from '@/lib/firebase'
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Send, Clock, CheckCircle, Trash2, Edit2, Eye } from 'lucide-react'
import { Newsletter, NewsletterTemplate } from '@/lib/types'
import { useAdminAudit } from '@/lib/use-admin-audit'

const NEWSLETTER_TEMPLATES: NewsletterTemplate[] = [
  {
    id: 'template-1',
    title: 'Classic Newsletter',
    subject: 'Passive Blessings Newsletter',
    content: '',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #111111; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Passive Blessings</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.8;">Newsletter</p>
        </div>
        <div style="padding: 30px; background: #fafafa;">
          <div id="content-placeholder" style="min-height: 300px; color: #333;">
            [Newsletter content will appear here]
          </div>
        </div>
        <div style="background: #111111; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2026 Passive Blessings. All rights reserved.</p>
        </div>
      </div>
    `,
    category: 'classic',
    createdAt: new Date(),
  },
  {
    id: 'template-2',
    title: 'Modern Newsletter',
    subject: 'Updates from Passive Blessings',
    content: '',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #111111 0%, #333333 100%); color: white; padding: 40px 30px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 600;">Passive Blessings</h1>
          <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;">Empowering through compassion</p>
        </div>
        <div style="padding: 40px 30px; background: white;">
          <div id="content-placeholder" style="min-height: 300px; color: #333; line-height: 1.6;">
            [Newsletter content will appear here]
          </div>
        </div>
        <div style="background: #f5f5f5; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; color: #666; font-size: 12px;">© 2026 Passive Blessings</p>
        </div>
      </div>
    `,
    category: 'modern',
    createdAt: new Date(),
  },
  {
    id: 'template-3',
    title: 'Minimal Newsletter',
    subject: 'News from Passive Blessings',
    content: '',
    html: `
      <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 30px;">
        <h2 style="margin: 0 0 30px 0; font-size: 24px; color: #111111; text-align: center;">Passive Blessings</h2>
        <div id="content-placeholder" style="min-height: 300px; color: #333; line-height: 1.8; font-size: 14px;">
          [Newsletter content will appear here]
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #999;">
          <p style="margin: 0;">Passive Blessings © 2026</p>
        </div>
      </div>
    `,
    category: 'minimal',
    createdAt: new Date(),
  },
  {
    id: 'template-4',
    title: 'Highlight Newsletter',
    subject: 'Feature from Passive Blessings',
    content: '',
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #111111; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">Passive Blessings</h1>
        </div>
        <div style="background: #fff3cd; padding: 30px; border-left: 5px solid #ffc107;">
          <h2 style="margin: 0 0 15px 0; color: #856404;">Featured Story</h2>
          <div id="content-placeholder" style="min-height: 250px; color: #333; line-height: 1.6;">
            [Newsletter content will appear here]
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">© 2026 Passive Blessings</p>
        </div>
      </div>
    `,
    category: 'highlight',
    createdAt: new Date(),
  },
]

export default function AdminNewslettersPage() {
  const audit = useAdminAudit()
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('template-1')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [sendOption, setSendOption] = useState<'now' | 'schedule'>('now')
  const [successMessage, setSuccessMessage] = useState('')
  const [recipientCount, setRecipientCount] = useState(0)

  // Load newsletters
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'newsletters'), (snapshot) => {
      const nl = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        sentAt: doc.data().sentAt?.toDate?.() || null,
        scheduledFor: doc.data().scheduledFor?.toDate?.() || null,
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as Newsletter[]
      setNewsletters(nl.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
    })

    return () => unsubscribe()
  }, [])

  // Get recipient count
  useEffect(() => {
    const getRecipientCount = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, 'users')))
        setRecipientCount(snapshot.size)
      } catch (error) {
        console.error('[v0] Error getting recipient count:', error)
      }
    }
    getRecipientCount()
  }, [])

  const handleCreateNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject || !content) {
      alert('Please fill in subject and content')
      return
    }

    setLoading(true)
    try {
      const template = NEWSLETTER_TEMPLATES.find(t => t.id === selectedTemplate)
      const scheduledTime = sendOption === 'schedule' ? new Date(scheduleDate) : null

      const ref = await addDoc(collection(db, 'newsletters'), {
        title: subject,
        subject,
        content,
        template: template?.category || 'classic',
        status: sendOption === 'now' ? 'sent' : 'scheduled',
        sentAt: sendOption === 'now' ? new Date() : null,
        scheduledFor: scheduledTime,
        recipientCount,
        openedCount: 0,
        clickedCount: 0,
        createdBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      audit({
        actionType: 'create',
        action: `${sendOption === 'now' ? 'Sent' : 'Scheduled'} newsletter: ${subject}`,
        entityType: 'content',
        entityId: ref.id,
        entityName: subject,
        status: 'success',
      })

      setSuccessMessage(`Newsletter ${sendOption === 'now' ? 'sent' : 'scheduled'} successfully!`)
      setTimeout(() => setSuccessMessage(''), 3000)
      
      // Reset form
      setSubject('')
      setContent('')
      setScheduleDate('')
      setSendOption('now')
      setShowForm(false)
    } catch (error) {
      console.error('[v0] Error creating newsletter:', error)
      alert('Error creating newsletter')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNewsletter = async (id: string) => {
    if (confirm('Are you sure you want to delete this newsletter?')) {
      try {
        const item = newsletters.find((n) => n.id === id)
        await deleteDoc(doc(db, 'newsletters', id))
        audit({
          actionType: 'delete',
          action: `Deleted newsletter: ${item?.subject || item?.title || id}`,
          entityType: 'content',
          entityId: id,
          entityName: item?.subject || item?.title,
          status: 'success',
        })
      } catch (error) {
        console.error('[v0] Error deleting newsletter:', error)
        alert('Error deleting newsletter')
      }
    }
  }

  return (
    <AdminPageLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Newsletters</h1>
            <p className="text-neutral-600 mt-2">Create and manage email campaigns for all users</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2"
            style={{ backgroundColor: '#111111' }}
          >
            <Plus className="w-4 h-4" />
            Create Newsletter
          </Button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <Card className="p-6 mb-8 border border-neutral-200">
            <h2 className="text-xl font-semibold mb-6">Create New Newsletter</h2>

            {/* Template Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-3">Select Template</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {NEWSLETTER_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-3 rounded-lg border-2 transition ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="font-medium text-sm text-neutral-900">{template.title}</div>
                    <div className="text-xs text-neutral-600 mt-1">{template.category}</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateNewsletter} className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Newsletter subject..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Content</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your newsletter content here..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                />
              </div>

              {/* Send Options */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">Send Options</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="sendOption"
                      value="now"
                      checked={sendOption === 'now'}
                      onChange={() => setSendOption('now')}
                    />
                    <span className="text-sm">Send Now</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="sendOption"
                      value="schedule"
                      checked={sendOption === 'schedule'}
                      onChange={() => setSendOption('schedule')}
                    />
                    <span className="text-sm">Schedule</span>
                  </label>
                </div>

                {sendOption === 'schedule' && (
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="mt-3 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* Recipient Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  This newsletter will be sent to <strong>{recipientCount}</strong> users
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  style={{ backgroundColor: '#111111' }}
                  className="text-white"
                >
                  {loading ? 'Processing...' : sendOption === 'now' ? 'Send Newsletter' : 'Schedule Newsletter'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Newsletters List */}
        <div className="space-y-3">
          {newsletters.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 rounded-lg">
              <p className="text-neutral-600">No newsletters yet. Create your first one!</p>
            </div>
          ) : (
            newsletters.map(nl => (
              <Card key={nl.id} className="p-4 flex items-center justify-between border border-neutral-200">
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900">{nl.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-sm text-neutral-600">
                    <span>Recipients: {nl.recipientCount}</span>
                    <span>•</span>
                    <span>Opened: {nl.openedCount} ({nl.recipientCount > 0 ? Math.round(nl.openedCount / nl.recipientCount * 100) : 0}%)</span>
                    <span>•</span>
                    <span>Clicked: {nl.clickedCount}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={`${
                      nl.status === 'sent'
                        ? 'bg-green-100 text-green-800'
                        : nl.status === 'scheduled'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {nl.status === 'sent' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {nl.status === 'scheduled' && <Clock className="w-3 h-3 mr-1" />}
                    {nl.status.charAt(0).toUpperCase() + nl.status.slice(1)}
                  </Badge>
                  <button
                    onClick={() => handleDeleteNewsletter(nl.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminPageLayout>
  )
}
