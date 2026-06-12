import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { NextResponse } from 'next/server'

// Initialize Firebase Admin
function getAdminDb() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  }
  return getFirestore()
}

export async function POST() {
  try {
    const db = getAdminDb()

    // Seed Charity Partners
    const charityPartners = [
      {
        name: 'Beit Al Khair Society',
        description: 'Official charitable partner for community support',
        status: 'active',
        paymentLink: 'https://beitalkhairdubai.ae/donate',
        email: 'info@beitalkhairdubai.ae',
        phone: '+971-4-XXX-XXXX',
        createdAt: new Date(),
      },
      {
        name: 'Al Noor Community Services',
        description: 'Committed to social welfare and community development',
        status: 'active',
        paymentLink: 'https://alnoor.ae/donate',
        email: 'support@alnoor.ae',
        phone: '+971-4-XXX-XXXX',
        createdAt: new Date(),
      },
    ]

    const charityIds: string[] = []
    for (const partner of charityPartners) {
      const docRef = await db.collection('charityPartners').add(partner)
      charityIds.push(docRef.id)
    }

    // Seed Causes
    const causes = [
      {
        name: 'Emergency Relief Fund',
        description: 'Support families facing urgent hardships and emergency situations',
        category: 'Emergency Relief',
        status: 'active',
        currentAmount: 45000,
        targetAmount: 100000,
        partnerId: charityIds[0],
        image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=300&fit=crop',
        details: 'Help families dealing with unexpected emergencies including medical crises, housing issues, and loss of income.',
        createdAt: new Date(),
      },
      {
        name: 'Education Scholarship Program',
        description: 'Provide quality education for underprivileged children',
        category: 'Education',
        status: 'active',
        currentAmount: 75000,
        targetAmount: 150000,
        partnerId: charityIds[1],
        image: 'https://images.unsplash.com/photo-1427504494934-ed8b0c4cfe15?w=400&h=300&fit=crop',
        details: 'Enable talented students from low-income families to pursue their educational dreams.',
        createdAt: new Date(),
      },
      {
        name: 'Food Security Initiative',
        description: 'Combat hunger and provide nutritious meals to vulnerable communities',
        category: 'Food Security',
        status: 'active',
        currentAmount: 32000,
        targetAmount: 80000,
        partnerId: charityIds[0],
        image: 'https://images.unsplash.com/photo-1532996122724-8f3c2cd83c5d?w=400&h=300&fit=crop',
        details: 'Provide regular food packages to families in need and support community feeding programs.',
        createdAt: new Date(),
      },
      {
        name: 'Health & Wellness Campaign',
        description: 'Ensure access to healthcare and wellness programs for all',
        category: 'Healthcare',
        status: 'active',
        currentAmount: 55000,
        targetAmount: 120000,
        partnerId: charityIds[1],
        image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop',
        details: 'Support medical camps, health screenings, and wellness initiatives for underserved communities.',
        createdAt: new Date(),
      },
      {
        name: 'Skills Training Program',
        description: 'Empower individuals with job-ready skills and vocational training',
        category: 'Skills Development',
        status: 'active',
        currentAmount: 28000,
        targetAmount: 90000,
        partnerId: charityIds[0],
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
        details: 'Provide training in IT, business, and vocational skills to enable economic independence.',
        createdAt: new Date(),
      },
      {
        name: 'Environmental Conservation',
        description: 'Protect and restore our natural environment and green spaces',
        category: 'Environment',
        status: 'active',
        currentAmount: 18000,
        targetAmount: 70000,
        partnerId: charityIds[1],
        image: 'https://images.unsplash.com/photo-1559027615-cd00b42f0c69?w=400&h=300&fit=crop',
        details: 'Support environmental projects including tree planting, beach cleanups, and sustainability initiatives.',
        createdAt: new Date(),
      },
    ]

    for (const cause of causes) {
      await db.collection('causes').add(cause)
    }

    console.log('[v0] Donation data seeded successfully')
    return NextResponse.json({
      success: true,
      message: 'Donation data seeded successfully',
      data: {
        charityPartnersCount: charityPartners.length,
        causesCount: causes.length,
      },
    })
  } catch (error) {
    console.error('[v0] Seed error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to seed data' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to seed donation data',
    endpoint: '/api/seed-donation-data',
  })
}
