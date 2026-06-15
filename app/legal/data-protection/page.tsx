'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function UAEDataProtectionPage() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const pagesRef = collection(db, 'pages')
        const q = query(pagesRef, where('slug', '==', 'data-protection'))
        const snapshot = await getDocs(q)
        
        if (snapshot.docs.length > 0) {
          setContent(snapshot.docs[0].data().content)
        } else {
          setContent(getDefaultContent())
        }
      } catch (error) {
        console.error('[v0] Error fetching policy:', error)
        setContent(getDefaultContent())
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [])

  const getDefaultContent = () => `
    <h1>UAE Data Protection Policy</h1>
    <p><strong>Effective Date: June 15, 2026</strong></p>
    <p><strong>Last Updated: June 15, 2026</strong></p>
    
    <h2>1. Introduction</h2>
    <p>Passive Blessings ("we," "us," "our," or "Company") is committed to protecting your privacy and ensuring you have a positive experience on our website and with our services. This UAE Data Protection Policy ("Policy") explains how we collect, use, disclose, and safeguard your information in compliance with UAE data protection laws and international best practices.</p>
    
    <h2>2. Legal Basis for Data Processing</h2>
    <p>We collect and process your personal data based on the following legal grounds:</p>
    <ul>
      <li>Your explicit consent</li>
      <li>Performance of a contract with you</li>
      <li>Compliance with legal obligations</li>
      <li>Protection of vital interests</li>
      <li>Tasks carried out in the public interest</li>
      <li>Our legitimate business interests</li>
    </ul>
    
    <h2>3. Information We Collect</h2>
    <p>We collect information you provide directly to us, including:</p>
    <ul>
      <li>Personal identification information (name, email, phone number, date of birth)</li>
      <li>Financial information (bank account details, income information)</li>
      <li>Identity documents (Emirates ID, passport, visa)</li>
      <li>Health and welfare information (only when necessary for charitable support)</li>
      <li>Information about your family and dependents</li>
      <li>Communication preferences and interaction history</li>
    </ul>
    
    <h2>4. How We Use Your Information</h2>
    <p>We use the information we collect for the following purposes:</p>
    <ul>
      <li>Processing and managing charity support requests</li>
      <li>Communicating with you about our services</li>
      <li>Providing personalized community experiences</li>
      <li>Conducting analytics and research</li>
      <li>Complying with legal obligations</li>
      <li>Fraud prevention and security</li>
      <li>Marketing and promotional communications (with your consent)</li>
    </ul>
    
    <h2>5. Data Security</h2>
    <p>We implement comprehensive security measures to protect your personal data, including:</p>
    <ul>
      <li>Encryption of data in transit and at rest (AES-256)</li>
      <li>Secure access controls and authentication</li>
      <li>Regular security audits and assessments</li>
      <li>Limited access to personal data on a need-to-know basis</li>
      <li>Secure document storage and management</li>
      <li>Incident response procedures</li>
    </ul>
    
    <h2>6. Your Rights</h2>
    <p>Under UAE data protection laws, you have the following rights:</p>
    <ul>
      <li><strong>Right of Access:</strong> You can request access to your personal data</li>
      <li><strong>Right to Rectification:</strong> You can request correction of inaccurate data</li>
      <li><strong>Right to Erasure:</strong> You can request deletion of your data ("Right to be Forgotten")</li>
      <li><strong>Right to Restrict Processing:</strong> You can restrict how we process your data</li>
      <li><strong>Right to Data Portability:</strong> You can request your data in a structured format</li>
      <li><strong>Right to Object:</strong> You can object to certain types of processing</li>
      <li><strong>Right to Withdraw Consent:</strong> You can withdraw your consent at any time</li>
    </ul>
    
    <h2>7. Data Retention</h2>
    <p>We retain your personal data for as long as necessary to fulfill the purposes for which it was collected, or as required by law. Typically:</p>
    <ul>
      <li>Account information: Duration of your membership plus 3 years after account closure</li>
      <li>Transaction records: 7 years (for regulatory compliance)</li>
      <li>Charity support requests: 5 years after resolution</li>
      <li>Marketing data: Until you unsubscribe</li>
    </ul>
    
    <h2>8. Data Sharing and Transfers</h2>
    <p>We only share your data with:</p>
    <ul>
      <li>Authorized Passive Blessings staff and volunteers</li>
      <li>Our approved charitable partners (with your consent)</li>
      <li>Government authorities (when legally required)</li>
      <li>Service providers under confidentiality agreements</li>
      <li>Third parties with your explicit consent</li>
    </ul>
    
    <h2>9. International Transfers</h2>
    <p>If your data is transferred internationally, we ensure appropriate safeguards are in place, including Standard Contractual Clauses and your explicit consent.</p>
    
    <h2>10. Children's Privacy</h2>
    <p>Our services are not intended for children under 18. We do not knowingly collect data from minors. If we learn we have collected data from a minor, we will take steps to delete such data promptly.</p>
    
    <h2>11. Contact Us</h2>
    <p>If you have questions about this Policy or your data, please contact us at:</p>
    <ul>
      <li><strong>Email:</strong> privacy@passiveblessings.com</li>
      <li><strong>Address:</strong> Passive Blessings, UAE</li>
      <li><strong>Response Time:</strong> Within 30 days</li>
    </ul>
    
    <h2>12. Updates to This Policy</h2>
    <p>We may update this Policy from time to time. We will notify you of significant changes by email or prominently on our website.</p>
    
    <p><strong>Compliance Note:</strong> This policy complies with UAE Federal Law No. 24 of 1999 on the Protection of Personal Data and international data protection standards.</p>
  `

  if (loading) {
    return (
      <div style={{ padding: '64px 32px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#111111', color: '#ffffff', padding: '32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Link 
            href="/" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#ffffff', textDecoration: 'none', marginBottom: '16px' }}
          >
            <ChevronLeft size={20} />
            Back
          </Link>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>UAE Data Protection Policy</h1>
          <p style={{ color: '#cccccc', fontSize: '14px' }}>Effective Date: June 15, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 32px' }}>
        <div
          style={{
            lineHeight: '1.6',
            color: '#333333',
            fontSize: '16px',
          }}
          dangerouslySetInnerHTML={{
            __html: content,
          }}
        />

        {/* Footer CTA */}
        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #e4e1da' }}>
          <p style={{ marginBottom: '16px', color: '#666666' }}>
            Have questions about how we handle your data?
          </p>
          <Link
            href="/contact"
            style={{
              display: 'inline-block',
              backgroundColor: '#111111',
              color: '#ffffff',
              padding: '10px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Contact Our Privacy Team
          </Link>
        </div>
      </div>
      </main>
      <Footer />
    </>
  )
}
