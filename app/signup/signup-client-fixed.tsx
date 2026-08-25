'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { collection, doc, setDoc, getDoc, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Check, Loader2, Eye, EyeOff } from 'lucide-react'
import { SiteLogo } from '@/components/site-logo'
import { SearchableSelect } from '@/components/searchable-select'
import { COUNTRY_OPTIONS } from '@/lib/countries'
import { isUaeCountry } from '@/lib/signup-locations'
import {
  AddressLocationPicker,
  type AddressLocationValue,
} from '@/components/address-location-picker'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import type { LocationData } from '@/lib/types'
import type { PricingPlan } from '@/lib/pricing-types'
import {
  formatPlanPriceDetailed,
  getPlanIncludedItems,
  inferSignupTypeFromPlan,
  resolveActiveGateway,
  type ConfiguredGateways,
} from '@/lib/pricing-utils'
import { getReferralCodeFromDocument } from '@/lib/referral-cookie'
import { Dialog } from '@/components/dialog'
import { StripeCardCheckout } from '@/components/stripe-card-checkout'

const STEPS = [
  { id: 1, label: 'Choose membership' },
  { id: 2, label: 'Personal info & account' },
  { id: 3, label: 'Location & profile' },
  { id: 4, label: 'Complete profile' },
  { id: 5, label: 'Subscribe to plan' },
]

const DEFAULT_SIDEBAR_PERKS = [
  'Support community causes and charities',
  'Connect with like-minded people',
  'Volunteer or sponsor opportunities',
  'Access exclusive member benefits',
]

const SKILLS = ['Tech/IT', 'Marketing', 'Design', 'Finance', 'Teaching/Training', 'Medical/Health', 'Legal', 'Events Management', 'Media/PR', 'Logistics', 'Admin/Operations', 'Social work', 'Other']

const COUNTRY_SELECT_OPTIONS = COUNTRY_OPTIONS.map((c) => ({ value: c.name, label: c.name }))
const NATIONALITY_OPTIONS = COUNTRY_OPTIONS.map((c) => ({ value: c.name, label: c.name }))

