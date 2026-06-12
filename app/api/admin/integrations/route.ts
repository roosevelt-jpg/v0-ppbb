import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { hasPermission } from '@/lib/admin-access'
import { saveIntegration, getIntegration, getAllIntegrations, deleteIntegration, updateIntegrationStatus } from '@/lib/integrations/handlers'
import { redactCredentials } from '@/lib/integrations/encryption'

async function checkPermission(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[v0] No Bearer token')
      return null
    }

    const token = authHeader.substring(7)
    const decodedToken = await getAuth().verifyIdToken(token)
    const userId = decodedToken.uid

    let hasAccess = await hasPermission(userId, 'manage_integrations')
    console.log('[v0] Initial permission check:', hasAccess, 'for', userId)
    
    // If no access, try to grant it for founder_admin
    if (!hasAccess) {
      try {
        const { getFirestore, doc, getDoc, updateDoc } = await import('firebase/firestore')
        const { initializeApp, getApps } = await import('firebase/app')
        
        const app = getApps().length > 0 ? getApps()[0] : initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        })

        const db = getFirestore(app)
        const adminRef = doc(db, 'adminUsers', userId)
        const adminSnap = await getDoc(adminRef)
        
        if (adminSnap.exists()) {
          const adminData = adminSnap.data()
          console.log('[v0] Admin user role:', adminData?.adminRole)
          
          if (adminData?.adminRole === 'founder_admin') {
            const currentPerms = adminData?.permissions || []
            if (!currentPerms.includes('manage_integrations')) {
              console.log('[v0] Granting manage_integrations to founder_admin')
              await updateDoc(adminRef, { 
                permissions: [...currentPerms, 'manage_integrations'] 
              })
            }
            hasAccess = true
          }
        }
      } catch (permError) {
        console.error('[v0] Permission grant error:', permError)
      }
    }
    
    return hasAccess ? userId : null
  } catch (error) {
    console.error('[v0] Auth error:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await checkPermission(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integrations = await getAllIntegrations(userId)
    
    // Redact sensitive fields
    const redacted = integrations.map((int) => ({
      ...int,
      credentials: redactCredentials(int.credentials, int.serviceId),
    }))

    return NextResponse.json({
      success: true,
      count: redacted.length,
      data: redacted,
    })
  } catch (error) {
    console.error('[v0] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await checkPermission(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { serviceId, credentials } = body

    if (!serviceId || !credentials) {
      return NextResponse.json({ error: 'Missing serviceId or credentials' }, { status: 400 })
    }

    console.log('[v0] Saving integration:', serviceId, 'for', userId)

    const integration = await saveIntegration(userId, serviceId, credentials)
    
    return NextResponse.json({
      success: true,
      data: {
        ...integration,
        credentials: redactCredentials(integration.credentials, serviceId),
      },
    })
  } catch (error) {
    console.error('[v0] POST error:', error)
    return NextResponse.json({ error: 'Failed to save integration' }, { status: 500 })
  }
}
