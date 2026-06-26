import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    // Get userId from the request body (sent from client with auth context)
    const { businessName, businessType, businessDescription, userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (!businessName || !businessType) {
      return NextResponse.json(
        { error: 'Business name and type are required' },
        { status: 400 }
      )
    }

    console.log('[v0] Upgrading user to business:', userId)

    // Get the user document
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()

    // Create BusinessProfile document
    const businessProfileRef = doc(db, 'businessProfiles', userId)
    await setDoc(
      businessProfileRef,
      {
        ...userData,
        id: userId,
        businessName,
        businessType,
        businessDescription,
        membership: 'partner',
        activeOpportunities: 0,
        referralEarnings: 0,
        conversionRate: 0,
        active: true,
        createdAt: userData.createdAt || new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    )

    // Update user roles - keep primary role intact but add 'business' to the
    // roles array so the user can access both the member and business portals.
    const roles: string[] = Array.isArray(userData.roles) ? [...userData.roles] : []
    if (userData.role && !roles.includes(userData.role)) {
      roles.push(userData.role)
    }
    if (!roles.includes('business')) {
      roles.push('business')
    }

    await updateDoc(userRef, {
      roles,
      hasBusinessProfile: true,
      updatedAt: new Date(),
    })

    console.log('[v0] User upgraded to business successfully:', userId)

    return NextResponse.json(
      { success: true, message: 'Business profile created', userId },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Error upgrading to business:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
