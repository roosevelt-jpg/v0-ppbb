'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Loader2, Eye, EyeOff } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Personal info & account' },
  { id: 2, label: 'Verify & activate' },
  { id: 3, label: 'Add business profile (optional)' },
]

const SKILLS = ['Tech/IT', 'Marketing', 'Design', 'Finance', 'Teaching/Training', 'Medical/Health', 'Legal', 'Events Management', 'Media/PR', 'Logistics', 'Admin/Operations', 'Social work', 'Other']

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Fujairah', 'Ras Al Khaimah', 'Umm Al Quwain']

export default function SignupClient() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [formData, setFormData] = useState({
    memberType: 'member',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    country: 'United Arab Emirates',
    emirate: 'Dubai',
    skills: [] as string[],
    bio: '',
    consentTerms: false,
    consentPrivacy: false,
    // Business fields (Step 3)
    businessName: '',
    businessType: '',
    businessRegistration: '',
    businessLocation: '',
    businessDescription: '',
    wantsBusiness: false,
  })

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
      if (!formData.email.trim()) {
        setError('Email is required')
        return false
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address')
        return false
      }
      
      // Check email uniqueness by querying Firestore
      try {
        const emailQuery = query(collection(db, 'users'), where('email', '==', formData.email.toLowerCase()))
        const emailSnapshot = await getDocs(emailQuery)
        if (!emailSnapshot.empty) {
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
      if (!formData.emirate) {
        setError('Please select your emirate')
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

      // Update profile with display name
      await updateProfile(firebaseUser, {
        displayName: `${formData.firstName} ${formData.lastName}`
      })

      // Create user document in Firestore with proper schema
      const userDocRef = doc(db, 'users', firebaseUser.uid)
      
      const userData: any = {
        // Auth info (Firebase Auth manages email/password, we reference UID)
        uid: firebaseUser.uid,
        email: formData.email.toLowerCase(),
        createdAt: now,
        dateJoined: now, // Explicitly track when user joined
        updatedAt: now,

        // Display info (stored in Firestore per golden rule)
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        country: formData.country,
        emirate: formData.emirate,
        location: formData.emirate, // For location-based queries
        bio: formData.bio,
        skills: formData.skills,

        // Role management
        role: formData.wantsBusiness ? 'business' : formData.memberType,
        roles: formData.wantsBusiness ? ['business', 'member'] : [formData.memberType],

        // User preferences
        language: 'en',
        timezone: 'Asia/Dubai',

        // Status flags
        emailVerified: false,
        phoneVerified: false,
        profileComplete: currentStep >= 2,
        status: 'active',

        // Avatar URL (when they upload, stored as URL per golden rule)
        avatarUrl: null,

        // Empty initially, filled when user uploads files
        documentUrls: {
          idVerification: null,
          addressProof: null,
        },
        
        // Volunteer tracking
        volunteerHours: 0,
      }
      
      // Add business profile if user selected it
      if (formData.wantsBusiness) {
        userData.business = {
          name: formData.businessName,
          type: formData.businessType,
          registration: formData.businessRegistration,
          location: formData.businessLocation,
          description: formData.businessDescription,
          createdAt: now,
        }
      }
      
      await setDoc(userDocRef, userData, { merge: false })

      console.log('[v0] User account created successfully:', firebaseUser.uid)

      // Show success message and redirect to dashboard
      setError('')
      // Automatically redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
      
      // Show success state
      setFormData(prev => ({ ...prev, email: 'success' }))
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
                    
                    {/* Member Type */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', color: '#666' }}>I want to join as</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {[
                          { value: 'member', label: 'Member', desc: 'Community events & charity' },
                          { value: 'volunteer', label: 'Volunteer', desc: 'Member + contribute time & skills' },
                          { value: 'sponsor', label: 'Sponsor', desc: 'Support & partner opportunities' },
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
                        <span style={{ fontSize: '0.75rem', color: '#666', lineHeight: '1.4' }}>I agree to the <Link href="/terms" style={{ color: '#111111', fontWeight: 600, textDecoration: 'underline' }}>Terms of Service</Link> *</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" name="consentPrivacy" checked={formData.consentPrivacy} onChange={handleInputChange} style={{ width: '16px', height: '16px', marginTop: '0.125rem', cursor: 'pointer', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.75rem', color: '#666', lineHeight: '1.4' }}>I agree to the <Link href="/privacy" style={{ color: '#111111', fontWeight: 600, textDecoration: 'underline' }}>Privacy Policy</Link> *</span>
                      </label>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>Complete your profile</h2>

                    {/* Phone */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>Phone Number *</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+971 50 1234567" style={{ width: '100%', padding: '0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                    </div>

                    {/* Emirate */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem', color: '#111111' }}>Your Emirate *</label>
                      <select name="emirate" value={formData.emirate} onChange={handleInputChange} style={{ width: '100%', padding: '0.625rem', border: '1px solid #e4e1da', borderRadius: '0.375rem', fontSize: '0.875rem', boxSizing: 'border-box' }}>
                        {EMIRATES.map(em => (
                          <option key={em} value={em}>{em}</option>
                        ))}
                      </select>
                    </div>

                    {/* Skills (if volunteer/sponsor) */}
                    {(formData.memberType === 'volunteer' || formData.memberType === 'sponsor') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111111' }}>Your Skills (optional)</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                          {SKILLS.map(skill => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => handleSkillToggle(skill)}
                              style={{
                                padding: '0.375rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                border: `1px solid ${formData.skills.includes(skill) ? '#111111' : '#e4e1da'}`,
                                backgroundColor: formData.skills.includes(skill) ? '#111111' : '#ffffff',
                                color: formData.skills.includes(skill) ? '#ffffff' : '#111111',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

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

                {currentStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>Business profile (optional)</h2>
                    <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>You can add a business profile now or skip this for later. You can always upgrade to a business account from your dashboard.</p>
                    
                    {/* Business Option Checkbox */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem', backgroundColor: '#f7f6f2', borderRadius: '0.375rem' }}>
                      <input 
                        type="checkbox" 
                        name="wantsBusiness" 
                        checked={formData.wantsBusiness} 
                        onChange={handleInputChange} 
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                      />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111111' }}>Yes, I want to register a business</span>
                    </label>

                    {/* Business Form Fields (shown only if wantsBusiness is checked) */}
                    {formData.wantsBusiness && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', paddingTop: '0.5rem', borderTop: '1px solid #e4e1da' }}>
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

                    {!formData.wantsBusiness && (
                      <div style={{ padding: '1rem', backgroundColor: '#f7f6f2', borderRadius: '0.5rem', border: '1px solid #e4e1da' }}>
                        <p style={{ fontSize: '0.875rem', color: '#666', fontWeight: 600 }}>Your personal account is ready to go!</p>
                        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>You can add a business profile anytime from your dashboard.</p>
                      </div>
                    )}
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
        <div style={{ display: 'none', width: '380px', backgroundColor: '#f7f6f2', padding: '2rem', '@media (min-width: 1024px)': { display: 'flex' }, flexDirection: 'column', justifyContent: 'center' }}>
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
