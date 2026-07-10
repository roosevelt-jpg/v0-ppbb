'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react'

export type BeneficiarySupportFormProps = {
  /** Optional: close form without leaving page (dashboard toggle) */
  onCancel?: () => void
  /** Called after successful submit */
  onSuccess?: (requestId: string) => void
  /** Show back link to /donate when opened from public path */
  showDonateBackLink?: boolean
}

type FormErrors = Record<string, string>

const EMERGENCY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
] as const

const CONSENT_LABEL =
  "I consent to Passive Blessings collecting and storing this data in accordance with UAE data protection laws and the platform's privacy policy."

const inputClass =
  'w-full border border-neutral-300 rounded px-3 py-3 min-h-[44px] text-sm focus:outline-none focus:border-neutral-900 bg-white'
const labelClass = 'block text-sm font-medium text-neutral-900 mb-1.5'
const errorClass = 'text-sm text-red-600 mt-1'
const btnPrimary =
  'min-h-[44px] inline-flex items-center justify-center gap-2 bg-black hover:bg-neutral-900 text-white px-5 py-2.5 rounded text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
const btnSecondary =
  'min-h-[44px] inline-flex items-center justify-center gap-2 bg-white text-black border border-neutral-300 hover:bg-neutral-50 px-5 py-2.5 rounded text-sm font-semibold'

