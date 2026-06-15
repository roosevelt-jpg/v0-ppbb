import { db } from '@/lib/firebase'
import { collection, query, getDocs, addDoc, where } from 'firebase/firestore'
import { FAQ } from '@/lib/types'

const DEFAULT_FAQS: Omit<FAQ, 'id'>[] = [
  {
    question: 'What is Passive Blessings?',
    answer: 'Passive Blessings is a community-driven platform dedicated to connecting members, volunteers, businesses, and sponsors to create meaningful social impact.',
    category: 'general',
    keywords: ['what', 'passive', 'blessings', 'platform'],
    order: 1,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'How do I become a member?',
    answer: 'Register on our website with your basic information and choose your role (Member, Volunteer, Business, or Sponsor). Membership is free and open to all.',
    category: 'general',
    keywords: ['member', 'register', 'signup', 'join'],
    order: 2,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'What are the membership tiers?',
    answer: 'We offer three membership tiers: Standard (free), Gold (premium features), and Platinum (full access). Each tier provides different benefits.',
    category: 'general',
    keywords: ['membership', 'tiers', 'standard', 'gold', 'platinum'],
    order: 3,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'How can I volunteer?',
    answer: 'Browse volunteering opportunities on the dashboard, select ones matching your skills, apply, and start contributing. Track your hours on your profile.',
    category: 'volunteering',
    keywords: ['volunteer', 'opportunities', 'hours', 'apply'],
    order: 1,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'How do I track my volunteering hours?',
    answer: 'Your volunteer hours are automatically tracked in your dashboard. Visit the "Volunteering" section to see total hours, monthly activity, and badges.',
    category: 'volunteering',
    keywords: ['hours', 'track', 'volunteer', 'activity'],
    order: 2,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'What is the sponsorship program?',
    answer: 'Our sponsorship program allows businesses to partner with us to support community initiatives. Sponsors gain visibility and recognition.',
    category: 'sponsorship',
    keywords: ['sponsorship', 'sponsor', 'partner', 'business'],
    order: 1,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'How can my business join the marketplace?',
    answer: 'Register as a Business user, complete your profile with details and logo, and start posting opportunities and offers.',
    category: 'community',
    keywords: ['business', 'marketplace', 'register', 'profile'],
    order: 1,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'Is there a referral program?',
    answer: 'Yes! Share your referral code and earn benefits when new members join. Check your dashboard for details.',
    category: 'community',
    keywords: ['referral', 'program', 'rewards', 'benefits'],
    order: 2,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'How do I request charity support?',
    answer: 'Visit the "Charity Support Request" page, fill out the form with your details and documents. Your request will be reviewed by our team.',
    category: 'support',
    keywords: ['charity', 'support', 'request', 'help'],
    order: 1,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'How is my personal data protected?',
    answer: 'We use AES-256 encryption to protect all personal data. View our UAE Data Protection Policy for detailed information.',
    category: 'support',
    keywords: ['data', 'protection', 'privacy', 'security'],
    order: 2,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export async function initializeFAQs() {
  try {
    // Check if FAQs already exist
    const q = query(collection(db, 'faqs'))
    const snapshot = await getDocs(q)
    
    if (snapshot.size > 0) {
      console.log('[v0] FAQs already initialized')
      return
    }
    
    console.log('[v0] Initializing default FAQs...')
    
    for (const faq of DEFAULT_FAQS) {
      await addDoc(collection(db, 'faqs'), {
        ...faq,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
    
    console.log('[v0] FAQs initialized successfully')
  } catch (error) {
    console.error('[v0] Error initializing FAQs:', error)
  }
}
