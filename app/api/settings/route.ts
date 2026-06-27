import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

const db = getAdminDb()

interface SiteSettings {
  branding?: {
    siteName: string
    description: string
    logo?: string
    favicon?: string
    primaryColor: string
    secondaryColor: string
  }
  contact?: {
    email: string
    phone: string
    address: string
  }
  social?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
  }
  seo?: {
    googleAnalyticsId?: string
    facebookPixelId?: string
    metaTitle?: string
    metaDescription?: string
    keywords?: string
  }
  chatbot?: {
    enabled: boolean
    model: string
    systemPrompt: string
  }
}

const DEFAULT_SETTINGS: SiteSettings = {
  branding: {
    siteName: 'Passive Blessings',
    description: 'Community platform for events, volunteering, and community support',
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
  },
  contact: {
    email: 'contact@passiveblessings.org',
    phone: '+971 50 000 0000',
    address: 'Dubai, UAE',
  },
  social: {},
  seo: {},
  chatbot: {
    enabled: true,
    model: 'openai/gpt-4o-mini',
    systemPrompt: 'You are a helpful assistant for Passive Blessings community platform.',
  },
}

// GET: Fetch settings
export async function GET(request: NextRequest) {
  try {
    const docRef = await db.collection('settings').doc('general').get()

    if (docRef.exists) {
      return NextResponse.json({
        success: true,
        data: docRef.data(),
      })
    }

    return NextResponse.json({
      success: true,
      data: DEFAULT_SETTINGS,
    })
  } catch (error) {
    console.error('[v0] Settings fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST: Update settings (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.branding && !body.contact && !body.social && !body.seo && !body.chatbot) {
      return NextResponse.json(
        { success: false, error: 'No valid settings provided' },
        { status: 400 }
      )
    }

    const docRef = db.collection('settings').doc('general')
    const currentDoc = await docRef.get()
    const currentData = currentDoc.exists ? currentDoc.data() : DEFAULT_SETTINGS

    const updatedSettings = {
      ...currentData,
      ...(body.branding && { branding: { ...currentData.branding, ...body.branding } }),
      ...(body.contact && { contact: { ...currentData.contact, ...body.contact } }),
      ...(body.social && { social: { ...currentData.social, ...body.social } }),
      ...(body.seo && { seo: { ...currentData.seo, ...body.seo } }),
      ...(body.chatbot && { chatbot: { ...currentData.chatbot, ...body.chatbot } }),
      updatedAt: new Date(),
    }

    await docRef.set(updatedSettings, { merge: true })

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully',
    })
  } catch (error) {
    console.error('[v0] Settings update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
