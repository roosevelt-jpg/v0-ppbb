'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Plus, Send, Clock, CheckCircle, Trash2, Eye, Sparkles, X, RefreshCw } from 'lucide-react'
import { Newsletter } from '@/lib/types'
import { useAdminAudit } from '@/lib/use-admin-audit'
import { NEWSLETTER_TEMPLATE_OPTIONS } from '@/lib/newsletter-template-options'
import {
  BUTTON_BASE,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  BUTTON_DANGER,
  BUTTON_SMALL,
  INPUT_STYLE,
  TEXTAREA_STYLE,
  TEXT_HEADING,
  TEXT_LABEL,
  CARD_BASE,
} from '@/lib/admin-design-system'
import { AdminTableScroll } from '@/components/admin-table'
import { format } from 'date-fns'

type AiField = 'subject' | 'content' | 'subtitle' | 'seoTitle' | 'metaDescription' | 'ctaText'

/** Template selector cards — allow wrapped text (FILTER_PILL_* uses whitespace-nowrap). */
const TEMPLATE_CARD_BASE = `${BUTTON_BASE} flex flex-col items-stretch justify-start gap-1.5 p-4 min-h-[5.5rem] h-full w-full min-w-0 max-w-full text-left rounded-lg border whitespace-normal shadow-none overflow-hidden`

function templateCardClass(selected: boolean): string {
  return selected
    ? `${TEMPLATE_CARD_BASE} bg-black text-white border-black hover:bg-neutral-800 active:bg-neutral-900`
    : `${TEMPLATE_CARD_BASE} bg-white text-black border-black hover:bg-neutral-50 active:bg-neutral-100`
}

function NewslettersSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-neutral-200 rounded-lg w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[5.5rem] bg-neutral-200 rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-neutral-200 rounded-lg" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-neutral-200 rounded-lg" />
      ))}
    </div>
  )
}

function AiAssistButton({
  field,
  label,
  onGenerate,
  disabled,
}: {
  field: AiField
  label: string
  onGenerate: (field: AiField) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onGenerate(field)}
      disabled={disabled}
      className={`${BUTTON_SECONDARY} ${BUTTON_SMALL} gap-1.5 shrink-0`}
      title={`Generate ${label} with AI`}
    >
      <Sparkles className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">AI</span>
    </button>
  )
}

