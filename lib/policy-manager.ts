import { db } from './firebase'
import { collection, doc, getDocs, getDoc, setDoc, query, where } from 'firebase/firestore'
import { Policy } from './types'

const POLICIES_COLLECTION = 'policies'

// Default policy content
export const DEFAULT_POLICIES = {
  privacy: {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    content: `Privacy Policy

Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

1. Introduction
Passive Blessings ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our community platform.

2. Information We Collect
We collect information you provide directly, such as:
- Name, email address, and phone number
- Date of birth, gender, and nationality
- Emirates ID number
- Location and address information
- WhatsApp number
- Professional and employment information
- Skills and volunteer availability information
- Business profile information (if applicable)

3. How We Use Your Information
We use the collected information to:
- Create and manage your account
- Facilitate community events and volunteer opportunities
- Provide notifications and updates
- Improve our services
- Comply with legal obligations
- Ensure platform security and prevent fraud

4. Data Storage and Security
Your data is securely stored in our Firestore database with Firebase authentication. We implement industry-standard security measures to protect your personal information.

5. Your Rights
You have the right to:
- Access your personal data
- Correct inaccurate information
- Request deletion of your account and data
- Opt-out of marketing communications

6. Contact Us
For privacy-related inquiries, please contact us at privacy@passiveblessings.com.`
  },
  terms: {
    title: 'Terms and Conditions',
    slug: 'terms-conditions',
    content: `Terms and Conditions

Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

1. Agreement to Terms
By accessing and using the Passive Blessings platform, you accept and agree to be bound by and comply with these Terms and Conditions.

2. Use License
Permission is granted to temporarily download one copy of the materials (information or software) on Passive Blessings platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
- Modifying or copying the materials
- Using the materials for any commercial purpose or for any public display
- Attempting to decompile or reverse engineer any software contained on the platform
- Removing any copyright or other proprietary notations from the materials
- Transferring the materials to another person or "mirroring" the materials on any other server

3. Disclaimer
The materials on Passive Blessings platform are provided "as is." We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

4. Limitations
In no event shall Passive Blessings or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials.

5. User Responsibilities
- You are responsible for maintaining the confidentiality of your account credentials
- You agree not to engage in any activity that disrupts or interferes with the platform
- You will not post content that is unlawful, offensive, or violates others' rights

6. Modifications to Terms
We reserve the right to modify these terms at any time. Continued use of the platform after modifications constitutes acceptance of the updated terms.

7. Governing Law
These terms are governed by and construed in accordance with the laws of the United Arab Emirates.`
  },
  codeofconduct: {
    title: 'Community Code of Conduct',
    slug: 'code-of-conduct',
    content: `Community Code of Conduct

Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

1. Our Community Commitment
Passive Blessings is committed to providing a welcoming, inclusive, and harassment-free environment for all members. This Code of Conduct outlines the expectations for all participants in our community.

2. Expected Behavior
We expect all community members to:
- Be respectful and courteous to others
- Value diverse perspectives and experiences
- Listen actively and engage constructively
- Support fellow community members
- Take responsibility for your words and actions
- Report violations of this code

3. Unacceptable Behavior
The following behaviors are unacceptable and may result in removal from the community:
- Harassment, discrimination, or bullying based on race, gender, age, religion, disability, or any other protected characteristic
- Violence or threats of violence
- Sexual harassment or unwanted sexual advances
- Abusive, vulgar, or offensive language
- Spam or promotional content without permission
- Sharing personal information without consent
- Violation of privacy

4. Reporting and Enforcement
If you witness or experience a violation of this Code of Conduct:
- Report the incident to our moderation team at conduct@passiveblessings.com
- Provide as much detail as possible about the incident
- Our team will investigate and take appropriate action

5. Consequences of Violations
Depending on the severity and nature of the violation, consequences may include:
- Warning or temporary suspension
- Removal from the community
- Legal action if applicable

6. Amendments
We reserve the right to modify this Code of Conduct at any time to maintain a safe and respectful community.`
  }
}

export async function initializePolicies() {
  try {
    // Check if policies exist
    const policiesRef = collection(db, POLICIES_COLLECTION)
    const snapshot = await getDocs(policiesRef)
    
    if (snapshot.empty) {
      // Create default policies
      const now = new Date()
      for (const [type, policy] of Object.entries(DEFAULT_POLICIES)) {
        const policyData: Policy = {
          id: type,
          type: type as 'privacy' | 'terms' | 'codeofconduct',
          title: policy.title,
          slug: policy.slug,
          content: policy.content,
          version: 1,
          lastUpdated: now,
          effectiveDate: now,
          status: 'active',
          createdAt: now,
          updatedAt: now
        }
        
        await setDoc(doc(db, POLICIES_COLLECTION, type), policyData)
      }
      console.log('[v0] Policies initialized successfully')
    }
  } catch (error) {
    console.error('[v0] Error initializing policies:', error)
  }
}

export async function getPolicy(slug: string): Promise<Policy | null> {
  try {
    const policiesRef = collection(db, POLICIES_COLLECTION)
    const q = query(policiesRef, where('slug', '==', slug), where('status', '==', 'active'))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) return null
    
    return snapshot.docs[0].data() as Policy
  } catch (error) {
    console.error('[v0] Error fetching policy:', error)
    return null
  }
}

export async function getAllPolicies(): Promise<Policy[]> {
  try {
    const policiesRef = collection(db, POLICIES_COLLECTION)
    const q = query(policiesRef, where('status', '==', 'active'))
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => doc.data() as Policy)
  } catch (error) {
    console.error('[v0] Error fetching policies:', error)
    return []
  }
}
