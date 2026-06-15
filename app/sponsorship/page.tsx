'use client'

import React, { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { SponsorshipTier } from '@/lib/types'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const SPONSORSHIP_TIERS: SponsorshipTier[] = [
  {
    id: '1',
    name: 'Community Partner',
    monthlyAmount: 500,
    yearlyAmount: 5000,
    benefits: ['Logo on website', 'Social media mentions', 'Event visibility', 'Newsletter features'],
    icon: '🤝',
    color: '#0066CC',
    order: 1,
    isPopular: false,
  },
  {
    id: '2',
    name: 'Gold Sponsor',
    monthlyAmount: 2000,
    yearlyAmount: 20000,
    benefits: [
      'Prominent logo placement',
      'Weekly social media features',
      'Event speaking opportunity',
      'Branded materials',
      'Annual report mention',
      'Quarterly business reviews',
    ],
    icon: '🏆',
    color: '#FFD700',
    order: 2,
    isPopular: true,
  },
  {
    id: '3',
    name: 'Strategic Partner',
    monthlyAmount: 5000,
    yearlyAmount: 50000,
    benefits: [
      'Executive partnership',
      'Co-branded campaigns',
      'Board representation options',
      'Custom partnership structure',
      'Impact reports',
      'Executive networking',
      'Press releases',
    ],
    icon: '⭐',
    color: '#003366',
    order: 3,
    isPopular: false,
  },
]

export default function SponsorshipPage() {
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    message: '',
    preferredTier: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await addDoc(collection(db, 'sponsorshipInquiries'), {
        ...inquiryForm,
        submittedAt: serverTimestamp(),
        status: 'new',
      })

      setSubmitted(true)
      setInquiryForm({ name: '', email: '', phone: '', companyName: '', message: '', preferredTier: '' })
      setTimeout(() => setSubmitted(false), 5000)
    } catch (error) {
      console.error('[v0] Error submitting inquiry:', error)
      alert('Failed to submit inquiry. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#111111', color: '#fff', padding: '60px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 700, margin: '0 0 16px 0' }}>Become a Sponsor</h1>
        <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
          Partner with Passive Blessings and make a meaningful impact in our community
        </p>
      </div>

      {/* Why Sponsor Section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#111111', marginBottom: '32px', textAlign: 'center' }}>
          Why Sponsor With Us?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          {[
            { title: 'Impact', desc: 'Directly support community initiatives and change lives' },
            { title: 'Visibility', desc: 'Gain exposure to our engaged community members' },
            { title: 'Partnership', desc: 'Collaborate with like-minded organizations' },
            { title: 'Reports', desc: 'Receive detailed impact and outcome reports' },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                padding: '24px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '1px solid #eee',
                textAlign: 'center',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111111', marginBottom: '8px' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sponsorship Tiers */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#111111', marginBottom: '32px', textAlign: 'center' }}>
          Sponsorship Tiers
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {SPONSORSHIP_TIERS.map((tier) => (
            <div
              key={tier.id}
              style={{
                padding: '32px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: tier.isPopular ? `2px solid ${tier.color}` : '1px solid #eee',
                position: 'relative',
              }}
            >
              {tier.isPopular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: tier.color,
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  MOST POPULAR
                </div>
              )}

              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{tier.icon}</div>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#111111', margin: '16px 0 8px 0' }}>
                {tier.name}
              </h3>

              <div style={{ margin: '24px 0' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Monthly</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: tier.color }}>
                  AED {tier.monthlyAmount.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>or AED {tier.yearlyAmount.toLocaleString()} yearly</div>
              </div>

              <div style={{ margin: '24px 0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111111', marginBottom: '12px' }}>
                  Benefits Include:
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#111111',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '24px',
                }}
                onClick={() => {
                  const inquirySection = document.getElementById('inquiry-form')
                  inquirySection?.scrollIntoView({ behavior: 'smooth' })
                  setInquiryForm({ ...inquiryForm, preferredTier: tier.name })
                }}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Inquiry Form */}
      <div
        id="inquiry-form"
        style={{
          maxWidth: '600px',
          margin: '60px auto',
          padding: '40px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #eee',
        }}
      >
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#111111', marginBottom: '24px', textAlign: 'center' }}>
          Sponsorship Inquiry
        </h2>

        {submitted && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Thank you for your interest! We'll contact you shortly.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>
              Full Name *
            </label>
            <input
              type="text"
              required
              value={inquiryForm.name}
              onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>
              Email *
            </label>
            <input
              type="email"
              required
              value={inquiryForm.email}
              onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>
              Phone
            </label>
            <input
              type="tel"
              value={inquiryForm.phone}
              onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>
              Company Name *
            </label>
            <input
              type="text"
              required
              value={inquiryForm.companyName}
              onChange={(e) => setInquiryForm({ ...inquiryForm, companyName: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>
              Preferred Sponsorship Tier
            </label>
            <select
              value={inquiryForm.preferredTier}
              onChange={(e) => setInquiryForm({ ...inquiryForm, preferredTier: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="">-- Select Tier --</option>
              {SPONSORSHIP_TIERS.map((tier) => (
                <option key={tier.id} value={tier.name}>
                  {tier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>
              Message
            </label>
            <textarea
              value={inquiryForm.message}
              onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                minHeight: '100px',
                fontFamily: 'inherit',
              }}
              placeholder="Tell us about your sponsorship interest..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 16px',
              backgroundColor: loading ? '#ccc' : '#111111',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Submitting...' : 'Submit Inquiry'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: '#111111', color: '#fff', padding: '40px 20px', textAlign: 'center', marginTop: '60px' }}>
        <p style={{ fontSize: '14px', opacity: 0.8 }}>
          Questions? Contact our sponsorship team at sponsorships@passiveblessings.com
        </p>
      </div>
      </div>
      <Footer />
    </>
  )
}