export default function AdminNewslettersPage() {
  const audit = useAdminAudit()
  const { firebaseUser } = useAuth()
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('classic')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [sendOption, setSendOption] = useState<'now' | 'schedule'>('now')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [recipientCount, setRecipientCount] = useState(0)
  const [recipientLoading, setRecipientLoading] = useState(true)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiField, setAiField] = useState<AiField | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')

  const getToken = useCallback(async () => {
    return (await firebaseUser?.getIdToken()) || null
  }, [firebaseUser])

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'newsletters'),
      (snapshot) => {
        const nl = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() || new Date(),
          sentAt: d.data().sentAt?.toDate?.() || null,
          scheduledFor: d.data().scheduledFor?.toDate?.() || null,
          updatedAt: d.data().updatedAt?.toDate?.() || new Date(),
        })) as Newsletter[]
        setNewsletters(nl.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
        setListLoading(false)
      },
      () => setListLoading(false)
    )
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    async function loadRecipients() {
      if (!firebaseUser) {
        setRecipientLoading(false)
        return
      }
      setRecipientLoading(true)
      try {
        const token = await getToken()
        if (!token) return
        const res = await fetch('/api/admin/newsletters/recipients', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setRecipientCount(data.count ?? 0)
        }
      } catch (error) {
        console.error('[v0] Error getting recipient count:', error)
      } finally {
        setRecipientLoading(false)
      }
    }
    loadRecipients()
  }, [firebaseUser, getToken])

  const resetForm = () => {
    setSubject('')
    setContent('')
    setSubtitle('')
    setSeoTitle('')
    setMetaDescription('')
    setCtaText('')
    setCtaUrl('')
    setScheduleDate('')
    setSendOption('now')
    setSelectedTemplate('classic')
  }

  const handleSendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !content.trim()) {
      setErrorMessage('Please fill in subject and content.')
      return
    }
    if (sendOption === 'schedule' && !scheduleDate) {
      setErrorMessage('Please choose a schedule date and time.')
      return
    }

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const token = await getToken()
      if (!token) {
        setErrorMessage('You must be signed in as an admin.')
        return
      }

      const res = await fetch('/api/admin/newsletters/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          content,
          template: selectedTemplate,
          sendOption,
          scheduleDate: sendOption === 'schedule' ? scheduleDate : undefined,
          subtitle,
          seoTitle,
          metaDescription,
          ctaText,
          ctaUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to send newsletter')
        audit({
          actionType: 'create',
          action: `Failed newsletter send: ${subject}`,
          entityType: 'content',
          entityName: subject,
          status: 'failure',
        })
        return
      }

      audit({
        actionType: 'create',
        action: `${sendOption === 'now' ? 'Sent' : 'Scheduled'} newsletter: ${subject}`,
        entityType: 'content',
        entityId: data.newsletterId,
        entityName: subject,
        status: 'success',
      })

      setSuccessMessage(
        sendOption === 'now'
          ? data.message || 'Newsletter sent successfully!'
          : 'Newsletter scheduled successfully!'
      )
      setTimeout(() => setSuccessMessage(''), 5000)
      resetForm()
      setShowForm(false)
    } catch (error) {
      console.error('[v0] Error sending newsletter:', error)
      setErrorMessage('Error sending newsletter. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async () => {
    setPreviewLoading(true)
    setPreviewOpen(true)
    setPreviewHtml('')
    try {
      const token = await getToken()
      if (!token) return
      const res = await fetch('/api/admin/newsletters/preview', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: subject || 'Newsletter Preview',
          content: content || 'Your newsletter content will appear here.',
          template: selectedTemplate,
          subtitle,
          ctaText,
          ctaUrl,
        }),
      })
      const data = await res.json()
      if (res.ok) setPreviewHtml(data.html)
      else setPreviewHtml('<p style="padding:24px;color:#666;">Failed to load preview.</p>')
    } catch {
      setPreviewHtml('<p style="padding:24px;color:#666;">Failed to load preview.</p>')
    } finally {
      setPreviewLoading(false)
    }
  }

  const openAiModal = (field: AiField) => {
    setAiField(field)
    setAiPrompt('')
    setAiSuggestion('')
    setAiModalOpen(true)
  }

  const handleAiGenerate = async () => {
    if (!aiField || !aiPrompt.trim()) return
    setAiLoading(true)
    setAiSuggestion('')
    try {
      const token = await getToken()
      if (!token) return
      const res = await fetch('/api/admin/newsletters/ai-generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field: aiField,
          prompt: aiPrompt,
          context: { subject, content, subtitle },
        }),
      })
      const data = await res.json()
      if (res.ok) setAiSuggestion(data.suggestion || '')
      else setAiSuggestion(data.error || 'Generation failed.')
    } catch {
      setAiSuggestion('Generation failed. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const acceptAiSuggestion = () => {
    if (!aiField || !aiSuggestion) return
    const setters: Record<AiField, (v: string) => void> = {
      subject: setSubject,
      content: setContent,
      subtitle: setSubtitle,
      seoTitle: setSeoTitle,
      metaDescription: setMetaDescription,
      ctaText: setCtaText,
    }
    setters[aiField](aiSuggestion)
    setAiModalOpen(false)
  }

  const handleDeleteNewsletter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) return
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
      setErrorMessage('Error deleting newsletter')
    }
  }

  const sentHistory = newsletters.filter((n) => n.status === 'sent' || n.sendStatus === 'sent' || n.sendStatus === 'partial')

  return (
    <AdminPageLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className={TEXT_HEADING}>Newsletters</h1>
            <p className="text-neutral-600 mt-2 text-sm md:text-base break-words">
              Create and send email campaigns to registered members, volunteers, businesses, and sponsors
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className={`${BUTTON_PRIMARY} gap-2 w-full sm:w-auto`}
          >
            <Plus className="w-4 h-4" />
            Create Newsletter
          </button>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 text-sm">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 text-sm">
            {errorMessage}
          </div>
        )}

        {listLoading && !showForm ? (
          <NewslettersSkeleton />
        ) : (
          <>
            {/* Create Form */}
            {showForm && (
              <Card className={`${CARD_BASE} mb-8 min-w-0 overflow-hidden`}>
                <h2 className="font-headline text-xl md:text-2xl font-bold text-neutral-900 mb-6">
                  Create New Newsletter
                </h2>

                {/* Template Selection */}
                <div className="mb-6 min-w-0">
                  <label className={`${TEXT_LABEL} block mb-3`}>
                    <span className="font-eyebrow text-xs uppercase tracking-wider text-neutral-500">
                      Template
                    </span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-0 auto-rows-fr [&>*]:min-w-0">
                    {NEWSLETTER_TEMPLATE_OPTIONS.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setSelectedTemplate(template.id)}
                        className={templateCardClass(selectedTemplate === template.id)}
                        aria-pressed={selectedTemplate === template.id}
                      >
                        <span className="block font-medium text-sm w-full min-w-0 break-words leading-snug">
                          {template.title}
                        </span>
                        <span className="block text-xs w-full min-w-0 break-words leading-relaxed opacity-80">
                          {template.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSendNewsletter} className="space-y-5 min-w-0">
                  {/* Subject */}
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                      <label className={`${TEXT_LABEL} min-w-0 shrink`}>Subject Line</label>
                      <AiAssistButton field="subject" label="subject" onGenerate={openAiModal} disabled={loading} />
                    </div>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Newsletter subject..."
                      className={INPUT_STYLE}
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                      <label className={`${TEXT_LABEL} min-w-0 shrink`}>Subtitle (optional)</label>
                      <AiAssistButton field="subtitle" label="subtitle" onGenerate={openAiModal} disabled={loading} />
                    </div>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Preview line shown below the subject..."
                      className={INPUT_STYLE}
                    />
                  </div>

                  {/* Content */}
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                      <label className={`${TEXT_LABEL} min-w-0 shrink`}>Content</label>
                      <AiAssistButton field="content" label="content" onGenerate={openAiModal} disabled={loading} />
                    </div>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your newsletter content here..."
                      className={TEXTAREA_STYLE}
                      rows={6}
                    />
                  </div>

                  {/* SEO fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                        <label className={`${TEXT_LABEL} min-w-0 shrink`}>SEO Title (optional)</label>
                        <AiAssistButton field="seoTitle" label="SEO title" onGenerate={openAiModal} disabled={loading} />
                      </div>
                      <input
                        type="text"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        placeholder="SEO title..."
                        className={INPUT_STYLE}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                        <label className={`${TEXT_LABEL} min-w-0 shrink`}>Meta Description (optional)</label>
                        <AiAssistButton
                          field="metaDescription"
                          label="meta description"
                          onGenerate={openAiModal}
                          disabled={loading}
                        />
                      </div>
                      <input
                        type="text"
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder="Meta description..."
                        className={INPUT_STYLE}
                      />
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                        <label className={`${TEXT_LABEL} min-w-0 shrink`}>CTA Button Text (optional)</label>
                        <AiAssistButton field="ctaText" label="CTA text" onGenerate={openAiModal} disabled={loading} />
                      </div>
                      <input
                        type="text"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        placeholder="e.g. Learn More"
                        className={INPUT_STYLE}
                      />
                    </div>
                    <div className="min-w-0">
                      <label className={`${TEXT_LABEL} block mb-2`}>CTA Link URL (optional)</label>
                      <input
                        type="url"
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                        placeholder="https://..."
                        className={INPUT_STYLE}
                      />
                    </div>
                  </div>

                  {/* Send Options */}
                  <div>
                    <label className={`${TEXT_LABEL} block mb-3`}>Send Options</label>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sendOption"
                          value="now"
                          checked={sendOption === 'now'}
                          onChange={() => setSendOption('now')}
                          className="accent-black"
                        />
                        <span className="text-sm">Send Now</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sendOption"
                          value="schedule"
                          checked={sendOption === 'schedule'}
                          onChange={() => setSendOption('schedule')}
                          className="accent-black"
                        />
                        <span className="text-sm">Schedule</span>
                      </label>
                    </div>

                    {sendOption === 'schedule' && (
                      <input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className={`${INPUT_STYLE} mt-3 max-w-xs`}
                      />
                    )}
                  </div>

                  {/* Recipient Info */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                    {recipientLoading ? (
                      <div className="h-4 bg-neutral-200 rounded w-2/3 animate-pulse" />
                    ) : (
                      <p className="text-sm text-neutral-800 break-words">
                        This newsletter will be sent to{' '}
                        <strong>{recipientCount.toLocaleString()}</strong> registered users (excluding
                        unsubscribed).
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        resetForm()
                      }}
                      className={`${BUTTON_SECONDARY} w-full sm:w-auto`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handlePreview}
                      disabled={previewLoading}
                      className={`${BUTTON_SECONDARY} gap-2 w-full sm:w-auto`}
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`${BUTTON_PRIMARY} gap-2 w-full sm:w-auto`}
                    >
                      <Send className="w-4 h-4" />
                      {loading
                        ? 'Processing...'
                        : sendOption === 'now'
                          ? 'Send Newsletter'
                          : 'Schedule Newsletter'}
                    </button>
                  </div>
                </form>
              </Card>
            )}

            {/* Send History */}
            <div className="mb-8">
              <h2 className="font-headline text-lg md:text-xl font-bold text-neutral-900 mb-4">
                Send History
              </h2>
              {listLoading ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-neutral-200 rounded-lg" />
                  ))}
                </div>
              ) : sentHistory.length === 0 ? (
                <div className="text-center py-8 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="text-neutral-600 text-sm">No newsletters sent yet.</p>
                </div>
              ) : (
                <AdminTableScroll className="rounded-lg border border-neutral-200">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-neutral-700">Subject</th>
                        <th className="text-left px-4 py-3 font-medium text-neutral-700">Date Sent</th>
                        <th className="text-left px-4 py-3 font-medium text-neutral-700">Recipients</th>
                        <th className="text-left px-4 py-3 font-medium text-neutral-700">Status</th>
                        <th className="text-right px-4 py-3 font-medium text-neutral-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sentHistory.map((nl) => (
                        <tr key={nl.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                          <td className="px-4 py-3 font-medium text-neutral-900 max-w-[200px] sm:max-w-none break-words">
                            {nl.subject || nl.title}
                          </td>
                          <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                            {nl.sentAt ? format(nl.sentAt, 'MMM d, yyyy h:mm a') : '—'}
                          </td>
                          <td className="px-4 py-3 text-neutral-600">{nl.recipientCount ?? 0}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                nl.sendStatus === 'partial'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : nl.sendStatus === 'failed'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {nl.sendStatus === 'partial' && <Clock className="w-3 h-3" />}
                              {(nl.sendStatus === 'sent' || !nl.sendStatus) && <CheckCircle className="w-3 h-3" />}
                              {nl.sendStatus === 'failed' ? 'Failed' : nl.sendStatus === 'partial' ? 'Partial' : 'Sent'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteNewsletter(nl.id)}
                              className={`${BUTTON_DANGER} ${BUTTON_SMALL} inline-flex gap-1`}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </AdminTableScroll>
              )}
            </div>

            {/* All newsletters (drafts / scheduled) */}
            <div>
              <h2 className="font-headline text-lg md:text-xl font-bold text-neutral-900 mb-4">
                Drafts &amp; Scheduled
              </h2>
              {newsletters.filter((n) => n.status !== 'sent').length === 0 ? (
                <div className="text-center py-8 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="text-neutral-600 text-sm">No drafts or scheduled newsletters.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {newsletters
                    .filter((n) => n.status !== 'sent')
                    .map((nl) => (
                      <Card key={nl.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-neutral-200">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-neutral-900 truncate">{nl.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-neutral-600">
                            <span className="capitalize">{nl.status}</span>
                            {nl.scheduledFor && (
                              <>
                                <span>•</span>
                                <span>{format(nl.scheduledFor, 'MMM d, yyyy h:mm a')}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteNewsletter(nl.id)}
                          className={`${BUTTON_DANGER} ${BUTTON_SMALL} gap-1 shrink-0`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl min-w-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
              <h3 className="font-headline text-lg font-bold">Email Preview</h3>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className={`${BUTTON_SECONDARY} ${BUTTON_SMALL} !p-2 min-w-[44px]`}
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-neutral-100">
              {previewLoading ? (
                <div className="animate-pulse h-96 bg-neutral-200 rounded" />
              ) : (
                <iframe
                  title="Newsletter preview"
                  srcDoc={previewHtml}
                  className="w-full min-h-[400px] bg-white rounded border border-neutral-200"
                  sandbox="allow-same-origin"
                />
              )}
            </div>
            <div className="px-4 py-3 border-t border-neutral-200 flex justify-end">
              <button type="button" onClick={() => setPreviewOpen(false)} className={BUTTON_PRIMARY}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assist Modal */}
      {aiModalOpen && aiField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl min-w-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
              <h3 className="font-headline text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </h3>
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className={`${BUTTON_SECONDARY} ${BUTTON_SMALL} !p-2 min-w-[44px]`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div>
                <label className={`${TEXT_LABEL} block mb-2`}>What should this {aiField} be about?</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Announce this week's Thursday distribution event"
                  className={TEXTAREA_STYLE}
                  rows={3}
                />
              </div>
              {aiSuggestion && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 min-w-0 overflow-hidden">
                  <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2 font-eyebrow">Suggestion</p>
                  <p className="text-sm text-neutral-800 whitespace-pre-wrap break-words">{aiSuggestion}</p>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-neutral-200 flex flex-col-reverse sm:flex-row gap-2 justify-end">
              <button type="button" onClick={() => setAiModalOpen(false)} className={BUTTON_SECONDARY}>
                Cancel
              </button>
              {aiSuggestion ? (
                <>
                  <button
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={aiLoading}
                    className={`${BUTTON_SECONDARY} gap-2`}
                  >
                    <RefreshCw className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                  <button type="button" onClick={acceptAiSuggestion} className={BUTTON_PRIMARY}>
                    Accept
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className={`${BUTTON_PRIMARY} gap-2`}
                >
                  {aiLoading ? 'Generating...' : 'Generate'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  )
}
