'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { setDoc, doc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Logo } from '@/components/logo'
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { logActivity } from '@/lib/activity-logger'

interface FormData {
  memberType: string
  firstName: string
  middleName: string
  lastName: string
  dateOfBirth: string
  gender: string
  nationality: string
  emiratesId: string
  country: string
  emirate: string
  city: string
  area: string
  postalCode: string
  address: string
  email: string
  whatsappNumber: string
  password: string
  confirmPassword: string
  occupation: string
  employer: string
  skills: string[]
  volunteerDays: string[]
  hoursPerMonth: string
  preferredDepartment: string
  referralSource: string
  referralMemberName: string
  motivation: string
  businessName: string
  businessType: string
  businessDescription: string
  consentTerms: boolean
  consentPrivacy: boolean
  consentLocation: boolean
  consentNotifications: boolean
}

const STEPS = [
  { id: 1, label: 'Personal info & account' },
  { id: 2, label: 'Verify & activate' },
  { id: 3, label: 'Add business profile (optional)' },
]

const SKILLS = ['Tech/IT', 'Marketing', 'Design', 'Finance', 'Teaching/Training', 'Medical/Health', 'Legal', 'Events Management', 'Media/PR', 'Logistics', 'Admin/Operations', 'Social work', 'Other']
const DEPARTMENTS = ['Select dept.', 'Community Support', 'Event Management', 'Volunteer Training', 'Fundraising', 'Administration', 'Marketing', 'Operations']

// Wrap in error boundary
class ErrorBoundary extends React.Component<any, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: any) {
    console.error("[v0] Error boundary caught error:", error)
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("[v0] Error details:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f6f2', flexDirection: 'column', padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '1rem' }}>Error Loading Signup</h1>
          <p style={{ color: '#991b1b', marginBottom: '1rem', maxWidth: '500px' }}>{this.state.error?.message || 'An error occurred while loading the signup form'}</p>
          <a href="/" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#111111', color: '#ffffff', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600 }}>Go Home</a>
        </div>
      )
    }

    return this.props.children
  }
}

