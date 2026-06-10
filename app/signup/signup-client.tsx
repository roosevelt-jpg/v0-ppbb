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
import { ChevronRight, ChevronLeft } from 'lucide-react'

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

  const handleDetectLocation = async () => {
    setLoading(true)
    try {
      const locationData = await getUserLocation()
      if (locationData) {
        setFormData(prev => ({ ...prev, location: locationData }))
        setError('')
      }
    } catch (err) {
      setError('Unable to detect location')
    } finally {
      setLoading(false)
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
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">I want to join as</h2>
            <div className="space-y-3">
              {[
                { value: 'member', label: 'General Member', desc: 'Community events, charity' },
                { value: 'volunteer', label: 'Volunteer', desc: 'Contribute your time & skills' },
                { value: 'member-volunteer', label: 'Member + Volunteer', desc: 'Full access & give back' },
              ].map(option => (
                <label key={option.value} className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition" style={{ borderColor: formData.userType === option.value ? '#111111' : '#e4e1da' }}>
                  <input type="radio" name="userType" value={option.value} checked={formData.userType === option.value} onChange={handleInputChange} className="mt-1" />
                  <div className="ml-3">
                    <p className="font-semibold">{option.label}</p>
                    <p className="text-sm text-gray-600">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-5 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8" style={{ color: '#111111' }}>Personal Information</h2>
            <div className="space-y-4 sm:space-y-5">
              <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-3 sm:py-3.5 border rounded-lg focus:outline-none text-sm sm:text-base" style={{ borderColor: '#e4e1da' }} required />
              <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-3 sm:py-3.5 border rounded-lg focus:outline-none text-sm sm:text-base" style={{ borderColor: '#e4e1da' }} required />
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 sm:py-3.5 border rounded-lg focus:outline-none text-sm sm:text-base" style={{ borderColor: '#e4e1da' }} required />
              <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-3 sm:py-3.5 border rounded-lg focus:outline-none text-sm sm:text-base" style={{ borderColor: '#e4e1da' }} required />
              <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleInputChange} className="w-full px-4 py-3 sm:py-3.5 border rounded-lg focus:outline-none text-sm sm:text-base" style={{ borderColor: '#e4e1da' }} required />
              <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="w-full px-4 py-3 sm:py-3.5 border rounded-lg focus:outline-none text-sm sm:text-base" style={{ borderColor: '#e4e1da' }} required />
              <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-4 py-3 sm:py-3.5 border rounded-lg focus:outline-none text-sm sm:text-base" style={{ borderColor: '#e4e1da' }}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full px-4 py-3 sm:py-3.5 border rounded-lg focus:outline-none text-xs sm:text-sm" style={{ borderColor: '#e4e1da' }} />
              {formData.profileImageBase64 && <p className="text-xs sm:text-sm font-medium" style={{ color: '#10b981' }}>✓ Profile image uploaded</p>}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Location</h2>
            <button onClick={handleDetectLocation} disabled={loading} className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? 'Detecting...' : 'Detect My Location'}
            </button>
            {formData.location && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
                <p className="font-semibold">{formData.location.address}</p>
                <p>{formData.location.city}, {formData.location.country}</p>
              </div>
            )}
            <label className="flex items-center p-4 border rounded-lg cursor-pointer">
              <input type="checkbox" name="locationConsent" checked={formData.locationConsent} onChange={handleInputChange} />
              <span className="ml-2 text-sm">I consent to location tracking</span>
            </label>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Agreements</h2>
            <label className="flex items-start p-4 border rounded-lg cursor-pointer">
              <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleInputChange} className="mt-1" />
              <span className="ml-3 text-sm">I accept the Terms of Service</span>
            </label>
            <label className="flex items-start p-4 border rounded-lg cursor-pointer">
              <input type="checkbox" name="dataProtectionAccepted" checked={formData.dataProtectionAccepted} onChange={handleInputChange} className="mt-1" />
              <span className="ml-3 text-sm">I accept the Data Protection Policy</span>
            </label>
            <label className="flex items-start p-4 border rounded-lg cursor-pointer">
              <input type="checkbox" name="newsletterConsent" checked={formData.newsletterConsent} onChange={handleInputChange} className="mt-1" />
              <span className="ml-3 text-sm">Subscribe to our newsletter</span>
            </label>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      {/* Top Navigation */}
      <nav className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b" style={{ borderColor: '#e4e1da' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <Link href="/login" className="text-sm sm:text-base font-medium" style={{ color: '#111111' }}>
            Sign In
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Step Indicator */}
          <div className="mb-10 sm:mb-12">
            <div className="text-xs sm:text-sm font-medium mb-3 sm:mb-4 leading-relaxed" style={{ color: '#888888' }}>
              STEP {currentStep} OF {STEPS.length}
            </div>
            <div className="flex gap-2 sm:gap-3">
              {STEPS.map(step => (
                <div key={step.id} className="flex-1 h-1.5 sm:h-2 rounded-full transition-all" style={{ backgroundColor: currentStep >= step.id ? '#111111' : '#e4e1da' }} />
              ))}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-10 sm:space-y-12">
            {error && (
              <div className="w-full p-4 sm:p-5 bg-red-50 border border-red-200 rounded-lg text-sm sm:text-base text-red-700 leading-relaxed">
                {error}
              </div>
            )}

            <div>{renderStep()}</div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 sm:pt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex-1 px-4 sm:px-6 py-3 sm:py-3.5 border rounded-lg font-medium transition hover:bg-gray-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                  style={{ borderColor: '#e4e1da', color: '#111111' }}
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Back</span>
                </button>
              )}

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="flex-1 px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg font-medium text-white transition flex items-center justify-center gap-2 text-sm sm:text-base"
                  style={{ backgroundColor: '#111111' }}
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg font-semibold text-white transition disabled:opacity-60 text-sm sm:text-base"
                  style={{ backgroundColor: loading ? '#cccccc' : '#111111' }}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              )}
            </div>
          </form>

          {/* Sign In Link */}
          <div className="mt-8 sm:mt-10 text-center">
            <p className="text-sm sm:text-base" style={{ color: '#888888' }}>
              Already have an account?{' '}
              <Link href="/login" className="font-semibold hover:underline transition" style={{ color: '#111111' }}>
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
