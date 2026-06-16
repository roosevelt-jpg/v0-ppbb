'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { SocialMediaLinks } from '@/components/social-media-links'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import Link from 'next/link'
import { Heart, MessageSquare, Share2, Link as LinkIcon } from 'lucide-react'

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
  socialLinks: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
  }
}

export default function ContactPage() {
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
    email: 'support@passiveblessings.ae',
    phone: '+971 50 000 0000',
    address: 'Dubai, UAE',
    socialLinks: {},
  })

  // Fetch contact info from Firestore settings
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const settingsSnapshot = await getDocs(collection(db, 'settings'))
        settingsSnapshot.forEach(doc => {
          const data = doc.data()
          setContactInfo({
            email: data.email || 'support@passiveblessings.ae',
            phone: data.phone || '+971 50 000 0000',
            address: data.address || 'Dubai, UAE',
            socialLinks: data.socialLinks || {},
          })
        })
      } catch (error) {
        console.error('[v0] Error fetching contact info:', error)
      }
    }

    fetchContactInfo()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Validate form
      if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        throw new Error('Please fill in all required fields')
      }

      // Call API endpoint instead of direct Firestore write
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status: 'new',
          read: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      setSuccess(true)
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const socialIcons = [
    { key: 'facebook', name: 'Facebook', icon: Heart, url: contactInfo.socialLinks.facebook },
    { key: 'twitter', name: 'Twitter', icon: MessageSquare, url: contactInfo.socialLinks.twitter },
    { key: 'instagram', name: 'Instagram', icon: Share2, url: contactInfo.socialLinks.instagram },
    { key: 'linkedin', name: 'LinkedIn', icon: LinkIcon, url: contactInfo.socialLinks.linkedin },
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-12 text-center w-full">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-black">Get In Touch</h1>
            <p className="text-gray-600 mx-auto" style={{ maxWidth: '600px', fontSize: '18px', lineHeight: '1.6' }}>
              Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 mb-12">
            {/* Contact Information - Compact */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-4 text-black">Contact Info</h2>
              </div>

              {/* Address */}
              <div>
                <p className="text-xs uppercase font-medium text-gray-500 mb-1">Address</p>
                <p className="text-sm text-gray-700">{contactInfo.address}</p>
              </div>

              {/* Phone */}
              <div>
                <p className="text-xs uppercase font-medium text-gray-500 mb-1">Phone</p>
                <a href={`tel:${contactInfo.phone}`} className="text-sm text-gray-700 hover:text-black transition-colors">
                  {contactInfo.phone}
                </a>
              </div>

              {/* Email */}
              <div>
                <p className="text-xs uppercase font-medium text-gray-500 mb-1">Email</p>
                <a href={`mailto:${contactInfo.email}`} className="text-sm text-gray-700 hover:text-black transition-colors break-all">
                  {contactInfo.email}
                </a>
              </div>

              {/* Social Media */}
              <div className="pt-4 border-t">
                <p className="text-xs uppercase font-medium text-gray-500 mb-3">Follow Us</p>
                <SocialMediaLinks links={contactInfo.socialLinks} size="md" />
              </div>
            </div>

            {/* Contact Form - Compact */}
            <div className="lg:col-span-4">
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    Thank you! We&apos;ve received your message and will get back to you soon.
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-700">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-1 text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                      placeholder="+971 50 123 4567"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-1 text-gray-700">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                      required
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="donation">Donation Support</option>
                      <option value="volunteer">Volunteer Opportunity</option>
                      <option value="partnership">Partnership Inquiry</option>
                      <option value="event">Event Booking</option>
                      <option value="support">Customer Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-1 text-gray-700">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none text-sm"
                    placeholder="Tell us how we can help..."
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-500">* Required fields. We&apos;ll respond within 24 hours.</p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-black hover:bg-gray-800 text-white px-6 py-2 font-medium rounded-lg disabled:bg-gray-400 transition-colors text-sm"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-black">Want to Join Our Community?</h2>
            <p className="text-gray-700 mb-6">
              Become a member and start making a difference today.
            </p>
            <Link href="/signup">
              <button className="bg-black hover:bg-gray-800 text-white px-6 py-3 font-medium rounded-lg transition-colors">
                Join Now
              </button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
