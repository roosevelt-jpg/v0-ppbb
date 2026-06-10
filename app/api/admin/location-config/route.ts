import { NextRequest, NextResponse } from 'next/server'
import { collection, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const LOCATION_CONFIG_COLLECTION = 'locationConfig'

export async function GET() {
  try {
    const docRef = doc(db, LOCATION_CONFIG_COLLECTION, 'default')
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return NextResponse.json(docSnap.data())
    }

    // Return default config if not found
    return NextResponse.json({
      locationApiKey: '',
      enableAutoLocate: true,
      defaultCountry: 'AE',
    })
  } catch (error) {
    console.error('[v0] Error fetching location config:', error)
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()

    const docRef = doc(db, LOCATION_CONFIG_COLLECTION, 'default')
    await setDoc(docRef, {
      ...config,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error saving location config:', error)
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 })
  }
}
