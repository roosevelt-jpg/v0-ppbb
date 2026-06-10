'use client'

export const dynamic = 'force-dynamic'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus,
  FileText,
  Trash2,
  Upload,
  File,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react'
import {
  createBeneficiarySupportRequest,
  submitBeneficiarySupportRequest,
  getUserBeneficiaryRequests,
  createSensitiveDocumentMetadata,
} from '@/lib/beneficiary-queries'
import { BeneficiarySupportRequest, BeneficiaryConsent } from '@/lib/types'
import crypto from 'crypto'

export default function CharityRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<BeneficiarySupportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [step, setStep] = useState(1) // Step 1: Form, Step 2: Consent & Review
  const [submitLoading, setSubmitLoading] = useState(false)

  // Form state - All 11 required fields
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    emiratesId: { number: '', expiryDate: '', file: null as File | null },
    passport: { number: '', expiryDate: '', countryCode: '', file: null as File | null },
    visa: { number: '', expiryDate: '', sponsorName: '', file: null as File | null },
    salaryDoc: { type: '', file: null as File | null },
    bankStatement: { file: null as File | null },
    supportingDocs: [] as { file: File; description: string }[],
    reason: '',
    reasonCategory: 'emergency',
    emergencyLevel: 'medium',
    referralSource: 'self',
  })

  // Consent state
  const [consent, setConsent] = useState({
    privacyPolicyAccepted: false,
    dataProcessingAgreed: false,
    documentRetentionUnderstood: false,
  })

  // Load user requests
  useEffect(() => {
    if (!user) return

    const unsubscribe = getUserBeneficiaryRequests(user.uid, (reqs) => {
      setRequests(reqs)
      setLoading(false)
    })

    return () => unsubscribe?.()
  }, [user])

  // Pre-fill user email
  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email }))
    }
  }, [user])

  const handleFileChange = (field: string, file: File) => {
    setFormData((prev) => ({
      ...prev,
      [field]: { ...prev[field], file },
    }))
  }

  const handleMultipleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      setFormData((prev) => ({
        ...prev,
        supportingDocs: [
          ...prev.supportingDocs,
          { file, description: '' },
        ],
      }))
    })
  }

  const removeSupportingDoc = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      supportingDocs: prev.supportingDocs.filter((_, i) => i !== index),
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.fullName || !formData.phoneNumber || !formData.email) return false
    if (!formData.reason || !formData.reasonCategory) return false
    // At least one ID document required
    if (!formData.emiratesId.file && !formData.passport.file) return false
    return true
  }

  const validateConsent = (): boolean => {
    return consent.privacyPolicyAccepted && consent.dataProcessingAgreed && consent.documentRetentionUnderstood
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      alert('Please fill in all required fields')
      return
    }

    setStep(2)
  }

  const handleFinalSubmit = async () => {
    if (!validateConsent()) {
      alert('Please accept all consent requirements')
      return
    }

    if (!user) return

    setSubmitLoading(true)
    try {
      // Create beneficiary support request
      const consentData: BeneficiaryConsent = {
        id: '',
        beneficiaryRequestId: '',
        userId: user.uid,
        consentGiven: true,
        consentDate: new Date(),
        uaePrivacyPolicyVersion: '1.0',
        privacyPolicyAccepted: consent.privacyPolicyAccepted,
        dataProcessingAgreed: consent.dataProcessingAgreed,
        documentRetentionUnderstood: consent.documentRetentionUnderstood,
        ipAddress: '0.0.0.0', // Will be set by API
        userAgent: navigator.userAgent,
        timestamp: new Date(),
      }

      const beneficiaryData = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        reason: formData.reason,
        reasonCategory: formData.reasonCategory,
        emergencyLevel: formData.emergencyLevel,
        referralSource: formData.referralSource,
        emiratesId: formData.emiratesId.file ? {
          number: formData.emiratesId.number,
          expiryDate: new Date(formData.emiratesId.expiryDate),
        } : undefined,
        passport: formData.passport.file ? {
          number: formData.passport.number,
          expiryDate: new Date(formData.passport.expiryDate),
          countryCode: formData.passport.countryCode,
        } : undefined,
        visa: formData.visa.file ? {
          number: formData.visa.number,
          expiryDate: new Date(formData.visa.expiryDate),
          sponsorName: formData.visa.sponsorName,
        } : undefined,
        supportingDocuments: [],
      }

      const { requestId, consentId } = await createBeneficiarySupportRequest(
        user.uid,
        beneficiaryData,
        consentData
      )

      // Create document metadata for each file
      if (formData.emiratesId.file) {
        const metadata = await createSensitiveDocumentMetadata(
          requestId,
          'emirates_id',
          formData.emiratesId.file.name,
          formData.emiratesId.file.size,
          Buffer.from(await formData.emiratesId.file.arrayBuffer())
        )
        // Update request with document reference
      }

      // Submit request
      await submitBeneficiarySupportRequest(requestId)

      // Reset form
      setFormData({
        fullName: '',
        phoneNumber: '',
        email: user.email,
        emiratesId: { number: '', expiryDate: '', file: null },
        passport: { number: '', expiryDate: '', countryCode: '', file: null },
        visa: { number: '', expiryDate: '', sponsorName: '', file: null },
        salaryDoc: { type: '', file: null },
        bankStatement: { file: null },
        supportingDocs: [],
        reason: '',
        reasonCategory: 'emergency',
        emergencyLevel: 'medium',
        referralSource: 'self',
      })
      setConsent({
        privacyPolicyAccepted: false,
        dataProcessingAgreed: false,
        documentRetentionUnderstood: false,
      })
      setStep(1)
      setShowForm(false)

      alert('Request submitted successfully! Our team will review it shortly.')
    } catch (error) {
      console.error('[v0] Error submitting request:', error)
      alert('Error submitting request. Please try again.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: '#e8f5e9', text: '#2e7d32', icon: CheckCircle2 }
      case 'pending':
      case 'submitted':
      case 'under_review':
        return { bg: '#fff3e0', text: '#e65100', icon: Clock }
      case 'rejected':
        return { bg: '#ffebee', text: '#c62828', icon: AlertCircle }
      default:
        return { bg: '#f5f5f5', text: '#666666', icon: FileText }
    }
  }

  return (
    <>
      <MemberHeader
        title="Charity Support Requests"
        subtitle="Submit requests for community support and assistance"
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', space: '24px' }}>
        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <Button
            onClick={() => {
              setShowForm(!showForm)
              setStep(1)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#111111',
              color: '#ffffff',
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            New Request
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card
            style={{
              padding: '24px',
              marginBottom: '24px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            {step === 1 ? (
              <>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: '#111111' }}>
                  Submit Charity Support Request
                </h2>
                <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Personal Information */}
                  <fieldset style={{ borderTop: '1px solid #e4e1da', paddingTop: '16px' }}>
                    <legend style={{ fontSize: '14px', fontWeight: 600, color: '#111111', marginBottom: '12px' }}>
                      1. Personal Information
                    </legend>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#111111', marginBottom: '6px' }}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #e4e1da',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                          }}
                          placeholder="Your full name"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#111111', marginBottom: '6px' }}>
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #e4e1da',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                          }}
                          placeholder="+971 50 123 4567"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#111111', marginBottom: '6px' }}>
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #e4e1da',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                          }}
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>
                  </fieldset>

                  {/* Identification Documents */}
                  <fieldset style={{ borderTop: '1px solid #e4e1da', paddingTop: '16px' }}>
                    <legend style={{ fontSize: '14px', fontWeight: 600, color: '#111111', marginBottom: '12px' }}>
                      2. Identification Documents (select at least one)
                    </legend>
                    
                    {/* Emirates ID */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!formData.emiratesId.file}
                          onChange={(e) => {
                            if (!e.target.checked) {
                              setFormData((prev) => ({
                                ...prev,
                                emiratesId: { number: '', expiryDate: '', file: null },
                              }))
                            }
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#111111' }}>
                          Emirates ID
                        </span>
                      </label>
                      
                      {formData.emiratesId.file && (
                        <div style={{ marginTop: '12px', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <input
                            type="text"
                            placeholder="ID Number"
                            value={formData.emiratesId.number}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              emiratesId: { ...prev.emiratesId, number: e.target.value },
                            }))}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #e4e1da',
                              borderRadius: '6px',
                              fontSize: '14px',
                            }}
                          />
                          <input
                            type="date"
                            placeholder="Expiry Date"
                            value={formData.emiratesId.expiryDate}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              emiratesId: { ...prev.emiratesId, expiryDate: e.target.value },
                            }))}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #e4e1da',
                              borderRadius: '6px',
                              fontSize: '14px',
                            }}
                          />
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                            <Upload size={16} />
                            <input
                              type="file"
                              accept=".pdf,.jpg,.png"
                              onChange={(e) => e.target.files && handleFileChange('emiratesId', e.target.files[0])}
                              style={{ display: 'none' }}
                            />
                            Upload Copy
                          </label>
                          {formData.emiratesId.file && (
                            <p style={{ fontSize: '12px', color: '#666666' }}>
                              📄 {formData.emiratesId.file.name}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Passport */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!formData.passport.file}
                          onChange={(e) => {
                            if (!e.target.checked) {
                              setFormData((prev) => ({
                                ...prev,
                                passport: { number: '', expiryDate: '', countryCode: '', file: null },
                              }))
                            }
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#111111' }}>
                          Passport
                        </span>
                      </label>
                      
                      {formData.passport.file && (
                        <div style={{ marginTop: '12px', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <input
                            type="text"
                            placeholder="Passport Number"
                            value={formData.passport.number}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              passport: { ...prev.passport, number: e.target.value },
                            }))}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #e4e1da',
                              borderRadius: '6px',
                              fontSize: '14px',
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Country Code"
                            value={formData.passport.countryCode}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              passport: { ...prev.passport, countryCode: e.target.value },
                            }))}
                            maxLength={2}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #e4e1da',
                              borderRadius: '6px',
                              fontSize: '14px',
                            }}
                          />
                          <input
                            type="date"
                            placeholder="Expiry Date"
                            value={formData.passport.expiryDate}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              passport: { ...prev.passport, expiryDate: e.target.value },
                            }))}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #e4e1da',
                              borderRadius: '6px',
                              fontSize: '14px',
                            }}
                          />
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                            <Upload size={16} />
                            <input
                              type="file"
                              accept=".pdf,.jpg,.png"
                              onChange={(e) => e.target.files && handleFileChange('passport', e.target.files[0])}
                              style={{ display: 'none' }}
                            />
                            Upload Copy
                          </label>
                          {formData.passport.file && (
                            <p style={{ fontSize: '12px', color: '#666666' }}>
                              📄 {formData.passport.file.name}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Visa */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!formData.visa.file}
                          onChange={(e) => {
                            if (!e.target.checked) {
                              setFormData((prev) => ({
                                ...prev,
                                visa: { number: '', expiryDate: '', sponsorName: '', file: null },
                              }))
                            }
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#111111' }}>
                          Visa
                        </span>
                      </label>
                      
                      {formData.visa.file && (
                        <div style={{ marginTop: '12px', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <input
                            type="text"
                            placeholder="Visa Number"
                            value={formData.visa.number}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              visa: { ...prev.visa, number: e.target.value },
                            }))}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #e4e1da',
                              borderRadius: '6px',
                              fontSize: '14px',
                            }}
                          />
                          <input
                            type="date"
                            placeholder="Expiry Date"
                            value={formData.visa.expiryDate}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              visa: { ...prev.visa, expiryDate: e.target.value },
                            }))}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #e4e1da',
                              borderRadius: '6px',
                              fontSize: '14px',
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Sponsor Name (optional)"
                            value={formData.visa.sponsorName}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              visa: { ...prev.visa, sponsorName: e.target.value },
                            }))}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #e4e1da',
                              borderRadius: '6px',
                              fontSize: '14px',
                            }}
                          />
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                            <Upload size={16} />
                            <input
                              type="file"
                              accept=".pdf,.jpg,.png"
                              onChange={(e) => e.target.files && handleFileChange('visa', e.target.files[0])}
                              style={{ display: 'none' }}
                            />
                            Upload Copy
                          </label>
                          {formData.visa.file && (
                            <p style={{ fontSize: '12px', color: '#666666' }}>
                              📄 {formData.visa.file.name}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </fieldset>

                  {/* Financial Documents */}
                  <fieldset style={{ borderTop: '1px solid #e4e1da', paddingTop: '16px' }}>
                    <legend style={{ fontSize: '14px', fontWeight: 600, color: '#111111', marginBottom: '12px' }}>
                      3. Financial Documents
                    </legend>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Salary Document */}
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#111111', marginBottom: '8px' }}>
                          Salary Certificate / Pay Slip *
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                          <Upload size={16} />
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            onChange={(e) => e.target.files && handleFileChange('salaryDoc', e.target.files[0])}
                            style={{ display: 'none' }}
                          />
                          Upload Document
                        </label>
                        {formData.salaryDoc.file && (
                          <p style={{ fontSize: '12px', color: '#666666', marginTop: '8px' }}>
                            📄 {formData.salaryDoc.file.name}
                          </p>
                        )}
                      </div>

                      {/* Bank Statement */}
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#888888', marginBottom: '8px' }}>
                          Bank Statement (optional)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                          <Upload size={16} />
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            onChange={(e) => e.target.files && handleFileChange('bankStatement', e.target.files[0])}
                            style={{ display: 'none' }}
                          />
                          Upload Document
                        </label>
                        {formData.bankStatement.file && (
                          <p style={{ fontSize: '12px', color: '#666666', marginTop: '8px' }}>
                            📄 {formData.bankStatement.file.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </fieldset>

                  {/* Supporting Documents */}
                  <fieldset style={{ borderTop: '1px solid #e4e1da', paddingTop: '16px' }}>
                    <legend style={{ fontSize: '14px', fontWeight: 600, color: '#111111', marginBottom: '12px' }}>
                      4. Supporting Documents
                    </legend>
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                      <Upload size={16} />
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.png,.xlsx"
                        onChange={(e) => e.target.files && handleMultipleFiles(e.target.files)}
                        style={{ display: 'none' }}
                      />
                      Upload Additional Documents
                    </label>
                    
                    {formData.supportingDocs.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {formData.supportingDocs.map((doc, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: '#faf9f7', borderRadius: '6px' }}>
                            <File size={16} />
                            <span style={{ fontSize: '12px', flex: 1 }}>{doc.file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeSupportingDoc(idx)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </fieldset>

                  {/* Request Details */}
                  <fieldset style={{ borderTop: '1px solid #e4e1da', paddingTop: '16px' }}>
                    <legend style={{ fontSize: '14px', fontWeight: 600, color: '#111111', marginBottom: '12px' }}>
                      5. Request Details
                    </legend>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#111111', marginBottom: '6px' }}>
                          Reason for Request *
                        </label>
                        <textarea
                          required
                          value={formData.reason}
                          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #e4e1da',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            minHeight: '100px',
                            resize: 'vertical',
                          }}
                          placeholder="Describe your situation and why you need support"
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#111111', marginBottom: '6px' }}>
                            Category *
                          </label>
                          <select
                            value={formData.reasonCategory}
                            onChange={(e) => setFormData({ ...formData, reasonCategory: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #e4e1da',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontFamily: 'inherit',
                            }}
                          >
                            <option value="housing">Housing</option>
                            <option value="medical">Medical</option>
                            <option value="emergency">Emergency</option>
                            <option value="education">Education</option>
                            <option value="employment">Employment</option>
                            <option value="family">Family</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#111111', marginBottom: '6px' }}>
                            Emergency Level *
                          </label>
                          <select
                            value={formData.emergencyLevel}
                            onChange={(e) => setFormData({ ...formData, emergencyLevel: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #e4e1da',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontFamily: 'inherit',
                            }}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#111111', marginBottom: '6px' }}>
                          How did you hear about us?
                        </label>
                        <select
                          value={formData.referralSource}
                          onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #e4e1da',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                          }}
                        >
                          <option value="self">Myself</option>
                          <option value="community_member">Community Member</option>
                          <option value="business">Business Partner</option>
                          <option value="admin_referral">Admin Referral</option>
                          <option value="social_media">Social Media</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </fieldset>

                  {/* Form Actions */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e4e1da', paddingTop: '16px' }}>
                    <Button
                      type="button"
                      onClick={() => setShowForm(false)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: 'transparent',
                        color: '#111111',
                        border: '1px solid #e4e1da',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#111111',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      Review & Accept Terms
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: '#111111' }}>
                  Review & Consent
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Summary */}
                  <div style={{ backgroundColor: '#faf9f7', padding: '16px', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#111111' }}>
                      Request Summary
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                      <div>
                        <p style={{ color: '#888888', marginBottom: '4px' }}>Name</p>
                        <p style={{ fontWeight: 600, color: '#111111' }}>{formData.fullName}</p>
                      </div>
                      <div>
                        <p style={{ color: '#888888', marginBottom: '4px' }}>Category</p>
                        <p style={{ fontWeight: 600, color: '#111111', textTransform: 'capitalize' }}>
                          {formData.reasonCategory}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#888888', marginBottom: '4px' }}>Emergency Level</p>
                        <p style={{ fontWeight: 600, color: '#111111', textTransform: 'capitalize' }}>
                          {formData.emergencyLevel}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#888888', marginBottom: '4px' }}>Documents Uploaded</p>
                        <p style={{ fontWeight: 600, color: '#111111' }}>
                          {(formData.emiratesId.file ? 1 : 0) +
                            (formData.passport.file ? 1 : 0) +
                            (formData.visa.file ? 1 : 0) +
                            (formData.salaryDoc.file ? 1 : 0) +
                            (formData.bankStatement.file ? 1 : 0) +
                            formData.supportingDocs.length} file(s)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Consent Section */}
                  <div style={{ borderTop: '1px solid #e4e1da', paddingTop: '16px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: '#111111' }}>
                      Consent & Compliance
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={consent.privacyPolicyAccepted}
                          onChange={(e) =>
                            setConsent({ ...consent, privacyPolicyAccepted: e.target.checked })
                          }
                          style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '13px', color: '#111111', lineHeight: '1.5' }}>
                          I have read and accept the{' '}
                          <a
                            href="https://passiveblessings.ae/privacy-policy"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#0066cc', textDecoration: 'underline' }}
                          >
                            UAE Privacy Policy
                          </a>{' '}
                          and understand how my data will be used and protected in accordance with UAE data protection laws.
                        </span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={consent.dataProcessingAgreed}
                          onChange={(e) =>
                            setConsent({ ...consent, dataProcessingAgreed: e.target.checked })
                          }
                          style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '13px', color: '#111111', lineHeight: '1.5' }}>
                          I consent to Passive Blessings processing my personal and financial information for the sole purpose of reviewing and processing my support request. This data will only be accessed by authorized welfare administrators, founders, and approved charity coordinators.
                        </span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={consent.documentRetentionUnderstood}
                          onChange={(e) =>
                            setConsent({ ...consent, documentRetentionUnderstood: e.target.checked })
                          }
                          style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '13px', color: '#111111', lineHeight: '1.5' }}>
                          I understand that my sensitive documents will be encrypted and securely stored, with access logs maintained for audit purposes. Documents may be retained for 2 years in accordance with UAE legal requirements.
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Legal Disclaimer */}
                  <div
                    style={{
                      backgroundColor: '#fee2e2',
                      border: '1px solid #fca5a5',
                      borderRadius: '6px',
                      padding: '12px',
                      display: 'flex',
                      gap: '12px',
                    }}
                  >
                    <AlertCircle size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '13px', color: '#7f1d1d', lineHeight: '1.5' }}>
                      <p style={{ fontWeight: 600, marginBottom: '6px' }}>Important Legal Notice</p>
                      <p>
                        All information provided must be accurate and truthful. Providing false information or submitting fraudulent documents may result in legal action and permanent ban from Passive Blessings. Your submission will be investigated by authorized personnel.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      justifyContent: 'flex-end',
                      paddingTop: '16px',
                      borderTop: '1px solid #e4e1da',
                    }}
                  >
                    <Button
                      onClick={() => setStep(1)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: 'transparent',
                        color: '#111111',
                        border: '1px solid #e4e1da',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleFinalSubmit}
                      disabled={!validateConsent() || submitLoading}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: validateConsent() ? '#111111' : '#cccccc',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: validateConsent() ? 'pointer' : 'not-allowed',
                        fontSize: '14px',
                        fontWeight: 500,
                        opacity: submitLoading ? 0.7 : 1,
                      }}
                    >
                      {submitLoading ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        )}

        {/* Requests List */}
        <div style={{ space: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: '#111111' }}>
            Your Requests
          </h2>

          {loading ? (
            <p style={{ color: '#888888' }}>Loading requests...</p>
          ) : requests.length === 0 ? (
            <Card
              style={{
                padding: '24px',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
              }}
            >
              <p style={{ color: '#888888' }}>No requests submitted yet</p>
            </Card>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {requests.map((request) => {
                const statusColor = getStatusColor(request.status)
                const StatusIcon = statusColor.icon

                return (
                  <Card
                    key={request.id}
                    style={{
                      padding: '20px',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${statusColor.text}`,
                    }}
                  >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      <StatusIcon
                        size={32}
                        style={{ color: statusColor.text, flexShrink: 0, marginTop: '4px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111111' }}>
                            {request.reasonCategory.charAt(0).toUpperCase() + request.reasonCategory.slice(1)}
                          </h3>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              padding: '4px 12px',
                              backgroundColor: statusColor.bg,
                              color: statusColor.text,
                              borderRadius: '4px',
                              textTransform: 'capitalize',
                            }}
                          >
                            {request.status.replace(/_/g, ' ')}
                          </span>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              padding: '4px 12px',
                              backgroundColor:
                                request.emergencyLevel === 'critical'
                                  ? '#fee2e2'
                                  : request.emergencyLevel === 'high'
                                    ? '#fef3c7'
                                    : '#e0e7ff',
                              color:
                                request.emergencyLevel === 'critical'
                                  ? '#dc2626'
                                  : request.emergencyLevel === 'high'
                                    ? '#d97706'
                                    : '#4f46e5',
                              borderRadius: '4px',
                              textTransform: 'capitalize',
                            }}
                          >
                            {request.emergencyLevel}
                          </span>
                        </div>

                        <p style={{ fontSize: '14px', color: '#666666', marginBottom: '12px', lineHeight: '1.5' }}>
                          {request.reason}
                        </p>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: '12px',
                            fontSize: '13px',
                          }}
                        >
                          <div>
                            <p style={{ color: '#888888', marginBottom: '4px' }}>Submitted</p>
                            <p style={{ fontWeight: 600, color: '#111111' }}>
                              {request.submissionDate
                                ? new Date(request.submissionDate).toLocaleDateString()
                                : 'Pending'}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: '#888888', marginBottom: '4px' }}>Category</p>
                            <p style={{ fontWeight: 600, color: '#111111', textTransform: 'capitalize' }}>
                              {request.reasonCategory}
                            </p>
                          </div>
                          {request.reviewDate && (
                            <div>
                              <p style={{ color: '#888888', marginBottom: '4px' }}>Reviewed</p>
                              <p style={{ fontWeight: 600, color: '#111111' }}>
                                {new Date(request.reviewDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>

                        {request.reviewNotes && (
                          <div style={{ marginTop: '12px', borderTop: '1px solid #e4e1da', paddingTop: '12px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>
                              Review Notes
                            </p>
                            <p style={{ fontSize: '13px', color: '#666666' }}>{request.reviewNotes}</p>
                          </div>
                        )}

                        {request.approvalNotes && (
                          <div style={{ marginTop: '12px', borderTop: '1px solid #e4e1da', paddingTop: '12px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>
                              Approval Notes
                            </p>
                            <p style={{ fontSize: '13px', color: '#666666' }}>{request.approvalNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
