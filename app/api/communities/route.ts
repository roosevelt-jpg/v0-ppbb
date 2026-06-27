import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore'

let db: any

function getAdminDb() {
  if (db) return db
  
  const app = getApps().length > 0 ? getApps()[0] : initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    } as any),
  })
  
  db = getAdminFirestore(app)
  return db
}

// GET - Fetch communities
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('id')
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const visibility = searchParams.get('visibility') || 'public'

    // Get single community
    if (communityId) {
      const doc = await db.collection('communities').doc(communityId).get()
      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Community not found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        data: { id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt, updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt },
      })
    }

    // Get user's communities
    if (userId) {
      const memberQuery = await db.collection('community-memberships')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .get()

      const communityIds = memberQuery.docs.map(d => d.data().communityId)
      if (communityIds.length === 0) {
        return NextResponse.json({ success: true, data: [] })
      }

      const communities = []
      for (const cId of communityIds) {
        const communityDoc = await db.collection('communities').doc(cId).get()
        if (communityDoc.exists) {
          communities.push({
            id: communityDoc.id,
            ...communityDoc.data(),
            createdAt: communityDoc.data().createdAt?.toDate?.() || communityDoc.data().createdAt,
            updatedAt: communityDoc.data().updatedAt?.toDate?.() || communityDoc.data().updatedAt,
          })
        }
      }
      return NextResponse.json({ success: true, data: communities })
    }

    // Get public communities (with optional category filter)
    let commQuery = db.collection('communities').where('visibility', '==', visibility)
    if (category) {
      commQuery = commQuery.where('category', '==', category)
    }
    commQuery = commQuery.where('status', '==', 'active')

    const snapshot = await commQuery.get()
    const communities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }))

    return NextResponse.json({ success: true, data: communities })
  } catch (error) {
    console.error('[v0] Error fetching communities:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch communities' }, { status: 500 })
  }
}

// POST - Create community (admin only)
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const { name, description, category, visibility, createdBy, icon, banner, rules, tags } = body

    if (!name || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Name and createdBy are required' },
        { status: 400 }
      )
    }

    console.log('[v0] Creating community:', { name, category, visibility })

    const communityRef = await db.collection('communities').add({
      name,
      description: description || '',
      category: category || 'general',
      visibility: visibility || 'public',
      icon: icon || null,
      banner: banner || null,
      status: 'active',
      createdBy,
      members: {
        total: 1,
        admins: [createdBy],
      },
      tags: tags || [],
      rules: rules || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Add creator as admin member
    await db.collection('community-memberships').add({
      userId: createdBy,
      communityId: communityRef.id,
      role: 'admin',
      joinedAt: new Date(),
      status: 'active',
      permissions: [
        'post_message',
        'post_image',
        'post_file',
        'create_group',
        'moderate_content',
        'manage_members',
        'delete_message',
      ],
    })

    console.log('[v0] Community created:', communityRef.id)

    return NextResponse.json({
      success: true,
      data: {
        id: communityRef.id,
        name,
        category,
        visibility,
      },
    })
  } catch (error) {
    console.error('[v0] Error creating community:', error)
    return NextResponse.json({ success: false, error: 'Failed to create community' }, { status: 500 })
  }
}

// PUT - Update community
export async function PUT(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const { communityId, ...updateData } = body

    if (!communityId) {
      return NextResponse.json(
        { success: false, error: 'communityId is required' },
        { status: 400 }
      )
    }

    console.log('[v0] Updating community:', communityId)

    await db.collection('communities').doc(communityId).update({
      ...updateData,
      updatedAt: new Date(),
    })

    console.log('[v0] Community updated successfully')

    return NextResponse.json({ success: true, message: 'Community updated' })
  } catch (error) {
    console.error('[v0] Error updating community:', error)
    return NextResponse.json({ success: false, error: 'Failed to update community' }, { status: 500 })
  }
}

// DELETE - Delete community
export async function DELETE(request: NextRequest) {
  try {
    const db = getAdminDb()
    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('id')

    if (!communityId) {
      return NextResponse.json(
        { success: false, error: 'Community ID is required' },
        { status: 400 }
      )
    }

    console.log('[v0] Deleting community:', communityId)

    await db.collection('communities').doc(communityId).update({
      status: 'archived',
      updatedAt: new Date(),
    })

    console.log('[v0] Community archived successfully')

    return NextResponse.json({ success: true, message: 'Community archived' })
  } catch (error) {
    console.error('[v0] Error deleting community:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete community' }, { status: 500 })
  }
}
