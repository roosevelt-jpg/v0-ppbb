import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { hasPermission } from '@/lib/admin-access'
import { getIntegration, deleteIntegration, updateIntegrationStatus } from '@/lib/integrations/handlers'
import { redactCredentials } from '@/lib/integrations/encryption'

async function checkPermission(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.substring(7)
    const decodedToken = await getAuth().verifyIdToken(token)
    const userId = decodedToken.uid
    
    let hasAccess = await hasPermission(userId, 'manage_integrations')
    
    // Auto-grant for founder_admin
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
          if (adminData?.adminRole === 'founder_admin') {
            const currentPerms = adminData?.permissions || []
            if (!currentPerms.includes('manage_integrations')) {
              await updateDoc(adminRef, { 
                permissions: [...currentPerms, 'manage_integrations'] 
              })
            }
            hasAccess = true
          }
        }
      } catch (err) {
        console.error('[v0] Permission grant error:', err)
      }
    }
    
    return hasAccess ? userId : null
  } catch (error) {
    console.error('[v0] Auth error:', error)
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const userId = await checkPermission(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const integration = await getIntegration(userId, params.serviceId)
    if (!integration) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      success: true,
      data: {
        ...integration,
        credentials: redactCredentials(integration.credentials, params.serviceId),
      },
    })
  } catch (error) {
    console.error('[v0] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const userId = await checkPermission(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await deleteIntegration(userId, params.serviceId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const userId = await checkPermission(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { status, testResult } = body

    await updateIntegrationStatus(userId, params.serviceId, status, testResult)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