function FileField({
  id,
  label,
  required,
  accept = 'image/*,.pdf,.doc,.docx',
  file,
  error,
  onChange,
}: {
  id: string
  label: string
  required?: boolean
  accept?: string
  file: File | null
  error?: string
  onChange: (file: File | null) => void
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass} style={{ fontFamily: 'Inter, sans-serif' }}>
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>
      <div
        className={`flex flex-col sm:flex-row sm:items-center gap-2 border rounded px-3 py-2 min-h-[44px] ${
          error ? 'border-red-500' : 'border-neutral-300'
        }`}
      >
        <input
          id={id}
          type="file"
          accept={accept}
          className="w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-neutral-100 file:text-sm file:font-medium file:min-h-[40px]"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
        {file ? (
          <div className="flex items-center gap-2 text-xs text-neutral-600 shrink-0">
            <FileUp className="w-4 h-4" />
            <span className="truncate max-w-[160px]">{file.name}</span>
            <button
              type="button"
              className="text-red-600 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
              aria-label="Remove file"
              onClick={() => onChange(null)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : null}
      </div>
      {error ? <p className={errorClass}>{error}</p> : null}
    </div>
  )
}

export function BeneficiarySupportForm({
  onCancel,
  onSuccess,
  showDonateBackLink = false,
}: BeneficiarySupportFormProps) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [emergencyLevel, setEmergencyLevel] = useState('')
  const [referralSource, setReferralSource] = useState('')
  const [consentAccepted, setConsentAccepted] = useState(false)

  const [emiratesId, setEmiratesId] = useState<File | null>(null)
  const [passport, setPassport] = useState<File | null>(null)
  const [visa, setVisa] = useState<File | null>(null)
  const [salaryCertificate, setSalaryCertificate] = useState<File | null>(null)
  const [bankStatement, setBankStatement] = useState<File | null>(null)
  const [supportingDocuments, setSupportingDocuments] = useState<File[]>([])

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (user?.email) setEmail((prev) => prev || user.email || '')
    if (user?.displayName) setFullName((prev) => prev || user.displayName || '')
  }, [user])

  const validate = (showAll: boolean): FormErrors => {
    const next: FormErrors = {}
    if (!fullName.trim()) next.fullName = 'Full name is required'
    if (!phoneNumber.trim()) next.phoneNumber = 'Phone number is required'
    if (!email.trim() || !email.includes('@')) next.email = 'A valid email address is required'
    if (!emiratesId) next.emiratesId = 'Emirates ID upload is required'
    if (!passport) next.passport = 'Passport copy upload is required'
    if (!visa) next.visa = 'Visa copy upload is required'
    if (!salaryCertificate) next.salaryCertificate = 'Salary certificate upload is required'
    if (!reason.trim()) next.reason = 'Reason for request is required'
    if (!emergencyLevel) next.emergencyLevel = 'Please select an emergency level'
    if (!consentAccepted) next.consent = 'You must accept the consent statement to continue'
    if (showAll || touched) return next
    return next
  }

  const currentErrors = useMemo(() => validate(touched), [
    fullName,
    phoneNumber,
    email,
    emiratesId,
    passport,
    visa,
    salaryCertificate,
    reason,
    emergencyLevel,
    consentAccepted,
    touched,
  ])

  const isValid = Object.keys(validate(true)).length === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    const nextErrors = validate(true)
    setErrors(nextErrors)
    setSubmitError('')

    if (Object.keys(nextErrors).length > 0) {
      setSubmitError('Please fix the highlighted fields before submitting.')
      return
    }

    if (!user) {
      router.push(`/signin?redirect=${encodeURIComponent('/dashboard/charity-requests')}`)
      return
    }

    setSubmitting(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('You must be signed in to submit')

      const fd = new FormData()
      fd.append('fullName', fullName.trim())
      fd.append('phoneNumber', phoneNumber.trim())
      fd.append('email', email.trim())
      fd.append('reason', reason.trim())
      fd.append('emergencyLevel', emergencyLevel)
      fd.append('referralSource', referralSource.trim())
      fd.append('consentAccepted', 'true')
      fd.append('emiratesId', emiratesId!)
      fd.append('passport', passport!)
      fd.append('visa', visa!)
      fd.append('salaryCertificate', salaryCertificate!)
      if (bankStatement) fd.append('bankStatement', bankStatement)
      supportingDocuments.forEach((file) => fd.append('supportingDocuments', file))

      const res = await fetch('/api/beneficiary-requests', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Submission failed')
      }

      setSuccessId(json.requestId)
      onSuccess?.(json.requestId)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="animate-pulse space-y-4 p-4 sm:p-6" aria-busy="true">
        <div className="h-6 bg-neutral-200 rounded w-1/2" />
        <div className="h-11 bg-neutral-200 rounded" />
        <div className="h-11 bg-neutral-200 rounded" />
        <div className="h-24 bg-neutral-200 rounded" />
      </div>
    )
  }

  if (!user) {
    return (
      <div
        className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-8 text-center space-y-4"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <AlertCircle className="w-10 h-10 text-neutral-400 mx-auto" />
        <h2 className="text-xl text-neutral-900" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Sign in to apply for support
        </h2>
        <p className="text-sm text-neutral-600">
          Charity support applications require a Passive Blessings account so we can protect your
          documents and update you on status.
        </p>
        <Link
          href={`/signin?redirect=${encodeURIComponent('/dashboard/charity-requests')}`}
          className={btnPrimary}
        >
          Sign in to continue
        </Link>
        {showDonateBackLink ? (
          <div>
            <Link href="/donate" className="text-sm underline text-neutral-600">
              Back to Donate
            </Link>
          </div>
        ) : null}
      </div>
    )
  }

  if (successId) {
    return (
      <div
        className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-8 text-center space-y-4"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto" />
        <p
          className="text-xs uppercase tracking-[0.2em] text-neutral-500"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Request received
        </p>
        <h2
          className="text-2xl sm:text-3xl text-neutral-900"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          Your application was submitted successfully
        </h2>
        <p className="text-neutral-600 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
          Our welfare team will review your request confidentially. You can track status anytime
          from your charity requests dashboard. Reference ID:{' '}
          <span className="font-mono text-xs break-all">{successId}</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/dashboard/charity-requests" className={btnPrimary}>
            View my requests
          </Link>
          {onCancel ? (
            <button type="button" className={btnSecondary} onClick={onCancel}>
              Close
            </button>
          ) : showDonateBackLink ? (
            <Link href="/donate" className={btnSecondary}>
              Back to Donate
            </Link>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white border border-neutral-200 rounded-lg p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-3xl mx-auto"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">Support application</p>
        <h2
          className="text-2xl sm:text-3xl text-neutral-900"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          Apply for Charity Support
        </h2>
        <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
          Documents are stored in a restricted Storage path and visible only to authorized welfare
          administrators. Fields marked * are required.
        </p>
      </div>

      {(submitError || (touched && !isValid)) && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded p-3 flex gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-medium">{submitError || 'Some required fields are missing.'}</p>
            {touched && Object.keys(currentErrors).length > 0 ? (
              <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
                {Object.values(currentErrors).map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      )}

      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-wider text-neutral-500">Personal details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="fullName" className={labelClass}>
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              id="fullName"
              className={`${inputClass} ${currentErrors.fullName && touched ? 'border-red-500' : ''}`}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
            {touched && currentErrors.fullName ? (
              <p className={errorClass}>{currentErrors.fullName}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="phoneNumber" className={labelClass}>
              Phone Number <span className="text-red-600">*</span>
            </label>
            <input
              id="phoneNumber"
              type="tel"
              className={`${inputClass} ${currentErrors.phoneNumber && touched ? 'border-red-500' : ''}`}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              autoComplete="tel"
              placeholder="+971…"
            />
            {touched && currentErrors.phoneNumber ? (
              <p className={errorClass}>{currentErrors.phoneNumber}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email Address <span className="text-red-600">*</span>
            </label>
            <input
              id="email"
              type="email"
              className={`${inputClass} ${currentErrors.email && touched ? 'border-red-500' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {touched && currentErrors.email ? (
              <p className={errorClass}>{currentErrors.email}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-wider text-neutral-500">Identity documents</h3>
        <div className="grid grid-cols-1 gap-4">
          <FileField
            id="emiratesId"
            label="Emirates ID Upload"
            required
            file={emiratesId}
            error={touched ? currentErrors.emiratesId : undefined}
            onChange={setEmiratesId}
          />
          <FileField
            id="passport"
            label="Passport Copy Upload"
            required
            file={passport}
            error={touched ? currentErrors.passport : undefined}
            onChange={setPassport}
          />
          <FileField
            id="visa"
            label="Visa Copy Upload"
            required
            file={visa}
            error={touched ? currentErrors.visa : undefined}
            onChange={setVisa}
          />
          <FileField
            id="salaryCertificate"
            label="Salary Certificate"
            required
            file={salaryCertificate}
            error={touched ? currentErrors.salaryCertificate : undefined}
            onChange={setSalaryCertificate}
          />
          <FileField
            id="bankStatement"
            label="Bank Statement (optional)"
            file={bankStatement}
            onChange={setBankStatement}
          />
          <div>
            <label htmlFor="supportingDocuments" className={labelClass}>
              Supporting Documents (optional, multiple)
            </label>
            <input
              id="supportingDocuments"
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              multiple
              className={inputClass}
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : []
                setSupportingDocuments((prev) => [...prev, ...files])
                e.target.value = ''
              }}
            />
            {supportingDocuments.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {supportingDocuments.map((file, i) => (
                  <li
                    key={`${file.name}-${i}`}
                    className="flex items-center justify-between gap-2 text-sm text-neutral-700 bg-neutral-50 rounded px-3 py-2 min-h-[44px]"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      className="text-red-600 shrink-0 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                      onClick={() =>
                        setSupportingDocuments((prev) => prev.filter((_, idx) => idx !== i))
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-wider text-neutral-500">Request details</h3>
        <div>
          <label htmlFor="reason" className={labelClass}>
            Reason for Request <span className="text-red-600">*</span>
          </label>
          <textarea
            id="reason"
            rows={5}
            className={`${inputClass} ${currentErrors.reason && touched ? 'border-red-500' : ''}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly explain your situation and the support you need"
          />
          {touched && currentErrors.reason ? (
            <p className={errorClass}>{currentErrors.reason}</p>
          ) : null}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="emergencyLevel" className={labelClass}>
              Emergency Level <span className="text-red-600">*</span>
            </label>
            <select
              id="emergencyLevel"
              className={`${inputClass} ${currentErrors.emergencyLevel && touched ? 'border-red-500' : ''}`}
              value={emergencyLevel}
              onChange={(e) => setEmergencyLevel(e.target.value)}
            >
              <option value="">Select level</option>
              {EMERGENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {touched && currentErrors.emergencyLevel ? (
              <p className={errorClass}>{currentErrors.emergencyLevel}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="referralSource" className={labelClass}>
              Referral Source (optional)
            </label>
            <input
              id="referralSource"
              className={inputClass}
              value={referralSource}
              onChange={(e) => setReferralSource(e.target.value)}
              placeholder="Who referred you?"
            />
          </div>
        </div>
      </section>

      <section
        className={`rounded border p-4 ${
          touched && currentErrors.consent ? 'border-red-500 bg-red-50' : 'border-neutral-200 bg-neutral-50'
        }`}
      >
        <label className="flex gap-3 items-start cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 w-5 h-5 min-w-[20px]"
            checked={consentAccepted}
            onChange={(e) => setConsentAccepted(e.target.checked)}
          />
          <span className="text-sm text-neutral-800 leading-relaxed">
            <span className="text-red-600">*</span> {CONSENT_LABEL}
          </span>
        </label>
        {touched && currentErrors.consent ? (
          <p className={errorClass}>{currentErrors.consent}</p>
        ) : null}
      </section>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button type="submit" disabled={submitting} className={`${btnPrimary} w-full sm:w-auto`}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Submit application
            </>
          )}
        </button>
        {onCancel ? (
          <button type="button" className={`${btnSecondary} w-full sm:w-auto`} onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        {showDonateBackLink ? (
          <Link href="/donate" className={`${btnSecondary} w-full sm:w-auto`}>
            Back to Donate
          </Link>
        ) : null}
      </div>
      {!isValid && touched ? (
        <p className="text-xs text-neutral-500">
          Submit stays available so you can see which required fields still need attention.
        </p>
      ) : null}
    </form>
  )
}