function SignupPageContent() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Log signup page visit on mount - wrap in try catch
  useEffect(() => {
    console.log("[v0] Signup page mounted, current step:", currentStep)
    try {
      logActivity('guest', 'guest@passiveblessings.com', 'SIGNUP_PAGE_VISIT', 'Visited signup page', { 
        timestamp: new Date().toISOString(),
        step: 1 
      })
    } catch (err) {
      console.error("[v0] Error logging activity:", err)
      // Don't block signup if logging fails
    }
  }, [])

  const [formData, setFormData] = useState<FormData>({
    memberType: 'general',
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    nationality: 'Emirati',
    emiratesId: '',
    country: 'United Arab Emirates',
    emirate: 'Dubai',
    city: 'Dubai City',
    area: '',
    postalCode: '',
    address: '',
    email: '',
    whatsappNumber: '',
    password: '',
    confirmPassword: '',
    occupation: '',
    employer: '',
    skills: [],
    volunteerDays: [],
    hoursPerMonth: '',
    preferredDepartment: '',
    referralSource: 'Select source',
    referralMemberName: '',
    motivation: '',
    businessName: '',
    businessType: '',
    businessDescription: '',
    consentTerms: false,
    consentPrivacy: false,
    consentLocation: false,
    consentNotifications: false,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFormData(prev => ({ ...prev, [name]: newValue }))
  }

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill]
    }))
  }

  const handleVolunteerDaysToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      volunteerDays: prev.volunteerDays.includes(day) ? prev.volunteerDays.filter(d => d !== day) : [...prev.volunteerDays, day]
    }))
  }

  // Log step changes
  const handleStepChange = (nextStep: number) => {
    logActivity('guest', 'guest@passiveblessings.com', 'SIGNUP_STEP', `Moved to step ${nextStep}`, { 
      previousStep: currentStep,
      currentStep: nextStep,
      formDataFields: Object.keys(formData).length,
      timestamp: new Date().toISOString()
    })
    setCurrentStep(nextStep)
  }
  }

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill]
    }))
  }

  const handleVolunteerDaysToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      volunteerDays: prev.volunteerDays.includes(day) ? prev.volunteerDays.filter(d => d !== day) : [...prev.volunteerDays, day]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.firstName || !formData.lastName || !formData.email) {
      const validationError = 'Please fill in all required fields'
      setError(validationError)
      logActivity('guest', formData.email || 'guest@passiveblessings.com', 'OTHER', 'Validation error - missing required fields', { 
        error: validationError,
        fields: { firstName: !!formData.firstName, lastName: !!formData.lastName, email: !!formData.email }
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      const validationError = 'Passwords do not match'
      setError(validationError)
      logActivity('guest', formData.email, 'OTHER', 'Validation error - passwords mismatch', { error: validationError })
      return
    }

    if (formData.password.length < 6) {
      const validationError = 'Password must be at least 6 characters'
      setError(validationError)
      logActivity('guest', formData.email, 'OTHER', 'Validation error - weak password', { error: validationError, passwordLength: formData.password.length })
      return
    }

    if (!formData.consentTerms || !formData.consentPrivacy) {
      const validationError = 'Please accept terms and privacy policy'
      setError(validationError)
      logActivity('guest', formData.email, 'OTHER', 'Validation error - missing consent', { 
        error: validationError,
        consents: { terms: formData.consentTerms, privacy: formData.consentPrivacy }
      })
      return
    }

    setLoading(true)
    logActivity('guest', formData.email, 'SIGNUP_START', 'Starting signup process', { 
      memberType: formData.memberType,
      timestamp: new Date().toISOString()
    })

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const user = userCredential.user

      const userData = {
        id: user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        nationality: formData.nationality,
        emiratesId: formData.emiratesId,
        location: {
          country: formData.country,
          emirate: formData.emirate,
          city: formData.city,
          area: formData.area,
          postalCode: formData.postalCode,
          address: formData.address,
        },
        phone: formData.whatsappNumber,
        whatsappNumber: formData.whatsappNumber,
        profession: formData.occupation,
        employer: formData.employer,
        skills: formData.skills,
        role: formData.memberType === 'general' ? 'member' : formData.memberType === 'volunteer' ? 'volunteer' : 'member',
        memberType: formData.memberType,
        volunteerAvailability: {
          days: formData.volunteerDays,
          hoursPerMonth: parseInt(formData.hoursPerMonth) || 0,
          preferredDepartment: formData.preferredDepartment,
        },
        referralSource: formData.referralSource,
        referralMemberName: formData.referralMemberName,
        motivation: formData.motivation,
        businessProfile: formData.memberType === 'business' ? {
          businessName: formData.businessName,
          businessType: formData.businessType,
          businessDescription: formData.businessDescription,
        } : undefined,
        consentTerms: formData.consentTerms,
        consentPrivacy: formData.consentPrivacy,
        consentLocation: formData.consentLocation,
        consentNotifications: formData.consentNotifications,
        consentWhatsapp: formData.consentNotifications,
        volunteeredHours: 0,
        totalDonated: 0,
        membershipTier: 'standard',
        active: true,
        emailVerified: false,
        profileComplete: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await setDoc(doc(db, 'users', user.uid), userData)
      
      // Log successful signup
      logActivity(user.uid, formData.email, 'SIGNUP_COMPLETE', 'Successfully created account', { 
        userId: user.uid,
        memberType: formData.memberType,
        location: formData.city,
        hasVolunteerAvailability: formData.volunteerDays.length > 0,
        totalFormFields: Object.keys(userData).length,
        timestamp: new Date().toISOString()
      })

      router.push('/dashboard')
    } catch (err: any) {
      const errorMsg = err.message || 'Registration failed'
      setError(errorMsg)
      logActivity('guest', formData.email, 'OTHER', 'Signup failed', { 
        error: errorMsg,
        errorCode: err.code,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Member Type */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', color: '#666', letterSpacing: '0.05em' }}>I want to join as</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { value: 'general', label: 'General Member', desc: 'Community events, charity' },
                  { value: 'volunteer', label: 'Volunteer', desc: 'Contribute your time & skills' },
                  { value: 'member-volunteer', label: 'Member + Volunteer', desc: 'Full access & give back' },
                ].map(option => (
                  <label key={option.value} style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: `2px solid ${formData.memberType === option.value ? '#111111' : '#e4e1da'}`, borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <input type="radio" name="memberType" value={option.value} checked={formData.memberType === option.value} onChange={handleInputChange} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                    <div style={{ marginLeft: '1rem' }}>
                      <p style={{ fontWeight: 600, color: '#111111', marginBottom: '0.25rem' }}>{option.label}</p>
                      <p style={{ fontSize: '0.875rem', color: '#666' }}>{option.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', color: '#666', letterSpacing: '0.05em' }}>Personal Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <input type="text" name="firstName" placeholder="First name" value={formData.firstName} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} required />
                <input type="text" name="middleName" placeholder="Middle name - Optional" value={formData.middleName} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
                <input type="text" name="lastName" placeholder="Last name" value={formData.lastName} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} required />
                <select name="gender" value={formData.gender} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <select name="nationality" value={formData.nationality} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="Emirati">Emirati</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <input type="text" name="emiratesId" placeholder="Emirates ID number - correct ID format, required for volunteer verification" value={formData.emiratesId} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', color: '#666', letterSpacing: '0.05em' }}>Location - select your country, then in step — each selection narrows the next dropdown. This helps us connect you with local events and opportunities, and community members in your area.</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <select name="country" value={formData.country} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                </select>
                <select name="emirate" value={formData.emirate} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="Dubai">Dubai</option>
                  <option value="Abu Dhabi">Abu Dhabi</option>
                  <option value="Sharjah">Sharjah</option>
                  <option value="Ajman">Ajman</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <select name="city" value={formData.city} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="Dubai City">Dubai City</option>
                  <option value="Deira">Deira</option>
                  <option value="Bur Dubai">Bur Dubai</option>
                </select>
                <select name="area" onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="">Select area</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <input type="text" name="postalCode" placeholder="P.O. Box / Postal code - optional" value={formData.postalCode} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
                <input type="text" name="address" placeholder="Full address / Building name - optional" value={formData.address} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Account Credentials */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', color: '#666', letterSpacing: '0.05em' }}>Account Credentials</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <input type="email" name="email" placeholder="Email address" value={formData.email} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} required />
                <input type="tel" name="whatsappNumber" placeholder="WhatsApp number" value={formData.whatsappNumber} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <input type="password" name="password" placeholder="Create password - Min 6 chars, 1 number, 1 symbol" value={formData.password} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} required />
                <input type="password" name="confirmPassword" placeholder="Re-enter your password" value={formData.confirmPassword} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} required />
              </div>
            </div>

            {/* Professional Background */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', color: '#666', letterSpacing: '0.05em' }}>Professional Background - optional, helps match you to opportunities</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <input type="text" name="occupation" placeholder="Job title / Occupation" value={formData.occupation} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
                <input type="text" name="employer" placeholder="Employer / Company / University" value={formData.employer} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111' }}>Skills - select all that apply</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {SKILLS.map(skill => (
                    <button key={skill} type="button" onClick={() => handleSkillToggle(skill)} style={{ padding: '0.5rem 1rem', backgroundColor: formData.skills.includes(skill) ? '#111111' : '#f7f6f2', color: formData.skills.includes(skill) ? '#ffffff' : '#111111', border: 'none', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Volunteer Availability */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', color: '#666', letterSpacing: '0.05em' }}>Volunteer Availability - only if volunteering</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                {['Weekends', 'Weekdays', 'Flexible'].map(day => (
                  <button key={day} type="button" onClick={() => handleVolunteerDaysToggle(day)} style={{ padding: '0.75rem 1rem', backgroundColor: formData.volunteerDays.includes(day) ? '#111111' : '#f7f6f2', color: formData.volunteerDays.includes(day) ? '#ffffff' : '#111111', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>
                    {day}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <input type="number" name="hoursPerMonth" placeholder="Hours per month" value={formData.hoursPerMonth} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
                <select name="preferredDepartment" value={formData.preferredDepartment} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* How You Found Us */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', color: '#666', letterSpacing: '0.05em' }}>How You Found Us</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <select name="referralSource" value={formData.referralSource} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="Select source">Select source</option>
                  <option value="Member Referral">Member Referral</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Event">Event</option>
                  <option value="Other">Other</option>
                </select>
                <input type="text" name="referralMemberName" placeholder="Referral code or member name - Optional" value={formData.referralMemberName} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Motivation */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', color: '#666', letterSpacing: '0.05em' }}>Why do you want to join Passive Blessings?</h3>
              <textarea name="motivation" placeholder="Tell us a little about your motivation..." value={formData.motivation} onChange={handleInputChange} style={{ width: '100%', padding: '1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box', minHeight: '100px', fontFamily: 'system-ui' }} />
            </div>

            {/* Consents & Agreement */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', color: '#666', letterSpacing: '0.05em' }}>Consent & Agreement</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="consentTerms" checked={formData.consentTerms} onChange={handleInputChange} style={{ marginTop: '0.25rem', cursor: 'pointer', width: '18px', height: '18px' }} required />
                  <span style={{ fontSize: '0.875rem', color: '#111111' }}>I agree to the <Link href="/policies/terms-of-service" target="_blank" style={{ textDecoration: 'underline', fontWeight: 600, color: '#111111' }}>Terms & Conditions</Link> and <Link href="/policies/code-of-conduct" target="_blank" style={{ textDecoration: 'underline', fontWeight: 600, color: '#111111' }}>Community Code of Conduct</Link> of Passive Blessings.</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="consentPrivacy" checked={formData.consentPrivacy} onChange={handleInputChange} style={{ marginTop: '0.25rem', cursor: 'pointer', width: '18px', height: '18px' }} required />
                  <span style={{ fontSize: '0.875rem', color: '#111111' }}>I consent to my personal data being stored and processed in accordance with the <Link href="/policies/privacy-policy" target="_blank" style={{ textDecoration: 'underline', fontWeight: 600, color: '#111111' }}>Privacy Policy</Link>. My data is encrypted and will not be shared with third parties.</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="consentLocation" checked={formData.consentLocation} onChange={handleInputChange} style={{ marginTop: '0.25rem', cursor: 'pointer', width: '18px', height: '18px' }} required />
                  <span style={{ fontSize: '0.875rem', color: '#111111' }}>I confirm my location details are accurate and consent to being connected with local community events and members in my area.</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="consentNotifications" checked={formData.consentNotifications} onChange={handleInputChange} style={{ marginTop: '0.25rem', cursor: 'pointer', width: '18px', height: '18px' }} />
                  <span style={{ fontSize: '0.875rem', color: '#111111' }}>I agree to receive WhatsApp and email updates about upcoming events, opportunities, and community news.</span>
                </label>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#166534', fontWeight: 600 }}>Optional: Add your business profile</p>
              <p style={{ fontSize: '0.875rem', color: '#166534', marginTop: '0.5rem' }}>Complete this section anytime in your dashboard</p>
            </div>

            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', color: '#666', letterSpacing: '0.05em' }}>Business Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <input type="text" name="businessName" placeholder="Business name" value={formData.businessName} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
                <select name="businessType" value={formData.businessType} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}>
                  <option value="">Select business type</option>
                  <option value="Retail">Retail</option>
                  <option value="Services">Services</option>
                  <option value="Technology">Technology</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <textarea name="businessDescription" placeholder="Brief description of your business" value={formData.businessDescription} onChange={handleInputChange} style={{ width: '100%', padding: '1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box', minHeight: '100px', fontFamily: 'system-ui' }} />
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#f7f6f2', borderRadius: '0.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>Your data is encrypted and securely stored • Passive Blessings • ESTD 2025 • Dubai, UAE</p>
            </div>
          </div>
        )

      default:
        return null
    }

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      {console.log("[v0] Rendering signup page, currentStep:", currentStep)}
      {/* Header */}
      <div style={{ width: '100%', padding: '1rem', borderBottom: '1px solid #e4e1da' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <div style={{ height: '32px' }}>
            <Logo size="sm" href="/" />
          </div>
          <Link href="/login" style={{ fontSize: '1rem', fontWeight: 500, color: '#111111', textDecoration: 'none' }}>
            Sign In
          </Link>
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

            {/* Error */}
            {error && (
              <div style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', display: 'flex', gap: '0.75rem' }}>
                <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626', flexShrink: 0 }} />
                <p style={{ fontSize: '0.875rem', color: '#991b1b' }}>{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '2rem' }}>
                {renderStep()}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                {currentStep > 1 && (
                  <button type="button" onClick={() => handleStepChange(currentStep - 1)} style={{ flex: 1, padding: '1rem', border: '1px solid #e4e1da', backgroundColor: '#ffffff', color: '#111111', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <ChevronLeft size={20} /> Back
                  </button>
                )}

                {currentStep < STEPS.length ? (
                  <button type="button" onClick={() => handleStepChange(currentStep + 1)} style={{ flex: 1, padding: '1rem', backgroundColor: '#111111', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    Next <ChevronRight size={20} />
                  </button>
                ) : (
                  <button type="submit" disabled={loading} style={{ flex: 1, padding: '1rem', backgroundColor: loading ? '#cccccc' : '#111111', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Creating account...' : 'Create account & continue'}
                  </button>
                )}
              </div>

              <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#666' }}>
                Already a member? <Link href="/login" style={{ textDecoration: 'underline', fontWeight: 600, color: '#111111' }}>Sign in</Link>
              </p>
            </form>
          </div>
        </div>

        {/* Right Sidebar - Hidden on mobile */}
        <div style={{ flex: 1, padding: '2rem 1rem', backgroundColor: '#111111', color: '#ffffff', display: 'none', '@media (min-width: 1024px)': { display: 'flex' }, flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Registration progress</p>
            <div style={{ height: '4px', width: `${(currentStep / STEPS.length) * 100}%`, backgroundColor: '#ffffff', borderRadius: '9999px', marginBottom: '2rem' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {STEPS.map((step, idx) => (
                <p key={step.id} style={{ fontSize: '0.875rem', opacity: currentStep > idx ? 1 : 0.5, fontWeight: currentStep === step.id ? 700 : 400 }}>
                  {step.id}. {step.label}
                </p>
              ))}
            </div>
          </div>

          <div style={{ paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>What happens after you register</p>
            <ul style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>Email verification - Check your inbox to confirm your account</li>
              <li>WhatsApp welcome - Receive a personalized welcome message from the PB team</li>
              <li>Instant dashboard access - Log in to your member dashboard immediately</li>
              <li>Add your business (optional) - Complete your dashboard anytime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export wrapped with error boundary
export default function SignupPage() {
  return (
    <ErrorBoundary>
      <SignupPageContent />
    </ErrorBoundary>
  )
}
