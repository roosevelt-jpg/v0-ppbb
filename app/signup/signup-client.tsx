'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { setDoc, doc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { fileToBase64 } from '@/lib/image-upload'
import { getUserLocation } from '@/lib/geolocation'
import { Card } from '@/components/ui/card'
import { Logo } from '@/components/logo'

interface LocationData {
  latitude: number
  longitude: number
  address: string
  city: string
  country: string
}

const STEPS = [
  { id: 1, label: 'User type', field: 'userType' },
  { id: 2, label: 'Personal info', field: 'personalInfo' },
  { id: 3, label: 'Location', field: 'location' },
  { id: 4, label: 'Agreement', field: 'agreement' },
]

export default function SignupPage() {
  const router = useRouter()
  const t = useTranslations()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
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

  const handleDetectLocation = async () => {
    setLoading(true)
    try {
      const locationData = await getUserLocation()
      if (locationData) {
        setFormData(prev => ({
          ...prev,
          location: {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            address: locationData.address,
            city: locationData.city,
            country: locationData.country,
          },
        }))
      }
      setError('')
    } catch (err) {
      setError('Could not detect location. Please allow location access.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    if (!formData.termsAccepted || !formData.dataProtectionAccepted) {
      setError('Please accept terms and conditions')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const user = userCredential.user

      // Prepare user document for Firestore
      const userData = {
        uid: user.uid,
        userType: formData.userType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        dob: formData.dob,
        gender: formData.gender,
        nationality: formData.nationality,
        emiratesId: formData.emiratesId,
        occupation: formData.occupation,
        employer: formData.employer,
        location: formData.location || {},
        locationConsent: formData.locationConsent,
        profileImage: formData.profileImageBase64 ? {
          base64: formData.profileImageBase64,
          fileName: formData.profileImage?.name,
          mimeType: formData.profileImage?.type,
          uploadedAt: new Date().toISOString(),
        } : null,
        newsletterConsent: formData.newsletterConsent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
      }

      // Save to Firestore
      await setDoc(doc(db, 'users', user.uid), userData)

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      console.error('[v0] Signup error:', err)
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.userType
      case 2:
        return (
          formData.firstName &&
          formData.lastName &&
          formData.email &&
          formData.password &&
          formData.confirmPassword &&
          formData.password === formData.confirmPassword &&
          formData.dob &&
          formData.gender &&
          formData.nationality
        )
      case 3:
        return formData.location
      case 4:
        return formData.termsAccepted && formData.dataProtectionAccepted
      default:
        return false
    }
  }

  const progressPercent = (currentStep / STEPS.length) * 100

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f6f2' }}>
      {/* Navigation bar - 48px height, Ink Black background */}
      <nav className="h-12 bg-ink-black text-warm-white px-6 flex items-center justify-between border-b" style={{ borderColor: '#e4e1da' }}>
        <div className="w-24">
          <Logo />
        </div>
        <div className="flex items-center gap-6" style={{ fontSize: '12px', color: '#888888' }}>
          <a href="#" className="hover:text-warm-white transition">About us</a>
          <a href="#" className="hover:text-warm-white transition">Join</a>
          <a href="#" className="hover:text-warm-white transition">Events</a>
          <a href="#" className="hover:text-warm-white transition">Marketplace</a>
          <a href="#" className="hover:text-warm-white transition">Contact</a>
          <Link href="/login" className="ml-4 px-3 py-1 text-charcoal bg-warm-white hover:bg-warm-grey rounded-lg transition" style={{ fontSize: '12px', fontWeight: 500 }}>
            Sign in
          </Link>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-48px)]">
        {/* Progress sidebar - 175px width */}
        <div className="w-44 px-6 py-8 border-r" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
          <h2 className="text-xs font-medium mb-8" style={{ color: '#888888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Registration progress
          </h2>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#e4e1da' }}>
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${progressPercent}%`, backgroundColor: '#111111' }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: '#888888' }}>{progressPercent.toFixed(0)}%</p>
          </div>

          {/* Step indicators */}
          <div className="space-y-3">
            {STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => {
                  if (step.id <= currentStep) {
                    setCurrentStep(step.id)
                  }
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition"
                style={{
                  backgroundColor: step.id === currentStep ? '#111111' : step.id < currentStep ? '#e4e1da' : 'transparent',
                  color: step.id === currentStep ? '#f7f6f2' : step.id < currentStep ? '#111111' : '#888888',
                }}
              >
                <span style={{ fontFamily: 'DM Mono', fontWeight: 400 }}>{step.id}.</span> {step.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="w-full max-w-2xl">
            <Card className="p-8" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
              {/* Step 1: User Type */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold mb-2" style={{ color: '#111111', fontFamily: 'Playfair Display', fontWeight: 700 }}>
                      Create your account
                    </h1>
                    <p className="text-sm" style={{ color: '#888888' }}>
                      Join the Passive Blessings community — it only takes a few minutes
                    </p>
                  </div>

                  <div className="text-xs font-medium mb-4" style={{ color: '#888888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    I want to join as
                  </div>

                  <div className="space-y-3">
                    {[
                      { value: 'member', label: 'General member', desc: 'Community events, charity' },
                      { value: 'volunteer', label: 'Volunteer', desc: 'Contribute your time & skills' },
                      { value: 'both', label: 'Member + Volunteer', desc: 'Full access & give back' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center p-4 border rounded-lg cursor-pointer transition hover:bg-warm-white"
                        style={{
                          borderColor: formData.userType === option.value ? '#111111' : '#e4e1da',
                          borderWidth: formData.userType === option.value ? '2px' : '1px',
                        }}
                      >
                        <input
                          type="radio"
                          name="userType"
                          value={option.value}
                          checked={formData.userType === option.value}
                          onChange={handleInputChange}
                          className="w-4 h-4"
                        />
                        <div className="ml-3 flex-1">
                          <div className="font-medium" style={{ color: '#333333' }}>{option.label}</div>
                          <div className="text-xs" style={{ color: '#888888' }}>{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Personal Info */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-1" style={{ color: '#111111', fontFamily: 'Playfair Display', fontWeight: 700 }}>
                      Personal information
                    </h2>
                    <p className="text-xs" style={{ color: '#888888' }}>Tell us a bit about yourself</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        First name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="e.g. Fatima"
                        className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                        style={{
                          borderColor: '#e4e1da',
                          backgroundColor: '#ffffff',
                          color: '#333333',
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Last name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="e.g. Al Mansoori"
                        className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                        style={{
                          borderColor: '#e4e1da',
                          backgroundColor: '#ffffff',
                          color: '#333333',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Email address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="you@example.com"
                      className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                      style={{
                        borderColor: '#e4e1da',
                        backgroundColor: '#ffffff',
                        color: '#333333',
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Min 8 characters"
                        className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                        style={{
                          borderColor: '#e4e1da',
                          backgroundColor: '#ffffff',
                          color: '#333333',
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Confirm password *
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Re-enter password"
                        className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                        style={{
                          borderColor: '#e4e1da',
                          backgroundColor: '#ffffff',
                          color: '#333333',
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Date of birth *
                      </label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                        style={{
                          borderColor: '#e4e1da',
                          backgroundColor: '#ffffff',
                          color: '#333333',
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Gender *
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                        style={{
                          borderColor: '#e4e1da',
                          backgroundColor: '#ffffff',
                          color: '#333333',
                        }}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Nationality *
                      </label>
                      <select
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleInputChange}
                        className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                        style={{
                          borderColor: '#e4e1da',
                          backgroundColor: '#ffffff',
                          color: '#333333',
                        }}
                      >
                        <option value="">Select nationality</option>
                        <option value="UAE">UAE National</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Emirates ID (optional)
                    </label>
                    <input
                      type="text"
                      name="emiratesId"
                      value={formData.emiratesId}
                      onChange={handleInputChange}
                      placeholder="e.g. 784-XXXX-XXXXXXX-X"
                      className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                      style={{
                        borderColor: '#e4e1da',
                        backgroundColor: '#ffffff',
                        color: '#333333',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Profile photo (optional)
                    </label>
                    <div
                      className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-warm-white transition cursor-pointer"
                      style={{ borderColor: '#e4e1da' }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="profileImage"
                      />
                      <label htmlFor="profileImage" className="cursor-pointer">
                        <div className="text-xs" style={{ color: '#888888' }}>Click to upload or drag and drop</div>
                        <div className="text-xs mt-1" style={{ color: '#888888' }}>JPG, PNG up to 5MB</div>
                      </label>
                    </div>
                    {formData.profileImageBase64 && (
                      <div className="mt-3 flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#e4e1da' }}>
                        <span className="text-sm" style={{ color: '#333333' }}>{formData.profileImage?.name}</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, profileImage: null, profileImageBase64: '' }))}
                          className="text-xs hover:underline"
                          style={{ color: '#888888' }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Occupation (optional)
                      </label>
                      <input
                        type="text"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleInputChange}
                        placeholder="e.g. Software Engineer, Teacher"
                        className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                        style={{
                          borderColor: '#e4e1da',
                          backgroundColor: '#ffffff',
                          color: '#333333',
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Employer / Company (optional)
                      </label>
                      <input
                        type="text"
                        name="employer"
                        value={formData.employer}
                        onChange={handleInputChange}
                        placeholder="e.g. Emirates Group, UAEU"
                        className="w-full h-9 px-3 py-2 text-sm rounded-lg border"
                        style={{
                          borderColor: '#e4e1da',
                          backgroundColor: '#ffffff',
                          color: '#333333',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Location */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-1" style={{ color: '#111111', fontFamily: 'Playfair Display', fontWeight: 700 }}>
                      Your location
                    </h2>
                    <p className="text-xs" style={{ color: '#888888' }}>Help us connect you with local events and community members</p>
                  </div>

                  {formData.location ? (
                    <div className="p-4 rounded-lg border" style={{ backgroundColor: '#f7f6f2', borderColor: '#e4e1da' }}>
                      <p className="text-sm font-medium mb-2" style={{ color: '#333333' }}>
                        Detected location:
                      </p>
                      <p className="text-sm" style={{ color: '#333333' }}>{formData.location.address}</p>
                      <p className="text-xs mt-1" style={{ color: '#888888' }}>
                        {formData.location.city}, {formData.location.country}
                      </p>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, location: null }))}
                        className="mt-3 text-xs hover:underline"
                        style={{ color: '#111111' }}
                      >
                        Change location
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={loading}
                      className="w-full h-8 px-4 rounded-lg font-medium text-sm transition disabled:opacity-50"
                      style={{
                        backgroundColor: '#111111',
                        color: '#f7f6f2',
                      }}
                    >
                      {loading ? 'Detecting location...' : 'Detect my location'}
                    </button>
                  )}

                  <div className="p-4 rounded-lg border" style={{ backgroundColor: '#f7f6f2', borderColor: '#e4e1da' }}>
                    <p className="text-xs font-medium mb-2" style={{ color: '#333333', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Why we ask for your location:
                    </p>
                    <ul className="text-xs space-y-1" style={{ color: '#888888' }}>
                      <li>• To show you events happening near you</li>
                      <li>• To connect you with members in your area</li>
                      <li>• To match you to local opportunities & volunteer roles</li>
                      <li>• To route charity support to the right coordinators</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Step 4: Agreement */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-1" style={{ color: '#111111', fontFamily: 'Playfair Display', fontWeight: 700 }}>
                      Consent & agreement
                    </h2>
                    <p className="text-xs" style={{ color: '#888888' }}>Please review and accept our policies</p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-warm-white transition cursor-pointer" style={{ borderColor: '#e4e1da' }}>
                      <input
                        type="checkbox"
                        name="termsAccepted"
                        checked={formData.termsAccepted}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm" style={{ color: '#333333' }}>
                          I agree to the <a href="#" className="hover:underline" style={{ color: '#1565c0' }}>Terms & Conditions</a> and{' '}
                          <a href="#" className="hover:underline" style={{ color: '#1565c0' }}>Community Code of Conduct</a> of Passive Blessings.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-warm-white transition cursor-pointer" style={{ borderColor: '#e4e1da' }}>
                      <input
                        type="checkbox"
                        name="dataProtectionAccepted"
                        checked={formData.dataProtectionAccepted}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm" style={{ color: '#333333' }}>
                          I consent to my personal data being stored and processed in accordance with the{' '}
                          <a href="#" className="hover:underline" style={{ color: '#1565c0' }}>UAE Data Protection Policy</a>. My data is encrypted and will not be shared with third parties.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-warm-white transition cursor-pointer" style={{ borderColor: '#e4e1da' }}>
                      <input
                        type="checkbox"
                        name="locationConsent"
                        checked={formData.locationConsent}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm" style={{ color: '#333333' }}>
                          I confirm my location details are accurate and consent to being connected with local community events and members in my area.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-warm-white transition cursor-pointer" style={{ borderColor: '#e4e1da' }}>
                      <input
                        type="checkbox"
                        name="newsletterConsent"
                        checked={formData.newsletterConsent}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm" style={{ color: '#333333' }}>
                          I agree to receive WhatsApp and email updates about upcoming events, opportunities, and community news.
                        </p>
                      </div>
                    </label>
                  </div>

                  <p className="text-xs" style={{ color: '#888888' }}>
                    Your data is encrypted and secure - Passive Blessings ESTD 2025
                  </p>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="p-3 mt-6 rounded-lg border" style={{ backgroundColor: '#c62828', backgroundColor: '#fee', borderColor: '#c62828' }}>
                  <p className="text-sm" style={{ color: '#c62828' }}>{error}</p>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between gap-4 mt-8 pt-6 border-t" style={{ borderColor: '#e4e1da' }}>
                <button
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                  className="px-6 h-8 rounded-lg border text-sm font-medium transition disabled:opacity-50"
                  style={{
                    borderColor: '#e4e1da',
                    color: '#333333',
                  }}
                >
                  Back
                </button>

                {currentStep === STEPS.length ? (
                  <button
                    onClick={handleSignup}
                    disabled={!isStepValid() || loading}
                    className="px-6 h-8 rounded-lg text-sm font-medium transition disabled:opacity-50"
                    style={{
                      backgroundColor: '#111111',
                      color: '#f7f6f2',
                    }}
                  >
                    {loading ? 'Creating account...' : 'Create account & continue'}
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!isStepValid()}
                    className="px-6 h-8 rounded-lg text-sm font-medium transition disabled:opacity-50"
                    style={{
                      backgroundColor: '#111111',
                      color: '#f7f6f2',
                    }}
                  >
                    Continue
                  </button>
                )}
              </div>
            </Card>

            <p className="text-center text-xs mt-6" style={{ color: '#888888' }}>
              Already a member?{' '}
              <Link href="/login" className="hover:underline" style={{ color: '#1565c0' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
