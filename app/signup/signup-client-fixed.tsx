'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Loader2, Eye, EyeOff, MapPin } from 'lucide-react'
import { SiteLogo } from '@/components/site-logo'
import { SearchableSelect } from '@/components/searchable-select'
import { COUNTRY_OPTIONS } from '@/lib/countries'
import { UAE_EMIRATES, UAE_CITIES_BY_EMIRATE, isUaeCountry } from '@/lib/signup-locations'
import { getUserLocation } from '@/lib/geolocation'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import type { LocationData } from '@/lib/types'

const STEPS = [
  { id: 1, label: 'Personal info & account' },
  { id: 2, label: 'Verify & activate' },
  { id: 3, label: 'Complete profile' },
]

const SKILLS = ['Tech/IT', 'Marketing', 'Design', 'Finance', 'Teaching/Training', 'Medical/Health', 'Legal', 'Events Management', 'Media/PR', 'Logistics', 'Admin/Operations', 'Social work', 'Other']

const COUNTRY_SELECT_OPTIONS = COUNTRY_OPTIONS.map((c) => ({ value: c.name, label: c.name }))
const NATIONALITY_OPTIONS = COUNTRY_OPTIONS.map((c) => ({ value: c.name, label: c.name }))

export default function SignupClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)

  const [formData, setFormData] = useState({
    memberType: searchParams.get('type') === 'business' ? 'business' : 'member',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    nationality: '',
    country: 'United Arab Emirates',
    emirate: 'Dubai',
    city: 'Dubai',
    customCity: '',
    address: '',
    countryCode: 'AE',
    gender: '',
    dateOfBirth: '',
    skills: [] as string[],
    bio: '',
    consentTerms: false,
    consentPrivacy: false,
    consentLocation: false,
    consentNotifications: false,
    // Business fields (Step 3, for business user type)
    businessName: '',
    businessType: '',
    businessRegistration: '',
    businessLocation: '',
    businessDescription: '',
  })

  useEffect(() => {
    if (searchParams.get('type') === 'business') {
      setFormData((prev) =>
        prev.memberType === 'business' ? prev : { ...prev, memberType: 'business' }
      )
    }
  }, [searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as any).checked : value
    }))
  }

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const handleDetectLocation = async () => {
    setDetectingLocation(true)
    setError('')
    try {
      const detected = await getUserLocation()
      if (!detected) {
        setError('Could not detect your location. Please select country and city manually.')
        return
      }

      const matchedCountry = COUNTRY_OPTIONS.find(
        (c) => c.code === detected.countryCode || c.name === detected.country
      )

      setFormData((prev) => {
        const country = matchedCountry?.name || detected.country || prev.country
        const uae = isUaeCountry(country)
        const emirate = uae
          ? UAE_EMIRATES.find((e) => detected.state?.includes(e) || detected.city?.includes(e)) || detected.state || prev.emirate
          : prev.emirate
        const city = detected.city || prev.city

        return {
          ...prev,
          country,
          countryCode: matchedCountry?.code || detected.countryCode || prev.countryCode,
          emirate: uae ? emirate : prev.emirate,
          city: uae ? city : city,
          customCity: uae ? prev.customCity : city,
          address: detected.address || prev.address,
          consentLocation: true,
        }
      })
    } catch (err) {
      console.error('[v0] Geolocation detect failed:', err)
      setError('Location detection failed. You can still enter your location manually.')
    } finally {
      setDetectingLocation(false)
    }
  }

  const validateStep = async (step: number): Promise<boolean> => {
    setError('')
    
    if (step === 1) {
      if (!formData.firstName.trim()) {
        setError('First name is required')
        return false
      }
      if (!formData.lastName.trim()) {
        setError('Last name is required')
        return false
      }
      if (!formData.gender) {
        setError('Please select your gender')
        return false
      }
      if (!formData.nationality.trim()) {
        setError('Please select your nationality')
        return false
      }
      if (!formData.email.trim()) {
        setError('Email is required')
        return false
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address')
        return false
      }
      
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(formData.email.toLowerCase())}`)
        const json = await res.json()
        if (res.ok && json.success && !json.available) {
          setError('This email is already registered. Please log in or use a different email.')
          return false
        }
      } catch (err) {
        console.error('[v0] Error checking email uniqueness:', err)
      }
      
      if (!formData.password) {
        setError('Password is required')
        return false
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return false
      }
      if (!formData.consentTerms) {
        setError('You must accept the Terms of Service')
        return false
      }
      if (!formData.consentPrivacy) {
        setError('You must accept the Privacy Policy')
        return false
      }
    }

    if (step === 2) {
      if (!formData.phone.trim()) {
        setError('Phone number is required')
        return false
      }
      if (!formData.dateOfBirth) {
        setError('Date of birth is required')
        return false
      }
      if (!formData.country.trim()) {
        setError('Please select your country')
        return false
      }
      const resolvedCity = isUaeCountry(formData.country)
        ? formData.city
        : (formData.customCity || formData.city).trim()
      if (!resolvedCity) {
        setError('Please enter your city')
        return false
      }
      if (isUaeCountry(formData.country) && !formData.emirate) {
        setError('Please select your emirate')
        return false
      }
      if (!formData.consentLocation) {
        setError('Please confirm your location details are accurate')
        return false
      }
    }

    if (step === 3 && formData.memberType === 'business') {
      if (!formData.businessName.trim()) {
        setError('Business name is required')
        return false
      }
      if (!formData.businessType) {
        setError('Please select a business type')
        return false
      }
      if (!formData.businessLocation.trim()) {
        setError('Business location is required')
        return false
      }
    }

    return true
  }

  const handleStepChange = async (nextStep: number) => {
    if (!(await validateStep(currentStep))) return

    if (nextStep >= 1 && nextStep <= STEPS.length) {
      setCurrentStep(nextStep)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!(await validateStep(currentStep))) return

    setIsLoading(true)
    setError('')

    try {
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.toLowerCase(),
        formData.password
      )

      const firebaseUser = userCredential.user
      const now = new Date()
      const resolvedCity = isUaeCountry(formData.country)
        ? formData.city
        : (formData.customCity || formData.city).trim()

      const location: LocationData = sanitizeForFirestore({
        country: formData.country,
        countryCode: formData.countryCode,
        emirate: isUaeCountry(formData.country) ? formData.emirate : formData.country,
        city: resolvedCity,
        state: isUaeCountry(formData.country) ? formData.emirate : undefined,
        address: formData.address || undefined,
      })

      // Update profile with display name
      await updateProfile(firebaseUser, {
        displayName: `${formData.firstName} ${formData.lastName}`
      })

      // Create user document in Firestore with proper schema
      const userDocRef = doc(db, 'users', firebaseUser.uid)
      
      const userData: Record<string, unknown> = {
        uid: firebaseUser.uid,
        email: formData.email.toLowerCase(),
        createdAt: now,
        dateJoined: now,
        memberSince: now,
        updatedAt: now,
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        whatsappNumber: formData.phone,
        nationality: formData.nationality,
        country: formData.country,
        emirate: isUaeCountry(formData.country) ? formData.emirate : null,
        city: resolvedCity,
        location,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        bio: formData.bio || null,
        skills: formData.skills,
        role: formData.memberType,
        roles: [formData.memberType],
        language: 'en',
        timezone: 'Asia/Dubai',
        emailVerified: false,
        phoneVerified: false,
        profileComplete: true,
        status: 'active',
        active: true,
        membershipTier: 'standard',
        volunteeredHours: 0,
        volunteerHours: 0,
        totalDonated: 0,
        consentTerms: formData.consentTerms,
        consentPrivacy: formData.consentPrivacy,
        consentLocation: formData.consentLocation,
        consentNotifications: formData.consentNotifications,
        avatarUrl: null,
        documentUrls: {
          idVerification: null,
          addressProof: null,
        },
      }
      
      // Add business profile if user type is business
      if (formData.memberType === 'business') {
        userData.business = {
          name: formData.businessName,
          type: formData.businessType,
          registration: formData.businessRegistration || null,
          location: formData.businessLocation,
          description: formData.businessDescription || null,
          createdAt: now,
        }
        userData.hasBusinessProfile = true
      }
      
      await setDoc(userDocRef, sanitizeForFirestore(userData))

      // Directory listing starts pending — admin must approve (Part 5C/5D)
      if (formData.memberType === 'business') {
        await setDoc(
          doc(db, 'businesses', firebaseUser.uid),
          {
            name: formData.businessName || `${formData.firstName}'s Business`,
            businessName: formData.businessName || `${formData.firstName}'s Business`,
            category: formData.businessType || 'Services',
            businessType: formData.businessType || 'Services',
            description: formData.businessDescription || '',
            communityBenefit: formData.businessDescription || '',
            services: [],
            productImages: [],
            tradeLicenceURL: '',
            logoURL: '',
            bannerURL: '',
            ownerName: `${formData.firstName} ${formData.lastName}`.trim(),
            ownerId: firebaseUser.uid,
            userId: firebaseUser.uid,
            email: formData.email.toLowerCase(),
            phone: formData.phone || '',
            location: formData.businessLocation || formData.emirate || '',
            isApproved: false,
            isActive: true,
            isVerified: false,
            featured: false,
            status: 'pending_review',
            createdAt: now,
            updatedAt: now,
            submittedAt: now,
          },
          { merge: true }
        )
      }

      console.log('[v0] User account created successfully:', firebaseUser.uid)

      // Redirect to success page — user can sign in from there
      setError('')
      router.push('/signup/success')
    } catch (err: any) {
      console.error('[v0] Signup error:', err)
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in or use a different email.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else {
        setError(err.message || 'An error occurred during signup. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{ width: '100%', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e4e1da' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#111111', height: '28px', display: 'flex', alignItems: 'center' }}>
            <SiteLogo background="light" variant="primary" href="/" />
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

            {/* Error Message */}
            {error && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '0.375rem', border: '1px solid #fca5a5' }}>
                <p style={{ color: '#991b1b', fontSize: '0.875rem', fontWeight: 500 }}>{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                {currentStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>Create your account</h2>
                    
                    {/* User Type */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', color: '#666' }}>I want to join as</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {[
                          { value: 'member', label: 'Member', desc: 'Join our community & participate in activities' },
                          { value: 'business', label: 'Business', desc: 'Company partnerships & corporate engagement' },
                        ].map(option => (
                          <label key={option.value} style={{ display: 'flex', alignItems: 'center', padding: '0.625rem', border: `1.5px solid ${formData.memberType === option.value ? '#111111' : '#e4e1da'}`, borderRadius: '0.375rem', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: formData.memberType === option.value ? '#f7f6f2' : '#fff' }}>
                            <input type="radio" name="memberType" value={option.value} checked={formData.memberType === option.value} onChange={handleInputChange} style={{ width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }} />
                            <div style={{ marginLeft: '0.625rem', flex: 1 }}>
                              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111111' }}>{option.label}</p>
                              <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.125rem' }}>{option.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Name Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>First Name *</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="John" style={{ width: '100%', padding: '0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>Last Name *</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Doe" style={{ width: '100%', padding: '0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                      </div>
                    </div>

                    {/* Gender */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', color: '#666' }}>Gender *</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.375rem' }}>
                        {['Male', 'Female', 'Other', 'Prefer not to say'].map(g => (
                          <label key={g} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', border: `1px solid ${formData.gender === g ? '#111111' : '#e4e1da'}`, borderRadius: '0.375rem', cursor: 'pointer', backgroundColor: formData.gender === g ? '#f7f6f2' : '#fff', transition: 'all 0.2s' }}>
                            <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={handleInputChange} style={{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.7rem', marginLeft: '0.375rem', color: '#111111', fontWeight: 500 }}>{g}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Nationality */}
                    <SearchableSelect
                      label="Nationality"
                      value={formData.nationality}
                      options={NATIONALITY_OPTIONS}
                      onChange={(value) => setFormData((prev) => ({ ...prev, nationality: value }))}
                      placeholder="Search countries…"
                      required
                    />

                    {/* Email */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>Email Address *</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" style={{ width: '100%', padding: '0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                    </div>

                    {/* Password */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>Password *</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          name="password" 
                          value={formData.password} 
                          onChange={handleInputChange} 
                          placeholder="Minimum 8 characters" 
                          style={{ width: '100%', padding: '0.625rem 2.25rem 0.625rem 0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box' }} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: '0.625rem', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>Confirm Password *</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input 
                          type={showConfirm ? 'text' : 'password'} 
                          name="confirmPassword" 
                          value={formData.confirmPassword} 
                          onChange={handleInputChange} 
                          placeholder="Re-enter password" 
                          style={{ width: '100%', padding: '0.625rem 2.25rem 0.625rem 0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box' }} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          style={{ position: 'absolute', right: '0.625rem', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
                        >
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Consent Checkboxes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" name="consentTerms" checked={formData.consentTerms} onChange={handleInputChange} style={{ width: '16px', height: '16px', marginTop: '0.125rem', cursor: 'pointer', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.75rem', color: '#666', lineHeight: '1.4' }}>I agree to the <Link href="/pages/terms-of-service" target="_blank" rel="noopener noreferrer" style={{ color: '#111111', fontWeight: 600, textDecoration: 'underline' }}>Terms of Service</Link> *</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" name="consentPrivacy" checked={formData.consentPrivacy} onChange={handleInputChange} style={{ width: '16px', height: '16px', marginTop: '0.125rem', cursor: 'pointer', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.75rem', color: '#666', lineHeight: '1.4' }}>I agree to the <Link href="/pages/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#111111', fontWeight: 600, textDecoration: 'underline' }}>Privacy Policy</Link> *</span>
                      </label>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>Location & profile</h2>

                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={detectingLocation}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.625rem',
                        border: '1px solid #e4e1da',
                        backgroundColor: '#ffffff',
                        color: '#111111',
                        borderRadius: '0.375rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: detectingLocation ? 'not-allowed' : 'pointer',
                        opacity: detectingLocation ? 0.7 : 1,
                      }}
                    >
                      <MapPin size={16} />
                      {detectingLocation ? 'Detecting location…' : 'Use my current location (optional)'}
                    </button>

                    {/* Phone */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>Phone Number *</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+971 50 1234567" style={{ width: '100%', padding: '0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>Date of Birth *</label>
                      <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} max={new Date().toISOString().split('T')[0]} style={{ width: '100%', padding: '0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                    </div>

                    <SearchableSelect
                      label="Country of residence"
                      value={formData.country}
                      options={COUNTRY_SELECT_OPTIONS}
                      onChange={(value) => {
                        const match = COUNTRY_OPTIONS.find((c) => c.name === value)
                        setFormData((prev) => ({
                          ...prev,
                          country: value,
                          countryCode: match?.code || prev.countryCode,
                          emirate: isUaeCountry(value) ? prev.emirate || 'Dubai' : '',
                          city: isUaeCountry(value) ? prev.city || 'Dubai' : '',
                          customCity: isUaeCountry(value) ? '' : prev.customCity,
                        }))
                      }}
                      placeholder="Search countries…"
                      required
                    />

                    {isUaeCountry(formData.country) ? (
                      <>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>Emirate *</label>
                          <select
                            name="emirate"
                            value={formData.emirate}
                            onChange={(e) => {
                              const emirate = e.target.value
                              const cities = UAE_CITIES_BY_EMIRATE[emirate as keyof typeof UAE_CITIES_BY_EMIRATE] || ['Other']
                              setFormData((prev) => ({
                                ...prev,
                                emirate,
                                city: cities[0] || prev.city,
                              }))
                            }}
                            style={{ width: '100%', padding: '0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box', backgroundColor: '#fff' }}
                          >
                            {UAE_EMIRATES.map((emirate) => (
                              <option key={emirate} value={emirate}>{emirate}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>City / Area *</label>
                          <select
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            style={{ width: '100%', padding: '0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box', backgroundColor: '#fff' }}
                          >
                            {(UAE_CITIES_BY_EMIRATE[formData.emirate as keyof typeof UAE_CITIES_BY_EMIRATE] || ['Other']).map((city) => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>City *</label>
                        <input
                          type="text"
                          name="customCity"
                          value={formData.customCity}
                          onChange={handleInputChange}
                          placeholder="Enter your city"
                          style={{ width: '100%', padding: '0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box' }}
                        />
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>Street address (optional)</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Building, street, or neighbourhood"
                        style={{ width: '100%', padding: '0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="consentLocation"
                        checked={formData.consentLocation}
                        onChange={handleInputChange}
                        style={{ width: '16px', height: '16px', marginTop: '0.125rem', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#666', lineHeight: '1.4' }}>
                        I confirm my location details are accurate and consent to being connected with local community events and members in my area. *
                      </span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="consentNotifications"
                        checked={formData.consentNotifications}
                        onChange={handleInputChange}
                        style={{ width: '16px', height: '16px', marginTop: '0.125rem', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#666', lineHeight: '1.4' }}>
                        I agree to receive WhatsApp and email updates about events and community news.
                      </span>
                    </label>

                    {/* Bio */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>Tell us about yourself (optional)</label>
                      <textarea 
                        name="bio" 
                        value={formData.bio} 
                        onChange={handleInputChange} 
                        placeholder="Share a bit about yourself..." 
                        style={{ width: '100%', padding: '0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box', minHeight: '100px', fontFamily: 'inherit' }} 
                      />
                    </div>
                  </div>
                )}

                {currentStep === 3 && formData.memberType === 'member' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>All set!</h2>
                    <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>Your member account has been created successfully. Complete your signup to access your dashboard.</p>
                    
                    <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                      <p style={{ fontSize: '0.875rem', color: '#166534', fontWeight: 600 }}>Welcome to Passive Blessings!</p>
                      <p style={{ fontSize: '0.875rem', color: '#166534', marginTop: '0.5rem' }}>You can become a volunteer or sponsor by filling out forms from your member dashboard.</p>
                    </div>
                  </div>
                )}

                {currentStep === 3 && formData.memberType === 'business' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>Business profile</h2>
                    <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>Complete your business information to activate your business account.</p>
                    
                    {/* Business Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>Business Name *</label>
                      <input 
                        type="text" 
                        name="businessName" 
                        value={formData.businessName} 
                        onChange={handleInputChange} 
                        placeholder="Your company name" 
                        style={{ width: '100%', padding: '0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box' }} 
                      />
                    </div>

                    {/* Business Type */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>Business Type *</label>
                      <select 
                        name="businessType" 
                        value={formData.businessType} 
                        onChange={handleInputChange} 
                        style={{ width: '100%', padding: '0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box' }}
                      >
                        <option value="">Select business type</option>
                        <option value="nonprofit">Non-profit Organization</option>
                        <option value="social">Social Enterprise</option>
                        <option value="corporation">Corporation</option>
                        <option value="small-business">Small Business</option>
                        <option value="freelance">Freelance/Consultant</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Business Registration */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>Registration Number (optional)</label>
                      <input 
                        type="text" 
                        name="businessRegistration" 
                        value={formData.businessRegistration} 
                        onChange={handleInputChange} 
                        placeholder="Business registration number" 
                        style={{ width: '100%', padding: '0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box' }} 
                      />
                    </div>

                    {/* Business Location */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>Business Location *</label>
                      <input 
                        type="text" 
                        name="businessLocation" 
                        value={formData.businessLocation} 
                        onChange={handleInputChange} 
                        placeholder="City/Emirate or address" 
                        style={{ width: '100%', padding: '0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box' }} 
                      />
                    </div>

                    {/* Business Description */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>About Your Business (optional)</label>
                      <textarea 
                        name="businessDescription" 
                        value={formData.businessDescription} 
                        onChange={handleInputChange} 
                        placeholder="Tell us about your business..." 
                        style={{ width: '100%', padding: '0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit' }} 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1 || isLoading}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #e4e1da',
                    backgroundColor: '#ffffff',
                    color: '#111111',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: currentStep === 1 || isLoading ? 0.5 : 1,
                  }}
                >
                  Back
                </button>

                {currentStep < STEPS.length ? (
                  <button
                    type="button"
                    onClick={() => handleStepChange(currentStep + 1)}
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: 'none',
                      backgroundColor: '#111111',
                      color: '#ffffff',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      opacity: isLoading ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {isLoading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: 'none',
                      backgroundColor: '#111111',
                      color: '#ffffff',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      opacity: isLoading ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                )}
              </div>
            </form>

            <p style={{ fontSize: '0.75rem', color: '#888', textAlign: 'center', marginTop: '1rem' }}>
              Already have an account? <Link href="/login" style={{ color: '#111111', fontWeight: 600, textDecoration: 'underline' }}>Sign in</Link>
            </p>
          </div>
        </div>

        {/* Right Info Column */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:w-[380px] flex-shrink-0 bg-[#f7f6f2] p-8">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111111' }}>Why join Passive Blessings?</h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              'Support community causes and charities',
              'Connect with like-minded people',
              'Volunteer or sponsor opportunities',
              'Access exclusive member benefits',
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem', color: '#666' }}>
                <span style={{ fontWeight: 'bold', color: '#111111' }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
