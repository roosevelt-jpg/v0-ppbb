'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { SocialMediaLinks } from '@/components/social-media-links'
import {
  subscribeToGlobalSettings,
  DEFAULT_GLOBAL_SETTINGS,
  type GlobalSocialLinks,
} from '@/lib/platform-config'
import { PARTNERS_CONTACT_SUBJECTS } from '@/components/partners/get-in-touch-form'

interface ContactFormData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

interface ContactInfo {
  email: string
  phone: string
  address: string
  socialLinks: GlobalSocialLinks
}

export function ContactPageClient() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: DEFAULT_GLOBAL_SETTINGS.contactEmail,
    phone: DEFAULT_GLOBAL_SETTINGS.phone,
    address: DEFAULT_GLOBAL_SETTINGS.address,
    socialLinks: {},
  })

  useEffect(() => {
    return subscribeToGlobalSettings((s) => {
      setContactInfo({
        email: s.contactEmail || DEFAULT_GLOBAL_SETTINGS.contactEmail,
        phone: s.phone || DEFAULT_GLOBAL_SETTINGS.phone,
        address: s.address || DEFAULT_GLOBAL_SETTINGS.address,
        socialLinks: s.socialLinks || {},
      })
    })
  }, [])

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
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 w-full min-w-0">
          <div className="mb-8 sm:mb-12 text-center sm:text-left min-w-0">
            <p className="eyebrow text-muted-foreground mb-2">GET IN TOUCH</p>
            <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold mb-3 text-foreground break-words">
              Contact
            </h1>
            <p className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[42rem] mx-auto sm:mx-0">
              Have questions? Send us a message and we&apos;ll respond as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10 mb-10 sm:mb-12 min-w-0">
            <aside className="lg:col-span-2 space-y-6 min-w-0">
              <div>
                <h2 className="font-headline text-xl font-bold mb-4">Contact info</h2>
                <div className="space-y-4">
                  <div>
                    <p className="eyebrow text-muted-foreground mb-1">Address</p>
                    <p className="font-body text-sm text-foreground break-words">{contactInfo.address}</p>
                  </div>
                  <div>
                    <p className="eyebrow text-muted-foreground mb-1">Phone</p>
                    <a
                      href={`tel:${contactInfo.phone.replace(/\s+/g, '')}`}
                      className="font-body text-sm text-foreground hover:underline break-words"
                    >
                      {contactInfo.phone}
                    </a>
                  </div>
                  <div>
                    <p className="eyebrow text-muted-foreground mb-1">Email</p>
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="font-body text-sm text-foreground hover:underline break-all"
                    >
                      {contactInfo.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#e4e1da]">
                <p className="eyebrow text-muted-foreground mb-3">Follow us</p>
                {Object.keys(contactInfo.socialLinks || {}).length > 0 ? (
                  <SocialMediaLinks links={contactInfo.socialLinks} size="md" />
                ) : (
                  <p className="font-body text-xs text-muted-foreground">
                    No social links configured yet.
                  </p>
                )}
              </div>

              <div className="pt-2">
                <p className="font-body text-sm text-muted-foreground mb-3">
                  Looking for sponsorship or collaborations?
                </p>
                <Link
                  href="/partners"
                  className="inline-flex items-center justify-center min-h-[44px] px-5 py-3 bg-white text-black border border-[#e4e1da] rounded-lg font-body text-sm font-semibold hover:bg-neutral-50"
                >
                  Visit Partners
                </Link>
              </div>
            </aside>

            <div className="lg:col-span-3 min-w-0">
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="font-body text-sm text-green-800 font-medium">
                    Thank you! We&apos;ve received your message and will get back to you soon.
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-body text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <label htmlFor="name" className="block text-sm font-medium mb-1 font-body">
                      Full name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-body text-sm bg-white"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="email" className="block text-sm font-medium mb-1 font-body">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-body text-sm bg-white"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <label htmlFor="phone" className="block text-sm font-medium mb-1 font-body">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-body text-sm bg-white"
                      placeholder="+971 50 000 0000"
                    />
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="subject" className="block text-sm font-medium mb-1 font-body">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-body text-sm bg-white"
                      required
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
                  <label htmlFor="message" className="block text-sm font-medium mb-1 font-body">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-3 py-2 border border-[#e4e1da] rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-y min-h-[120px] font-body text-sm bg-white"
                    placeholder="Tell us how we can help…"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                  <p className="font-body text-xs text-muted-foreground">
                    * Required. We typically respond within 24 hours.
                  </p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto min-h-[44px] px-6 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800 disabled:bg-neutral-400 transition-colors"
                  >
                    {loading ? 'Sending…' : 'Send message'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="rounded-lg border border-[#e4e1da] bg-[#f7f6f2] p-6 sm:p-8 text-center sm:text-left">
            <h2 className="font-headline text-2xl font-bold mb-2 text-foreground">
              Want to join our community?
            </h2>
            <p className="font-body text-sm sm:text-base text-muted-foreground mb-5 max-w-[36rem]">
              Become a member and start making a difference today.
            </p>
            <Link
              href="/join"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800"
            >
              Join now
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