export default function SignupClient() {
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [formData, setFormData] = useState({
    memberType: searchParams.get('type') === 'business' ? 'business' : 'member',
    planId: searchParams.get('plan') || '',
    promoCode: (searchParams.get('promo') || searchParams.get('code') || '').toUpperCase(),
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
    latitude: 0,
    longitude: 0,
    placeId: '',
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

  const [planName, setPlanName] = useState('')
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [createdUserId, setCreatedUserId] = useState<string | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [gateways, setGateways] = useState<ConfiguredGateways>({
    stripe: true,
    paypal: false,
    ziina: false,
  })
  const [stripePublishableKey, setStripePublishableKey] = useState<string | null>(null)
  const [activeIntent, setActiveIntent] = useState<{
    clientSecret: string
    mode: 'payment' | 'setup'
  } | null>(null)
  const [businessAddress, setBusinessAddress] = useState<AddressLocationValue>({
    country: 'United Arab Emirates',
    countryCode: 'AE',
    emirate: 'Dubai',
    city: 'Dubai',
    customCity: '',
    address: '',
    venueName: '',
    placeId: '',
    lat: 0,
    lng: 0,
  })

  useEffect(() => {
    fetch('/api/checkout/gateways')
      .then((r) => r.json())
      .then((json) => {
        if (json?.data) setGateways(json.data)
        if (json?.data?.stripePublishableKey) setStripePublishableKey(json.data.stripePublishableKey)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'pricingPlans'), where('active', '==', true))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as PricingPlan))
          .sort((a, b) => (a.order || 0) - (b.order || 0))
        setPlans(list)
        setPlansLoading(false)
      },
      () => setPlansLoading(false)
    )
    return () => unsub()
  }, [])

  useEffect(() => {
    if (searchParams.get('type') === 'business') {
      setFormData((prev) =>
        prev.memberType === 'business' ? prev : { ...prev, memberType: 'business' }
      )
    }
    const planId = searchParams.get('plan') || ''
    if (planId) {
      setFormData((prev) => (prev.planId === planId ? prev : { ...prev, planId }))
      setCurrentStep((s) => (s === 1 ? 2 : s))
    }
  }, [searchParams])

  useEffect(() => {
    const planId = formData.planId || searchParams.get('plan')
    if (!planId) {
      setPlanName('')
      return
    }
    const fromList = plans.find((p) => p.id === planId)
    if (fromList) {
      setPlanName(fromList.name)
      const nextType = inferSignupTypeFromPlan(fromList)
      setFormData((prev) =>
        prev.planId === planId && prev.memberType === nextType
          ? prev
          : { ...prev, planId, memberType: nextType }
      )
      return
    }
    getDoc(doc(db, 'pricingPlans', planId))
      .then((snap) => {
        if (!snap.exists()) return
        const data = snap.data() as PricingPlan
        setPlanName(String(data?.name || ''))
        const nextType = inferSignupTypeFromPlan(data)
        setFormData((prev) =>
          prev.planId === planId && prev.memberType === nextType
            ? prev
            : { ...prev, planId, memberType: nextType }
        )
      })
      .catch(() => {})
  }, [formData.planId, plans, searchParams])

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === formData.planId) || null,
    [plans, formData.planId]
  )

  const sidebarPerks = useMemo(() => {
    if (selectedPlan) {
      const items = getPlanIncludedItems(selectedPlan)
      if (items.length) return items
    }
    return DEFAULT_SIDEBAR_PERKS
  }, [selectedPlan])

  const selectPlan = (plan: PricingPlan) => {
    setFormData((prev) => ({
      ...prev,
      planId: plan.id,
      memberType: inferSignupTypeFromPlan(plan),
    }))
    setPlanName(plan.name)
    setError('')
  }

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
      if (!formData.planId) {
        setError('Please choose a membership package to continue')
        return false
      }
      return true
    }
    
    if (step === 2) {
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

    if (step === 3) {
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

    if (step === 4 && formData.memberType === 'business') {
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

    if (step === 5) {
      if (!formData.planId) {
        setError('Please select a membership tier to subscribe')
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

  type PromoRedeemOutcome =
    | { ok: true; kind: 'redirect'; url: string }
    | { ok: true; kind: 'card'; clientSecret: string; mode: 'payment' | 'setup' }
    | { ok: false; error: string }

  const tryRedeemPromo = async (userId: string): Promise<PromoRedeemOutcome> => {
    const code = formData.promoCode.trim()
    if (!code) return { ok: false, error: '' }
    const firebaseUser = auth.currentUser
    if (!firebaseUser || firebaseUser.uid !== userId) {
      return { ok: false, error: 'Sign in required to redeem promo' }
    }
    const idToken = await firebaseUser.getIdToken()
    const res = await fetch('/api/membership/redeem-promo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      return { ok: false, error: data.error || 'Promo code could not be applied' }
    }
    // Align selected plan with what the promo granted
    if (data.data?.planId) {
      setFormData((prev) => ({ ...prev, planId: data.data.planId }))
      if (data.data.planName) setPlanName(String(data.data.planName))
    }
    // A trial-enabled code isn't active yet — show the embedded card form.
    // Otherwise the code granted the plan directly.
    if (data.data?.clientSecret) {
      return { ok: true, kind: 'card', clientSecret: data.data.clientSecret, mode: data.data.intentMode || 'setup' }
    }
    return {
      ok: true,
      kind: 'redirect',
      url: data.data?.membershipUrl || '/dashboard/membership?status=success',
    }
  }

  /** Shared handling for a successful tryRedeemPromo() result — shows the
   * embedded card form for a trial code, or redirects for a direct grant. */
  const applyPromoOutcome = (redeemed: Extract<PromoRedeemOutcome, { ok: true }>) => {
    if (redeemed.kind === 'card') {
      setActiveIntent({ clientSecret: redeemed.clientSecret, mode: redeemed.mode })
      return
    }
    window.location.href = redeemed.url
  }

  const handleSubscribe = async () => {
    if (!(await validateStep(5))) return
    const userId = createdUserId || auth.currentUser?.uid
    if (!userId || !formData.planId) {
      setError('Account or plan missing. Please go back and complete signup.')
      return
    }
    setCheckingOut(true)
    setError('')
    try {
      if (formData.promoCode.trim()) {
        const redeemed = await tryRedeemPromo(userId)
        if (redeemed.ok) {
          applyPromoOutcome(redeemed)
          setCheckingOut(false)
          return
        }
        // Promo failed — show message, still allow paid checkout
        if (redeemed.error) {
          setError(`${redeemed.error}. You can still subscribe with payment below, or fix the code and try again.`)
        }
      }

      const plan = selectedPlan || plans.find((p) => p.id === formData.planId)
      const gateway = plan ? resolveActiveGateway(plan, gateways) : 'stripe'
      if (!gateway) {
        throw new Error('No payment method is configured yet. Please contact support.')
      }
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: formData.planId,
          userId,
          gateway,
          referralCode: getReferralCodeFromDocument(),
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed')
      }

      if (gateway === 'stripe') {
        if (!data.clientSecret) throw new Error('Stripe did not return a client secret')
        setActiveIntent({ clientSecret: data.clientSecret, mode: data.mode || 'payment' })
        setCheckingOut(false)
        return
      }

      if (!data.checkoutUrl) {
        throw new Error(data.error || 'Checkout failed')
      }
      window.location.href = data.checkoutUrl
    } catch (err) {
      console.error('[signup] checkout:', err)
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setCheckingOut(false)
    }
  }

  const buildUserPayload = (uid: string) => {
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
      address: formData.address || '',
      placeId: formData.placeId || '',
      latitude: formData.latitude || undefined,
      longitude: formData.longitude || undefined,
      lat: formData.latitude || 0,
      lng: formData.longitude || 0,
    }) as LocationData

    const userData: Record<string, unknown> = {
      uid,
      email: formData.email.toLowerCase(),
      createdAt: now,
      dateJoined: now,
      memberSince: now,
      updatedAt: now,
      firstName: formData.firstName,
      lastName: formData.lastName,
      displayName: `${formData.firstName} ${formData.lastName}`.trim(),
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
      membershipStatus: 'pending_payment',
      membershipTier: formData.planId || planName || 'standard',
      membershipPlanId: formData.planId || null,
      membershipPlanName: planName || null,
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

    if (formData.memberType === 'business') {
      userData.business = {
        name: formData.businessName,
        type: formData.businessType,
        registration: formData.businessRegistration || null,
        location: formData.businessLocation,
        description: formData.businessDescription || null,
        placeId: businessAddress.placeId || null,
        latitude: businessAddress.lat || null,
        longitude: businessAddress.lng || null,
        createdAt: now,
      }
      userData.hasBusinessProfile = true
    }

    return { userData, now }
  }

  const persistBusinessDirectory = async (uid: string, now: Date) => {
    if (formData.memberType !== 'business') return
    await setDoc(
      doc(db, 'businesses', uid),
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
        ownerId: uid,
        userId: uid,
        email: formData.email.toLowerCase(),
        phone: formData.phone || '',
        location: formData.businessLocation || formData.emirate || '',
        placeId: businessAddress.placeId || '',
        latitude: businessAddress.lat || 0,
        longitude: businessAddress.lng || 0,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep === 5) {
      await handleSubscribe()
      return
    }
    if (currentStep !== 4) return
    if (!(await validateStep(currentStep))) return

    setIsLoading(true)
    setError('')

    try {
      const existingUid = createdUserId || auth.currentUser?.uid || null
      if (existingUid) {
        const userRef = doc(db, 'users', existingUid)
        const existing = await getDoc(userRef)
        if (!existing.exists()) {
          const { userData, now } = buildUserPayload(existingUid)
          await setDoc(userRef, sanitizeForFirestore(userData))
          await persistBusinessDirectory(existingUid, now)
        }
        setCreatedUserId(existingUid)
        if (formData.promoCode.trim()) {
          const redeemed = await tryRedeemPromo(existingUid)
          if (redeemed.ok) {
            applyPromoOutcome(redeemed)
            return
          }
          if (redeemed.error) {
            setError(`${redeemed.error}. You can still subscribe on the next step.`)
          }
        }
        setCurrentStep(5)
        return
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.toLowerCase(),
        formData.password
      )
      const firebaseUser = userCredential.user
      await updateProfile(firebaseUser, {
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
      })

      const { userData, now } = buildUserPayload(firebaseUser.uid)
      await setDoc(doc(db, 'users', firebaseUser.uid), sanitizeForFirestore(userData))
      await persistBusinessDirectory(firebaseUser.uid, now)

      try {
        const idToken = await firebaseUser.getIdToken()
        const authHeaders = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        }
        void fetch('/api/email/welcome', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            accountType: formData.memberType,
            firstName: formData.firstName,
          }),
        })
        void fetch('/api/auth/send-verification', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ firstName: formData.firstName }),
        })
      } catch {
        /* welcome / verification emails are best-effort */
      }

      console.log('[v0] User account created successfully:', firebaseUser.uid)
      setCreatedUserId(firebaseUser.uid)
      setError('')

      if (formData.promoCode.trim()) {
        const redeemed = await tryRedeemPromo(firebaseUser.uid)
        if (redeemed.ok) {
          applyPromoOutcome(redeemed)
          return
        }
        if (redeemed.error) {
          setError(`${redeemed.error}. You can still subscribe on the next step.`)
        }
      }

      setCurrentStep(5)
    } catch (err: any) {
      console.error('[v0] Signup error:', err)
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in or use a different email.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else if (err.code === 'permission-denied') {
        setError('Could not save your profile. Please refresh and try again, or contact support.')
      } else {
        setError(err.message || 'An error occurred during signup. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div data-signup-page style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      <Dialog
        open={Boolean(activeIntent)}
        onOpenChange={(open) => {
          if (!open) setActiveIntent(null)
        }}
        title="Enter card details"
        description="Your card is processed securely by Stripe — it's never seen by our servers."
        maxWidth="26rem"
        compact={false}
      >
        {activeIntent && stripePublishableKey ? (
          <StripeCardCheckout
            publishableKey={stripePublishableKey}
            clientSecret={activeIntent.clientSecret}
            mode={activeIntent.mode}
            onSuccess={() => {
              window.location.href = '/dashboard/membership?status=success'
            }}
            onCancel={() => setActiveIntent(null)}
          />
        ) : null}
      </Dialog>

      {/* Header */}
      <div style={{ width: '100%', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e4e1da' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#111111', height: '44px', display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <SiteLogo background="light" variant="navbar" href="/" />
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
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.25rem' }}>
                      Choose your membership
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                      Membership is paid — pick a package first. You&apos;ll create your account next, then subscribe at the end.
                    </p>
                    {plansLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', padding: '1.5rem 0' }}>
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        Loading packages…
                      </div>
                    ) : plans.length === 0 ? (
                      <p style={{ fontSize: '0.875rem', color: '#991b1b' }}>
                        No membership packages are available right now. Please check back soon.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {plans.map((plan) => {
                          const items = getPlanIncludedItems(plan).slice(0, 4)
                          const { amount, period } = formatPlanPriceDetailed(plan)
                          const selected = formData.planId === plan.id
                          return (
                            <div
                              key={plan.id}
                              role="button"
                              tabIndex={0}
                              className="pb-selectable-card"
                              data-selected={selected ? 'true' : 'false'}
                              onClick={() => selectPlan(plan)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  selectPlan(plan)
                                }
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
                                  {plan.icon ? <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{plan.icon}</span> : null}
                                  <div style={{ minWidth: 0 }}>
                                    <p style={{ fontWeight: 700, color: '#111', fontSize: '1rem', margin: 0 }}>{plan.name}</p>
                                    {plan.description ? (
                                      <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem', lineHeight: 1.4, marginBottom: 0 }}>
                                        {plan.description.length > 120
                                          ? `${plan.description.slice(0, 120)}…`
                                          : plan.description}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111', margin: 0 }}>{amount}</p>
                                  <p style={{ fontSize: '0.7rem', color: '#888', margin: 0 }}>/{period}</p>
                                </div>
                              </div>
                              {items.length > 0 && (
                                <ul style={{ marginTop: '0.75rem', marginBottom: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  {items.map((item) => (
                                    <li key={item} style={{ fontSize: '0.75rem', color: '#555', display: 'flex', gap: '0.35rem', alignItems: 'flex-start' }}>
                                      <Check size={14} color="#111111" style={{ flexShrink: 0, marginTop: 2 }} />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {selected && (
                                <p style={{ marginTop: '0.75rem', marginBottom: 0, fontSize: '0.7rem', fontWeight: 700, color: '#111' }}>
                                  Selected ✓
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <div style={{ marginTop: '0.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#333', marginBottom: '0.35rem' }}>
                        Promo code (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.promoCode}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            promoCode: e.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="e.g. FOUNDERS500"
                        autoComplete="off"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          border: '1px solid #e4e1da',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontFamily: 'ui-monospace, monospace',
                          letterSpacing: '0.04em',
                        }}
                      />
                      <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.35rem', marginBottom: 0 }}>
                        Have a free-access code? Enter it now — we&apos;ll apply it after you create your account.
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>Create your account</h2>

                    {formData.planId && (
                      <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f7f6f2', border: '1.5px solid #111111', borderRadius: '0.5rem', marginBottom: '0.25rem' }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', color: '#666', marginBottom: '0.25rem' }}>Selected package</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111111' }}>{planName || 'Membership plan'}</p>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="pb-ghost-btn"
                          style={{ fontSize: '0.75rem', color: '#666', textDecoration: 'underline', marginTop: '0.25rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer', height: 'auto', minHeight: 0 }}
                        >
                          Change package
                        </button>
                      </div>
                    )}
                    
                    {/* User Type */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', color: '#666' }}>Joining as</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {[
                          { value: 'member', label: 'Member', desc: 'Join our community & participate in activities' },
                          { value: 'business', label: 'Business', desc: 'Company partnerships & corporate engagement' },
                        ].map(option => (
                          <label key={option.value} style={{ display: 'flex', alignItems: 'center', padding: '0.625rem', border: `1.5px solid ${formData.memberType === option.value ? '#111111' : '#e4e1da'}`, borderRadius: '0.375rem', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: formData.memberType === option.value ? '#f7f6f2' : '#fff' }}>
                            <input type="radio" name="memberType" value={option.value} checked={formData.memberType === option.value} onChange={handleInputChange} style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                            <div style={{ marginLeft: '0.625rem', flex: 1 }}>
                              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111111' }}>{option.label}</p>
                              <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.125rem' }}>{option.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      <p style={{ fontSize: '0.65rem', color: '#888', marginTop: '0.35rem' }}>
                        Switch Member / Business anytime — useful when testing with a promo code
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase', color: '#666' }}>
                        Promo / discount code (optional)
                      </label>
                      <input
                        type="text"
                        name="promoCode"
                        value={formData.promoCode}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            promoCode: e.target.value.toUpperCase().replace(/\s+/g, ''),
                          }))
                        }
                        placeholder="e.g. PB100FUTURE"
                        autoComplete="off"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          border: '1.5px solid #e4e1da',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontFamily: 'ui-monospace, monospace',
                          letterSpacing: '0.04em',
                          boxSizing: 'border-box',
                        }}
                      />
                      <p style={{ fontSize: '0.65rem', color: '#888', marginTop: '0.35rem', marginBottom: 0 }}>
                        Free-access codes skip payment (forever or 1–12 months, depending on the code).
                      </p>
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
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
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
                          className="pb-ghost-btn"
                          style={{ position: 'absolute', right: '0.625rem', background: 'none', border: 'none', cursor: 'pointer', color: '#888', height: 'auto', minHeight: 0, padding: 4 }}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                          className="pb-ghost-btn"
                          style={{ position: 'absolute', right: '0.625rem', background: 'none', border: 'none', cursor: 'pointer', color: '#888', height: 'auto', minHeight: 0, padding: 4 }}
                          aria-label={showConfirm ? 'Hide password' : 'Show password'}
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

                {currentStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>Location & profile</h2>

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

                    <AddressLocationPicker
                      variant="profile"
                      value={{
                        country: formData.country,
                        countryCode: formData.countryCode,
                        emirate: formData.emirate,
                        city: formData.city,
                        customCity: formData.customCity,
                        address: formData.address,
                        venueName: '',
                        placeId: formData.placeId,
                        lat: formData.latitude,
                        lng: formData.longitude,
                      }}
                      onChange={(next: AddressLocationValue) => {
                        setFormData((prev) => ({
                          ...prev,
                          country: next.country,
                          countryCode: next.countryCode,
                          emirate: next.emirate,
                          city: next.city,
                          customCity: next.customCity,
                          address: next.address,
                          placeId: next.placeId,
                          latitude: next.lat,
                          longitude: next.lng,
                          consentLocation: prev.consentLocation || Boolean(next.address),
                        }))
                      }}
                      showMapPin={Boolean(formData.latitude && formData.longitude)}
                      pinDraggable={false}
                    />

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

                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111111' }}>Skills (optional)</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {SKILLS.map((skill) => {
                          const selected = formData.skills.includes(skill)
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => handleSkillToggle(skill)}
                              className={selected ? undefined : 'pb-outline-btn'}
                              style={{
                                height: 'auto',
                                minHeight: 28,
                                maxHeight: 'none',
                                padding: '0.35rem 0.65rem',
                                borderRadius: 9999,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                backgroundColor: selected ? '#111111' : '#fff',
                                color: selected ? '#fff' : '#111',
                                border: `1px solid ${selected ? '#111' : '#e4e1da'}`,
                              }}
                            >
                              {skill}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && formData.memberType === 'member' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>Almost there</h2>
                    <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                      Create your account next, then choose your tier and subscribe to activate membership.
                    </p>
                    
                    <div style={{ padding: '1rem', backgroundColor: '#f7f6f2', borderRadius: '0.5rem', border: '1px solid #e4e1da' }}>
                      <p style={{ fontSize: '0.875rem', color: '#111', fontWeight: 600 }}>Selected: {planName || 'Membership'}</p>
                      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                        Payment happens on the next step after your account is created.
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === 4 && formData.memberType === 'business' && (
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
                      <AddressLocationPicker
                        variant="venue"
                        value={businessAddress}
                        onChange={(next) => {
                          setBusinessAddress(next)
                          setFormData((prev) => ({
                            ...prev,
                            businessLocation:
                              next.address ||
                              [next.venueName, next.city || next.customCity, next.emirate, next.country]
                                .filter(Boolean)
                                .join(', '),
                          }))
                        }}
                        showAutoDetect={false}
                        addressLabel="Business address"
                        addressRequired
                        pinDraggable
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

                {currentStep === 5 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.25rem' }}>
                      Select your tier & subscribe
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                      Your account is ready. Confirm a membership tier and complete payment to activate access.
                    </p>
                    {plans.map((plan) => {
                      const { amount, period } = formatPlanPriceDetailed(plan)
                      const selected = formData.planId === plan.id
                      return (
                        <div
                          key={plan.id}
                          role="button"
                          tabIndex={0}
                          className="pb-selectable-card"
                          data-selected={selected ? 'true' : 'false'}
                          onClick={() => selectPlan(plan)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              selectPlan(plan)
                            }
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ fontWeight: 700, color: '#111', margin: 0 }}>
                                {plan.icon ? `${plan.icon} ` : ''}
                                {plan.name}
                              </p>
                              <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem', marginBottom: 0 }}>
                                {getPlanIncludedItems(plan).slice(0, 3).join(' · ') || plan.description || ''}
                              </p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <p style={{ fontWeight: 700, margin: 0 }}>{amount}</p>
                              <p style={{ fontSize: '0.7rem', color: '#888', margin: 0 }}>/{period}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#333', marginBottom: '0.35rem' }}>
                        Promo code (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.promoCode}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            promoCode: e.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="e.g. FOUNDERS500"
                        autoComplete="off"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          border: '1px solid #e4e1da',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontFamily: 'ui-monospace, monospace',
                          letterSpacing: '0.04em',
                          boxSizing: 'border-box',
                        }}
                      />
                      <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.35rem', marginBottom: 0 }}>
                        Free-access codes skip payment and unlock the plan tied to the code.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1 || currentStep === 5 || isLoading || checkingOut}
                  className="pb-form-nav-btn pb-outline-btn"
                  style={{
                    flex: 1,
                    opacity: currentStep === 1 || currentStep === 5 || isLoading || checkingOut ? 0.5 : 1,
                  }}
                >
                  Back
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => handleStepChange(currentStep + 1)}
                    disabled={isLoading}
                    className="pb-form-nav-btn"
                    style={{
                      flex: 1,
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
                ) : currentStep === 4 ? (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="pb-form-nav-btn"
                    style={{
                      flex: 1,
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
                      'Create account'
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubscribe}
                    disabled={checkingOut || !formData.planId}
                    className="pb-form-nav-btn"
                    style={{
                      flex: 1,
                      opacity: checkingOut || !formData.planId ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {checkingOut ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Redirecting to payment…
                      </>
                    ) : (
                      'Subscribe & pay'
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

        {/* Right Info Column — matches selected package */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:w-[380px] flex-shrink-0 bg-[#f7f6f2] p-8">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#111111' }}>
            {selectedPlan ? selectedPlan.name : 'Why join Passive Blessings?'}
          </h3>
          {selectedPlan ? (
            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1.25rem' }}>
              {(() => {
                const { amount, period } = formatPlanPriceDetailed(selectedPlan)
                return `${amount} per ${period}`
              })()}
            </p>
          ) : (
            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1.25rem' }}>
              Choose a membership package to see what&apos;s included.
            </p>
          )}
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sidebarPerks.map((item, i) => (
              <li key={`${i}-${item}`} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem', color: '#666' }}>
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
