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
    memberType: 'member',
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
      <div style={{ width: '100%', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e4e1da' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#111111', height: '28px', display: 'flex', alignItems: 'center' }}>
            <img 
              src="/images/pb-logo-black.png" 
              alt="Passive Blessings" 
              style={{ height: '28px', width: 'auto' }}
            />
          </div>
          <Link href="/login" style={{ fontSize: '0.75rem', fontWeight: 500, color: '#111111', textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', width: '100%' }}>
        {/* Left Form Column */}
        <div style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          <div style={{ maxWidth: '550px', margin: '0 auto' }}>
            {/* Progress */}
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#666' }}>STEP {currentStep} OF {STEPS.length}</p>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {STEPS.map(step => (
                  <div key={step.id} style={{ flex: 1, height: '2.5px', backgroundColor: currentStep >= step.id ? '#111111' : '#e4e1da', borderRadius: '9999px' }} />
                ))}
              </div>
              <p style={{ fontSize: '0.65rem', color: '#888', marginTop: '0.25rem' }}>{STEPS[currentStep - 1].label}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                {currentStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>Create your account</h2>
                    
                    {/* Member Type */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', color: '#666' }}>I want to join as</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {[
                          { value: 'member', label: 'Member', desc: 'Community events & charity' },
                          { value: 'volunteer', label: 'Volunteer', desc: 'Member + contribute time & skills' },
                          { value: 'business', label: 'Business Owner', desc: 'Marketplace access' },
                          { value: 'sponsor', label: 'Sponsor', desc: 'Support & partner opportunities' },
                        ].map(option => (
                          <label key={option.value} style={{ display: 'flex', alignItems: 'center', padding: '0.625rem', border: `1.5px solid ${formData.memberType === option.value ? '#111111' : '#e4e1da'}`, borderRadius: '0.375rem', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: formData.memberType === option.value ? '#f7f6f2' : '#fff' }}>
                            <input type="radio" name="memberType" value={option.value} checked={formData.memberType === option.value} onChange={handleInputChange} style={{ width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }} />
                            <div style={{ marginLeft: '0.625rem' }}>
                              <p style={{ fontWeight: 600, color: '#111111', marginBottom: '0.125rem', fontSize: '0.8rem' }}>{option.label}</p>
                              <p style={{ fontSize: '0.7rem', color: '#666' }}>{option.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', color: '#666' }}>Personal Information</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <input type="text" name="firstName" placeholder="First name" value={formData.firstName} onChange={handleInputChange} style={{ padding: '0.5rem 0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.8rem', boxSizing: 'border-box' }} required />
                        <input type="text" name="lastName" placeholder="Last name" value={formData.lastName} onChange={handleInputChange} style={{ padding: '0.5rem 0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.8rem', boxSizing: 'border-box' }} required />
                      </div>
                    </div>

                    {/* Account Credentials */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', color: '#666' }}>Account Credentials</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input type="email" name="email" placeholder="Email address" value={formData.email} onChange={handleInputChange} required style={{ padding: '0.5rem 0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} required style={{ padding: '0.5rem 0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                        <input type="password" name="confirmPassword" placeholder="Confirm password" value={formData.confirmPassword} onChange={handleInputChange} required style={{ padding: '0.5rem 0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                      </div>
                    </div>

                    {/* Terms checkbox */}
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" name="consentTerms" checked={formData.consentTerms} onChange={handleInputChange} style={{ width: '16px', height: '16px', cursor: 'pointer', marginTop: '0.2rem', flexShrink: 0 }} required />
                      <span style={{ fontSize: '0.7rem', color: '#666', lineHeight: '1.3' }}>I agree to the Terms & Conditions and Privacy Policy</span>
                    </label>
                  </div>
                )}

                {currentStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>Verify & Activate</h2>
                    <p style={{ color: '#666', lineHeight: '1.4', fontSize: '0.8rem' }}>We&apos;ve sent a verification email to <strong>{formData.email || 'your email'}</strong>. Check your inbox and confirm your email address.</p>
                    <div style={{ padding: '0.625rem', backgroundColor: '#f0fdf4', borderRadius: '0.375rem', border: '1px solid #86efac' }}>
                      <p style={{ fontSize: '0.7rem', color: '#166534' }}>✓ Email verification - Required to activate your account</p>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>Setup Complete!</h2>
                    <p style={{ color: '#666', lineHeight: '1.4', fontSize: '0.8rem' }}>Your account is ready. You can add more details later from your dashboard.</p>
                    <button type="button" onClick={() => handleStepChange(3)} style={{ padding: '0.625rem', backgroundColor: '#f7f6f2', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', color: '#111111', fontSize: '0.8rem' }}>Continue to Dashboard</button>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                {currentStep > 1 && (
                  <button type="button" onClick={() => handleStepChange(currentStep - 1)} style={{ flex: 1, padding: '0.5rem', border: '1px solid #e4e1da', backgroundColor: '#ffffff', color: '#111111', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>
                    Back
                  </button>
                )}

                {currentStep < STEPS.length ? (
                  <button type="button" onClick={() => handleStepChange(currentStep + 1)} style={{ flex: 1, padding: '0.5rem', backgroundColor: '#111111', color: '#ffffff', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>
                    Next
                  </button>
                ) : (
                  <button type="submit" style={{ flex: 1, padding: '0.5rem', backgroundColor: '#111111', color: '#ffffff', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>
                    Complete
                  </button>
                )}
              </div>

              <p style={{ textAlign: 'center', marginTop: '0.875rem', fontSize: '0.7rem', color: '#666' }}>
                Already have an account? <Link href="/login" style={{ textDecoration: 'underline', fontWeight: 600, color: '#111111' }}>Sign in</Link>
              </p>
            </form>
          </div>
        </div>

        {/* Right Sidebar - Registration Progress */}
        <div style={{ flex: 1, padding: '1.5rem 1rem', backgroundColor: '#111111', color: '#ffffff', display: 'none', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Registration progress</p>
            <div style={{ height: '3px', width: `${(currentStep / STEPS.length) * 100}%`, backgroundColor: '#ffffff', borderRadius: '9999px', marginBottom: '1.5rem' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {STEPS.map((step, idx) => (
                <p key={step.id} style={{ fontSize: '0.75rem', opacity: currentStep >= step.id ? 1 : 0.5 }}>
                  {step.id}. {step.label}
                </p>
              ))}
            </div>
          </div>

          <div style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem' }}>What happens after you register</p>
            <ul style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none' }}>
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
