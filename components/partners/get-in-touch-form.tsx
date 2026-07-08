'use client'

import React, { useState } from 'react'

export const PARTNERS_CONTACT_SUBJECTS = [
  'Partnerships',
  'Sponsorship',
  'Seeking Charity Support',
  'Community Feedback',
  'General Enquiry',
] as const

export type PartnersContactSubject = (typeof PARTNERS_CONTACT_SUBJECTS)[number]

interface GetInTouchFormProps {
  heading?: string
  subheading?: string
}

export function GetInTouchForm({
  heading = 'Get in touch',
  subheading = "Send us a message and we'll get back to you soon.",
}: GetInTouchFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '' as string,
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to submit')

      setSuccess(true)
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      id="get-in-touch"
      className="min-w-0 border-t border-[#e4e1da] pt-10 sm:pt-12 scroll-mt-24"
    >
      <p className="eyebrow text-muted-foreground mb-2">GET IN TOUCH</p>
      <h2 className="font-headline text-2xl sm:text-3xl font-bold text-foreground mb-2 break-words">
        {heading}
      </h2>
      <p className="font-body text-sm sm:text-base text-muted-foreground mb-6 max-w-[42rem]">
        {subheading}
      </p>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-body text-sm text-green-800 font-medium">
            Thank you — your message was sent successfully.
          </p>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="font-body text-sm text-red-800 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="min-w-0">
            <label htmlFor="git-name" className="block text-sm font-medium mb-1 font-body">
              Full name *
            </label>
            <input
              id="git-name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="git-email" className="block text-sm font-medium mb-1 font-body">
              Email *
            </label>
            <input
              id="git-email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="min-w-0">
            <label htmlFor="git-phone" className="block text-sm font-medium mb-1 font-body">
              Phone
            </label>
            <input
              id="git-phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="git-subject" className="block text-sm font-medium mb-1 font-body">
              Subject *
            </label>
            <select
              id="git-subject"
              name="subject"
              required
              value={formData.subject}
              onChange={handleChange}
              className="w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Select a subject</option>
              {PARTNERS_CONTACT_SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="min-w-0">
          <label htmlFor="git-message" className="block text-sm font-medium mb-1 font-body">
            Message *
          </label>
          <textarea
            id="git-message"
            name="message"
            required
            rows={5}
            value={formData.message}
            onChange={handleChange}
            className="w-full min-h-[120px] px-3 py-2 border border-[#e4e1da] rounded-lg font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black resize-y"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800 disabled:bg-neutral-400"
          >
            {loading ? 'Sending…' : 'Send message'}
          </button>
        </div>
      </form>
    </section>
  )
}
