import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { hasPermission } from '@/lib/admin-access'
import { getAllIntegrationHealth, getIntegrationHealth } from '@/lib/integrations/handlers'
import { getAllServices } from '@/lib/integrations/services'

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

export async function GET(request: NextRequest) {
  try {
    const userId = await checkPermission(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const healthData = await getAllIntegrationHealth()
    const allServices = getAllServices()

    // Ensure all services have health records
    const completeHealth = allServices.map((service) => {
      const health = healthData.find((h) => h.serviceId === service.id)
      return (
        health || {
          id: `${service.id}_health`,
          serviceId: service.id,
          serviceName: service.name,
          status: 'not_configured',
          latency: 0,
          lastChecked: new Date(),
          uptime90d: 0,
          incidentCount: 0,
        }
      )
    })

    // Calculate summary stats
    const operational = completeHealth.filter((h) => h.status === 'operational').length
    const degraded = completeHealth.filter((h) => h.status === 'degraded').length
    const down = completeHealth.filter((h) => h.status === 'down').length
    const notConfigured = completeHealth.filter((h) => h.status === 'not_configured').length
    const avgLatency = Math.round(
      completeHealth.filter((h) => h.latency > 0).reduce((sum, h) => sum + h.latency, 0) / 
      Math.max(completeHealth.filter((h) => h.latency > 0).length, 1)
    )

    return NextResponse.json({
      success: true,
      summary: {
        total: completeHealth.length,
        operational,
        degraded,
        down,
        notConfigured,
        avgLatency,
        overallStatus: operational > 0 ? 'operational' : degraded > 0 ? 'degraded' : 'down',
      },
      health: completeHealth,
    })
  } catch (error) {
    console.error('[v0] Health check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
