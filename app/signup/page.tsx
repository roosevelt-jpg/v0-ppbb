'use client'

import React from 'react'

export default function SignupPage() {
  const [currentStep, setCurrentStep] = React.useState(1)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #e4e1da', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111111' }}>Passive Blessings</h1>
          <a href="/login" style={{ textDecoration: 'none', color: '#111111', fontWeight: '500' }}>Sign In</a>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', backgroundColor: '#f7f6f2' }}>
        <div style={{ flex: 1, padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ maxWidth: '600px', width: '100%' }}>
            {/* Progress Bar */}
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#888888', marginBottom: '0.75rem' }}>STEP {currentStep} OF 3</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[1, 2, 3].map(step => (
                  <div key={step} style={{
                    flex: 1,
                    height: '6px',
                    backgroundColor: currentStep >= step ? '#111111' : '#e4e1da',
                    borderRadius: '9999px',
                    transition: 'all 0.3s ease'
                  }} />
                ))}
              </div>
            </div>

            {/* Card */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '1.25rem',
              padding: '2rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e4e1da'
            }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111111' }}>
                {currentStep === 1 && 'Create Your Account'}
                {currentStep === 2 && 'Your Details'}
                {currentStep === 3 && 'Confirm & Join'}
              </h2>

              {currentStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111111' }}>First Name</label>
                    <input
                      type="text"
                      placeholder="John"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #e4e1da',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        focus: { outline: 'none', borderColor: '#111111' }
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111111' }}>Last Name</label>
                    <input
                      type="text"
                      placeholder="Doe"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #e4e1da',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111111' }}>Email</label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #e4e1da',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111111' }}>Member Type</label>
                    <select style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #e4e1da',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}>
                      <option>General Member</option>
                      <option>Volunteer</option>
                      <option>Member + Volunteer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111111' }}>Location</label>
                    <select style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #e4e1da',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}>
                      <option>Dubai</option>
                      <option>Abu Dhabi</option>
                      <option>Sharjah</option>
                    </select>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.75rem', border: '1px solid #86efac' }}>
                    <p style={{ fontSize: '0.875rem', color: '#166534', fontWeight: '600' }}>✓ Review your information and click "Create Account" to complete signup</p>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span style={{ fontSize: '0.875rem', color: '#111111' }}>I agree to the Terms & Conditions and Privacy Policy</span>
                  </label>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      backgroundColor: '#f7f6f2',
                      color: '#111111',
                      border: '1px solid #e4e1da',
                      borderRadius: '0.75rem',
                      fontWeight: '600',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e4e1da'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f7f6f2'
                    }}
                  >
                    Back
                  </button>
                )}
                {currentStep < 3 && (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      backgroundColor: '#111111',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.75rem',
                      fontWeight: '600',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#333333'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#111111'
                    }}
                  >
                    Next
                  </button>
                )}
                {currentStep === 3 && (
                  <button
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      backgroundColor: '#111111',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.75rem',
                      fontWeight: '600',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#333333'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#111111'
                    }}
                  >
                    Create Account
                  </button>
                )}
              </div>

              <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#888888' }}>
                Already have an account? <a href="/login" style={{ color: '#111111', fontWeight: '600', textDecoration: 'none' }}>Sign In</a>
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{
          display: 'none',
          '@media (min-width: 1024px)': { display: 'block' },
          flex: 1,
          backgroundColor: '#111111',
          color: '#ffffff',
          padding: '2rem',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Join Passive Blessings</h3>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.9)' }}>
              Connect with a community dedicated to meaningful change and charitable impact. Be part of a network that transforms lives through collective giving.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
