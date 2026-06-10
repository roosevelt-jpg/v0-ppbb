'use client'

import React, { useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import Link from 'next/link'
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'

interface ContactFormData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
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

      // Add to Firestore
      await addDoc(collection(db, 'contactRequests'), {
        ...formData,
        status: 'new',
        createdAt: serverTimestamp(),
        read: false,
      })

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

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/passiveblessings', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com/passiveblessings', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com/passiveblessings', label: 'Instagram' },
    { icon: Linkedin, href: 'https://linkedin.com/company/passiveblessings', label: 'LinkedIn' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Get In Touch</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 mb-16">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold mb-8">Contact Information</h2>

            {/* Address */}
            <div className="mb-8">
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-black flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Address</h3>
                  <p className="text-gray-600 text-sm">
                    Dubai, United Arab Emirates<br />
                    P.O. Box XXXX
                  </p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="mb-8">
              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-black flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Phone</h3>
                  <a href="tel:+971501234567" className="text-gray-600 hover:text-black transition-colors">
                    +971 50 123 4567
                  </a>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="mb-8">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-black flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Email</h3>
                  <a
                    href="mailto:hello@passiveblessings.com"
                    className="text-gray-600 hover:text-black transition-colors break-all"
                  >
                    hello@passiveblessings.com
                  </a>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="mt-12 pt-8 border-t">
              <h3 className="font-bold mb-4">Follow Us</h3>
          <div className="flex gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                      aria-label={social.label}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="+971 50 123 4567"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
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

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  placeholder="Tell us how we can help..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black hover:bg-gray-800 text-white py-3 font-medium rounded-lg disabled:bg-gray-400"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>

              <p className="text-sm text-gray-600">
                * Required fields. We&apos;ll respond to your inquiry within 24 hours.
              </p>
            </form>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Want to Join Our Community?</h2>
          <p className="text-gray-600 mb-6">
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
  )
}
