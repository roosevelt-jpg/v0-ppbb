import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

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
  socialLinks?: {
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
  // Flat structure fields (for backwards compatibility)
  siteName?: string
  description?: string
  logoUrl?: string
  logoUrlDark?: string
  email?: string
  phone?: string
  address?: string
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
    // Always read from settings/global to be consistent with POST
    const docRef = await getAdminDb().collection('settings').doc('global').get()

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

    const docRef = getAdminDb().collection('settings').doc('global')
    const currentDoc = await docRef.get()
    const currentData = currentDoc.exists ? currentDoc.data() : {}

    // Handle both nested and flat structures
    const updatedSettings: any = {
      ...currentData,
      updatedAt: new Date(),
    }

    // Merge nested structures
    if (body.branding) {
      updatedSettings.branding = { ...currentData.branding, ...body.branding }
    }
    if (body.contact) {
      updatedSettings.contact = { ...currentData.contact, ...body.contact }
    }
    if (body.social) {
      updatedSettings.social = { ...currentData.social, ...body.social }
    }
    if (body.socialLinks) {
      updatedSettings.socialLinks = { ...currentData.socialLinks, ...body.socialLinks }
    }
    if (body.seo) {
      updatedSettings.seo = { ...currentData.seo, ...body.seo }
    }
    if (body.chatbot) {
      updatedSettings.chatbot = { ...currentData.chatbot, ...body.chatbot }
    }

    // Handle flat structure fields
    const flatFields = ['siteName', 'description', 'logoUrl', 'logoUrlDark', 'email', 'phone', 'address', 'emailConfig']
    flatFields.forEach(field => {
      if (body[field] !== undefined) {
        updatedSettings[field] = body[field]
      }
    })

    // Also save to nested structure for backwards compatibility
    if (body.siteName || body.description) {
      updatedSettings.branding = {
        ...updatedSettings.branding,
        siteName: body.siteName || updatedSettings.branding?.siteName,
        description: body.description || updatedSettings.branding?.description,
      }
    }

    if (body.email || body.phone || body.address) {
      updatedSettings.contact = {
        ...updatedSettings.contact,
        email: body.email || updatedSettings.contact?.email,
        phone: body.phone || updatedSettings.contact?.phone,
        address: body.address || updatedSettings.contact?.address,
      }
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
