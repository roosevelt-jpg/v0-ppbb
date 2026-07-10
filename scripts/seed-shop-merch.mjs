/**
 * Seed sample Merchandise offers for /shop (Part 8A).
 *
 * Safe to re-run: fixed document IDs — skips docs that already exist.
 *
 * Usage (from project root):
 *   npm run seed:shop
 *   node --env-file=.env.local scripts/seed-shop-merch.mjs
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL

// Also accept GCP_SERVICE_ACCOUNT JSON (used by Next API routes)
function credentialsFromEnv() {
  if (projectId && privateKey && clientEmail) {
    return { projectId, privateKey, clientEmail }
  }
  const raw = process.env.GCP_SERVICE_ACCOUNT
  if (!raw) return null
  try {
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'))
    }
    return {
      projectId: parsed.project_id || projectId,
      privateKey: String(parsed.private_key || '').replace(/\\n/g, '\n'),
      clientEmail: parsed.client_email,
    }
  } catch {
    return null
  }
}

const creds = credentialsFromEnv()
if (!creds?.projectId || !creds?.privateKey || !creds?.clientEmail) {
  console.error(
    'Missing Firebase admin credentials. Set FIREBASE_ADMIN_* or GCP_SERVICE_ACCOUNT in .env.local'
  )
  process.exit(1)
}

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: creds.projectId,
          privateKey: creds.privateKey,
          clientEmail: creds.clientEmail,
        }),
      })

const db = getFirestore(app)

const SEED_MARKER = 'pb-seed-shop-8a'
const BUSINESS_ID = 'seed-pb-merch'
const BUSINESS_NAME = 'Passive Blessings Merch'

function sanitize(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      out[k] = sanitize(v)
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        item !== null && typeof item === 'object' && !(item instanceof Date) ? sanitize(item) : item
      )
    } else {
      out[k] = v
    }
  }
  return out
}

const placeholder = (seed, w = 800, h = 1000) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`

const PRODUCTS = [
  {
    id: 'seed-merch-estd-2025-hoodie',
    title: 'Estd 2025 Hoodie',
    variant: 'CREAM / BRONZE',
    price: 320,
    imageSeed: 'pb-hoodie-cream',
  },
  {
    id: 'seed-merch-six-pillars-cap',
    title: 'Six Pillars Cap',
    variant: 'BLACK / GOLD',
    price: 120,
    imageSeed: 'pb-cap-black',
  },
  {
    id: 'seed-merch-sadaqah-tee',
    title: 'Sadaqah Tee',
    variant: 'CREAM',
    price: 180,
    imageSeed: 'pb-tee-cream',
  },
  {
    id: 'seed-merch-ramadan-crew',
    title: 'Limited Ramadan Crew',
    variant: 'DROP 01',
    price: 380,
    imageSeed: 'pb-crew-ramadan',
  },
]

async function main() {
  console.log('[seed:shop] Seeding merchandise offers…')

  let created = 0
  let skipped = 0

  for (const product of PRODUCTS) {
    const ref = db.collection('offers').doc(product.id)
    const existing = await ref.get()
    if (existing.exists) {
      console.log(`  skip  ${product.id} (already exists)`)
      skipped++
      continue
    }

    const imageURL = placeholder(product.imageSeed)
    const payload = sanitize({
      id: product.id,
      businessId: BUSINESS_ID,
      businessName: BUSINESS_NAME,
      title: product.title,
      description: `${product.title} — purpose-driven Passive Blessings merchandise. A portion of every sale funds the meal programme.`,
      category: 'merchandise',
      type: 'product',
      status: 'published',
      price: product.price,
      currency: 'AED',
      variant: product.variant,
      imageURL,
      images: [imageURL],
      isMemberDiscount: false,
      seedMarker: SEED_MARKER,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    await ref.set(payload)
    console.log(`  create ${product.id} — ${product.title} (${product.variant}) AED ${product.price}`)
    created++
  }

  // Seed default platformConfig/shop if missing
  const shopRef = db.collection('platformConfig').doc('shop')
  const shopSnap = await shopRef.get()
  if (!shopSnap.exists) {
    await shopRef.set(
      sanitize({
        pageConfig: {
          headline: 'Merch & Products',
          body: 'Purpose-driven products. Every purchase fuels a cause.',
          donateBannerEyebrow: 'DONATE VIA PURCHASE',
          donateBannerHeadline: 'A portion of every sale funds the meal programme.',
          donateBannerCTA: 'See impact',
          donateBannerCTAHref: '/impact',
        },
        seedMarker: SEED_MARKER,
        updatedAt: FieldValue.serverTimestamp(),
      })
    )
    console.log('  create platformConfig/shop (defaults)')
  } else {
    console.log('  skip  platformConfig/shop (already exists)')
  }

  console.log(`[seed:shop] Done. created=${created} skipped=${skipped}`)
}

main().catch((err) => {
  console.error('[seed:shop] Failed:', err)
  process.exit(1)
})
