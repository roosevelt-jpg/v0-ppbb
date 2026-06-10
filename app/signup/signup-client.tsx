'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { setDoc, doc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { fileToBase64 } from '@/lib/image-upload'
import { getUserLocation } from '@/lib/geolocation'
import { Logo } from '@/components/logo'
import { ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react'

interface LocationData {
  latitude: number
  longitude: number
  address: string
  city: string
  country: string
}

const STEPS = [
  { id: 1, label: 'User type' },
  { id: 2, label: 'Personal info' },
  { id: 3, label: 'Location' },
  { id: 4, label: 'Agreement' },
]

export default function SignupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    userType: 'member',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    gender: '',
    nationality: '',
    emiratesId: '',
    profileImage: null as File | null,
    profileImageBase64: '',
    occupation: '',
    employer: '',
    location: null as LocationData | null,
    locationConsent: false,
    termsAccepted: false,
    dataProtectionAccepted: false,
    newsletterConsent: false,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }
    try {
      const base64 = await fileToBase64(file)
      setFormData(prev => ({
        ...prev,
        profileImage: file,
        profileImageBase64: base64,
      }))
      setError('')
    } catch (err) {
      setError('Failed to process image')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!formData.termsAccepted || !formData.dataProtectionAccepted) {
      setError('Please accept terms and conditions')
      return
    }

    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const user = userCredential.user

      await setDoc(doc(db, 'users', user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        userType: formData.userType,
        dob: formData.dob,
        gender: formData.gender,
        nationality: formData.nationality,
        emiratesId: formData.emiratesId,
        profileImage: formData.profileImageBase64,
        occupation: formData.occupation,
        employer: formData.employer,
        location: formData.location,
        createdAt: new Date(),
      })

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, marginBottom: '1.5rem', color: '#111111' }}>
              I want to join as
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { value: 'member', label: 'General Member', desc: 'Community events, charity' },
                { value: 'volunteer', label: 'Volunteer', desc: 'Contribute your time & skills' },
                { value: 'member-volunteer', label: 'Member + Volunteer', desc: 'Full access & give back' },
              ].map(option => (
                <label key={option.value} style={{ display: 'flex', alignItems: 'flex-start', padding: '1rem', border: `2px solid ${formData.userType === option.value ? '#111111' : '#e4e1da'}`, borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <input type="radio" name="userType" value={option.value} checked={formData.userType === option.value} onChange={handleInputChange} style={{ marginTop: '0.25rem', cursor: 'pointer' }} />
                  <div style={{ marginLeft: '0.75rem' }}>
                    <p style={{ fontWeight: 600, color: '#111111', marginBottom: '0.25rem' }}>{option.label}</p>
                    <p style={{ fontSize: '0.875rem', color: '#666666' }}>{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, marginBottom: '1.5rem', color: '#111111' }}>
              Personal Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} required />
              <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} required />
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} required />
              <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} required />
              <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} required />
              <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} required />
              <select name="gender" value={formData.gender} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              {formData.profileImageBase64 && <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#10b981' }}>✓ Profile image uploaded</p>}
            </div>
          </div>
        )

      case 3:
        return (
          <div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, marginBottom: '1.5rem', color: '#111111' }}>
              Location
            </h2>
            <p style={{ marginBottom: '1rem', color: '#666666' }}>Help us connect you with events in your area</p>
            {formData.location && (
              <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem', marginBottom: '1rem', color: '#166534' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Location detected:</p>
                <p style={{ fontSize: '0.875rem' }}>{formData.location.address}</p>
              </div>
            )}
            <button onClick={() => {}} disabled={loading} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#111111', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
              {loading ? 'Detecting...' : 'Continue'}
            </button>
          </div>
        )

      case 4:
        return (
          <div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, marginBottom: '1.5rem', color: '#111111' }}>
              Terms & Conditions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleInputChange} style={{ marginTop: '0.25rem', cursor: 'pointer' }} required />
                <span style={{ fontSize: '0.875rem', color: '#111111' }}>I agree to the Terms & Conditions</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" name="dataProtectionAccepted" checked={formData.dataProtectionAccepted} onChange={handleInputChange} style={{ marginTop: '0.25rem', cursor: 'pointer' }} required />
                <span style={{ fontSize: '0.875rem', color: '#111111' }}>I accept the data protection policy</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" name="newsletterConsent" checked={formData.newsletterConsent} onChange={handleInputChange} style={{ marginTop: '0.25rem', cursor: 'pointer' }} />
                <span style={{ fontSize: '0.875rem', color: '#111111' }}>Subscribe to our newsletter</span>
              </label>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      {/* Header Navigation */}
      <div style={{ width: '100%', padding: '1rem', borderBottom: '1px solid #e4e1da' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <Logo size="sm" href="/" />
          <Link href="/login" style={{ fontSize: '1rem', fontWeight: 500, color: '#111111', textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>

      {/* Main Content - Single Column Centered */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', width: '100%' }}>
        <div style={{ width: '100%', maxWidth: '672px' }}>
          {/* Progress Indicator */}
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#666666' }}>
              STEP {currentStep} OF {STEPS.length}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {STEPS.map(step => (
                <div key={step.id} style={{ flex: 1, height: '0.5rem', backgroundColor: currentStep >= step.id ? '#111111' : '#e4e1da', borderRadius: '9999px', transition: 'all 0.2s' }} />
              ))}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626', flexShrink: 0, marginTop: '0.125rem' }} />
              <p style={{ fontSize: '1rem', color: '#991b1b' }}>{error}</p>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              {renderStep()}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', flexDirection: window.innerWidth < 640 ? 'column' : 'row' }}>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  style={{ flex: 1, padding: '0.75rem 1rem', border: '1px solid #e4e1da', backgroundColor: '#ffffff', color: '#111111', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem' }}
                >
                  <ChevronLeft size={20} /> Back
                </button>
              )}

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  style={{ flex: 1, padding: '0.75rem 1rem', backgroundColor: '#111111', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem' }}
                >
                  Next <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  style={{ flex: 1, padding: '0.75rem 1rem', backgroundColor: loading ? '#cccccc' : '#111111', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              )}
            </div>
          </form>

          {/* Sign In Link */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', color: '#111111' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ fontWeight: 600, color: '#111111', textDecoration: 'underline' }}>
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
