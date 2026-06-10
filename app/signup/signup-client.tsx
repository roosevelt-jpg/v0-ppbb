'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { registerUser } from '@/lib/auth'
import { getUserLocation, searchLocation, type LocationData } from '@/lib/geolocation'
import { uploadImageForFirestore, base64ToImage, type UploadedImage } from '@/lib/image-upload'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, ChevronRight, MapPin, Upload, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function SignupPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations()
  const [step, setStep] = React.useState(1)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [locLoading, setLocLoading] = React.useState(false)

  // Step 1: User type selection
  const [userType, setUserType] = React.useState<'member' | 'volunteer' | 'business' | null>(null)

  // Step 2: Personal info
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [dateOfBirth, setDateOfBirth] = React.useState('')
  const [gender, setGender] = React.useState('')
  const [nationality, setNationality] = React.useState('')
  const [emiratesId, setEmiratesId] = React.useState('')
  const [profileImage, setProfileImage] = React.useState<UploadedImage | undefined>(undefined)
  const [profileImagePreview, setProfileImagePreview] = React.useState<string>('')
  const [occupation, setOccupation] = React.useState('')
  const [employer, setEmployer] = React.useState('')

  // Step 3: Location
  const [location, setLocation] = React.useState<LocationData | null>(null)
  const [locationSearch, setLocationSearch] = React.useState('')
  const [locationSuggestions, setLocationSuggestions] = React.useState<LocationData[]>([])
  const [showLocationDropdown, setShowLocationDropdown] = React.useState(false)

  // Step 4: Agreements
  const [termsAgree, setTermsAgree] = React.useState(false)
  const [dataAgree, setDataAgree] = React.useState(false)
  const [locationAgree, setLocationAgree] = React.useState(false)
  const [newsletterAgree, setNewsletterAgree] = React.useState(false)

  const handleDetectLocation = async () => {
    setLocLoading(true)
    setError('')
    try {
      const loc = await getUserLocation()
      if (loc) {
        setLocation(loc)
        setLocationSearch(`${loc.city}, ${loc.state}, ${loc.country}`)
      } else {
        setError('Could not detect your location. Please enable location access.')
      }
    } catch (err) {
      setError('Error detecting location')
    } finally {
      setLocLoading(false)
    }
  }

  const handleLocationSearch = async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([])
      return
    }
    
    try {
      const suggestions = await searchLocation(query)
      setLocationSuggestions(suggestions)
    } catch (err) {
      console.error('[v0] Location search error:', err)
    }
  }

  const handleSelectLocation = (loc: LocationData) => {
    setLocation(loc)
    setLocationSearch(`${loc.city}, ${loc.state}, ${loc.country}`)
    setLocationSuggestions([])
    setShowLocationDropdown(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const uploaded = await uploadImageForFirestore(file)
      setProfileImage(uploaded)
      const preview = base64ToImage(uploaded.base64, uploaded.mimeType)
      setProfileImagePreview(preview)
    } catch (err) {
      setError('Error uploading image: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!userType) {
      setError('Please select a user type')
      return
    }

    if (password !== confirmPassword) {
      setError(t('signup.passwordMismatch'))
      return
    }

    if (password.length < 8) {
      setError(t('signup.passwordMinChars'))
      return
    }

    if (!location) {
      setError('Please select a location')
      return
    }

    if (!termsAgree || !dataAgree || !locationAgree) {
      setError('Please agree to all terms and conditions')
      return
    }

    setLoading(true)

    const { user, error: signupError } = await registerUser(
      email,
      password,
      firstName,
      lastName,
      userType,
      {
        dateOfBirth,
        gender,
        nationality,
        emiratesId,
        location,
        profession: occupation,
        employer,
        avatar: profileImage,
      }
    )

    if (signupError) {
      setError(signupError)
      setLoading(false)
      return
    }

    if (user) {
      router.push(`/${locale}/dashboard`)
    }
  }

  const isStep2Valid = firstName && lastName && email && password && confirmPassword && dateOfBirth && gender && nationality
  const isStep3Valid = location
  const isStep4Valid = termsAgree && dataAgree && locationAgree

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-background">
      <div className={`w-full max-w-2xl ${locale === 'ar' ? 'rtl' : ''}`}>
        <div className="mb-8 text-center">
          <Logo size="lg" className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold">{t('signup.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('signup.description')}</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Step 1: User Type */}
        {step === 1 && (
          <Card className="p-8">
            <h2 className="text-xl font-bold mb-6">{t('signup.selectUserType')}</h2>

            <div className="space-y-3 mb-8">
              {[
                { value: 'member', label: t('signup.generalMember'), desc: 'Community events, charity' },
                { value: 'volunteer', label: t('signup.volunteer'), desc: 'Contribute your time & skills' },
                { value: 'business', label: t('signup.businessPartner'), desc: 'Full access & post back' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setUserType(option.value as any)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    userType === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.desc}</p>
                </button>
              ))}
            </div>

            <Button onClick={() => setStep(2)} disabled={!userType} className="w-full">
              {t('common.cancel')} <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </Card>
        )}

        {/* Step 2: Personal Information */}
        {step === 2 && (
          <Card className="p-8">
            <div className="mb-6">
              <button onClick={() => setStep(1)} className="text-sm text-primary hover:underline">
                ← {t('signup.selectUserType')}
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setStep(3) }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('signup.firstName')}</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('signup.lastName')}</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('signup.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('signup.dateOfBirth')}</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('signup.gender')}</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('signup.nationality')}</label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="e.g. Emirati"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('signup.emiratesId')}</label>
                  <input
                    type="text"
                    value={emiratesId}
                    onChange={(e) => setEmiratesId(e.target.value)}
                    placeholder="Optional for verification"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('signup.profileImage')}</label>
                <div className="flex items-center gap-4">
                  {profileImagePreview && (
                    <div className="relative">
                      <img src={profileImagePreview} alt="Profile" className="w-20 h-20 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setProfileImage(undefined)
                          setProfileImagePreview('')
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <label className="flex-1 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">{t('signup.uploadImage')}</p>
                    <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('signup.occupation')}</label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('signup.employer')}</label>
                  <input
                    type="text"
                    value={employer}
                    onChange={(e) => setEmployer(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button variant="outline" type="button" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" disabled={!isStep2Valid}>
                  Next
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <Card className="p-8">
            <form onSubmit={(e) => { e.preventDefault(); setStep(4) }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('signup.selectLocation')}</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={locationSearch}
                      onChange={(e) => {
                        setLocationSearch(e.target.value)
                        handleLocationSearch(e.target.value)
                      }}
                      onFocus={() => setShowLocationDropdown(true)}
                      placeholder="Search location"
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {showLocationDropdown && locationSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10">
                        {locationSuggestions.map((loc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectLocation(loc)}
                            className="w-full text-left px-4 py-2 hover:bg-secondary transition"
                          >
                            <p className="font-medium">{loc.city}, {loc.state}</p>
                            <p className="text-sm text-muted-foreground">{loc.country}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button type="button" variant="outline" onClick={handleDetectLocation} disabled={locLoading}>
                    {locLoading ? 'Detecting...' : t('signup.currentLocation')}
                  </Button>
                </div>
              </div>

              {location && (
                <Card className="p-4 bg-secondary/5">
                  <p className="font-medium">{location.city}, {location.state}</p>
                  <p className="text-sm text-muted-foreground">{location.country}</p>
                </Card>
              )}

              <div className="grid grid-cols-3 gap-4 pt-4">
                <Button variant="outline" type="button" onClick={() => setStep(2)}>
                  Back
                </Button>
                <div />
                <Button type="submit" disabled={!isStep3Valid}>
                  Next
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Step 4: Agreements */}
        {step === 4 && (
          <Card className="p-8">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={termsAgree}
                    onChange={(e) => setTermsAgree(e.target.checked)}
                    required
                    className="mt-1"
                  />
                  <span>
                    {t('signup.termsAgreement')}
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={dataAgree}
                    onChange={(e) => setDataAgree(e.target.checked)}
                    required
                    className="mt-1"
                  />
                  <span>{t('signup.dataProtection')}</span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={locationAgree}
                    onChange={(e) => setLocationAgree(e.target.checked)}
                    required
                    className="mt-1"
                  />
                  <span>{t('signup.locationConsent')}</span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newsletterAgree}
                    onChange={(e) => setNewsletterAgree(e.target.checked)}
                    className="mt-1"
                  />
                  <span>{t('signup.newsletter')}</span>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <Button variant="outline" type="button" onClick={() => setStep(3)}>
                  Back
                </Button>
                <div />
                <Button type="submit" disabled={!isStep4Valid || loading}>
                  {loading ? 'Creating...' : t('signup.createAccount')}
                </Button>
              </div>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {t('signup.alreadyMember')}{' '}
              <Link href={`/${locale}/login`} className="text-primary font-medium hover:underline">
                {t('signup.signInHere')}
              </Link>
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

