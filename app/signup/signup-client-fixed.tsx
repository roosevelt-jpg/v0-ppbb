'use client'

import { useState } from 'react'
import Link from 'next/link'

const STEPS = [
  { id: 1, label: 'Personal info & account' },
  { id: 2, label: 'Verify & activate' },
  { id: 3, label: 'Add business profile (optional)' },
]

const SKILLS = ['Tech/IT', 'Marketing', 'Design', 'Finance', 'Teaching/Training', 'Medical/Health', 'Legal', 'Events Management', 'Media/PR', 'Logistics', 'Admin/Operations', 'Social work', 'Other']

export default function SignupClient() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    memberType: 'general',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: 'United Arab Emirates',
    emirate: 'Dubai',
    consentTerms: false,
    consentPrivacy: false,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as any).checked : value
    }))
  }

  const handleStepChange = (nextStep: number) => {
    if (nextStep >= 1 && nextStep <= STEPS.length) {
      setCurrentStep(nextStep)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement actual signup logic with Firebase
    console.log("[v0] Signup form submitted:", formData)
    alert('Account creation is being processed. Please check your email.')
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{ width: '100%', padding: '1rem', borderBottom: '1px solid #e4e1da' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111' }}>Passive Blessings</div>
          <Link href="/login" style={{ fontSize: '1rem', fontWeight: 500, color: '#111111', textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', width: '100%' }}>
        {/* Left Form Column */}
        <div style={{ flex: 1, padding: '2rem 1rem', overflowY: 'auto' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {/* Progress */}
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#666' }}>STEP {currentStep} OF {STEPS.length}</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {STEPS.map(step => (
                  <div key={step.id} style={{ flex: 1, height: '4px', backgroundColor: currentStep >= step.id ? '#111111' : '#e4e1da', borderRadius: '9999px' }} />
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>{STEPS[currentStep - 1].label}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '2rem' }}>
                {currentStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111111', marginBottom: '1rem' }}>Create your account</h2>
                    
                    {/* Member Type */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', color: '#666' }}>I want to join as</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                          { value: 'general', label: 'General Member', desc: 'Community events, charity' },
                          { value: 'volunteer', label: 'Volunteer', desc: 'Contribute your time & skills' },
                          { value: 'member-volunteer', label: 'Member + Volunteer', desc: 'Full access & give back' },
                        ].map(option => (
                          <label key={option.value} style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: `2px solid ${formData.memberType === option.value ? '#111111' : '#e4e1da'}`, borderRadius: '0.5rem', cursor: 'pointer' }}>
                            <input type="radio" name="memberType" value={option.value} checked={formData.memberType === option.value} onChange={handleInputChange} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                            <div style={{ marginLeft: '1rem' }}>
                              <p style={{ fontWeight: 600, color: '#111111', marginBottom: '0.25rem' }}>{option.label}</p>
                              <p style={{ fontSize: '0.875rem', color: '#666' }}>{option.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Personal Info */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', color: '#666' }}>Personal Information</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <input type="text" name="firstName" placeholder="First name" value={formData.firstName} onChange={handleInputChange} required style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem' }} />
                        <input type="text" name="lastName" placeholder="Last name" value={formData.lastName} onChange={handleInputChange} required style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem' }} />
                      </div>
                    </div>

                    {/* Account Credentials */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', color: '#666' }}>Account Credentials</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input type="email" name="email" placeholder="Email address" value={formData.email} onChange={handleInputChange} required style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem' }} />
                        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} required style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem' }} />
                        <input type="password" name="confirmPassword" placeholder="Confirm password" value={formData.confirmPassword} onChange={handleInputChange} required style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem' }} />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111111', marginBottom: '1rem' }}>Verify & Activate</h2>
                    <p style={{ color: '#666', lineHeight: '1.6' }}>We've sent a verification email to <strong>{formData.email || 'your email'}</strong>. Please check your inbox and confirm your email address.</p>
                    <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #86efac' }}>
                      <p style={{ fontSize: '0.875rem', color: '#166534' }}>✓ Email verification - Required to activate your account</p>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111111', marginBottom: '1rem' }}>Add Business Profile</h2>
                    <p style={{ color: '#666', lineHeight: '1.6' }}>This step is optional. You can add your business profile later from your dashboard.</p>
                    <button type="button" onClick={() => handleStepChange(3)} style={{ padding: '1rem', backgroundColor: '#f7f6f2', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', color: '#111111' }}>Skip for now</button>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                {currentStep > 1 && (
                  <button type="button" onClick={() => handleStepChange(currentStep - 1)} style={{ flex: 1, padding: '1rem', border: '1px solid #e4e1da', backgroundColor: '#ffffff', color: '#111111', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                    Back
                  </button>
                )}

                {currentStep < STEPS.length ? (
                  <button type="button" onClick={() => handleStepChange(currentStep + 1)} style={{ flex: 1, padding: '1rem', backgroundColor: '#111111', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                    Next
                  </button>
                ) : (
                  <button type="submit" style={{ flex: 1, padding: '1rem', backgroundColor: '#111111', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                    Complete Registration
                  </button>
                )}
              </div>

              <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#666' }}>
                Already a member? <Link href="/login" style={{ textDecoration: 'underline', fontWeight: 600, color: '#111111' }}>Sign in</Link>
              </p>
            </form>
          </div>
        </div>

        {/* Right Sidebar - Registration Progress */}
        <div style={{ flex: 1, padding: '2rem 1rem', backgroundColor: '#111111', color: '#ffffff', display: 'none', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Registration progress</p>
            <div style={{ height: '4px', width: `${(currentStep / STEPS.length) * 100}%`, backgroundColor: '#ffffff', borderRadius: '9999px', marginBottom: '2rem' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {STEPS.map((step, idx) => (
                <p key={step.id} style={{ fontSize: '0.875rem', opacity: currentStep >= step.id ? 1 : 0.5 }}>
                  {step.id}. {step.label}
                </p>
              ))}
            </div>
          </div>

          <div style={{ paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>What happens after you register</p>
            <ul style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', listStyle: 'none' }}>
              <li>✓ Email verification - Check your inbox to confirm your account</li>
              <li>✓ WhatsApp welcome - Receive a personalized welcome message from the PB team</li>
              <li>✓ Instant dashboard access - Log in to your member dashboard immediately</li>
              <li>✓ Add your business (optional) - Complete your dashboard anytime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
