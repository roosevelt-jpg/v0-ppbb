/**
 * One-off seed for marketplace directory states (Part 5C/5D).
 *
 * Safe to re-run: uses fixed document IDs and merge:true — overwrites seed docs,
 * does not wipe unrelated businesses.
 *
 * Usage (from project root, with Admin env vars set — same as other scripts):
 *
 *   node --env-file=.env.local scripts/seed-businesses.mjs
 *
 * Or with npm:
 *   npm run seed:businesses
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL

if (!projectId || !privateKey || !clientEmail) {
  console.error(
    'Missing Firebase admin credentials. Set FIREBASE_ADMIN_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID), FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY in .env.local'
  )
  process.exit(1)
}

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      })

const db = getFirestore(app)

const PLACEHOLDER = (seed, w = 800, h = 600) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`

const SEED_MARKER = 'pb-seed-marketplace-5cd'

function sanitize(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      out[k] = sanitize(v)
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        item !== null && typeof item === 'object' && !(item instanceof Date)
          ? sanitize(item)
          : item
      )
    } else {
      out[k] = v
    }
  }
  return out
}

const businesses = [
  {
    id: 'seed-biz-featured-services',
    name: 'Barakah Consulting Studio',
    category: 'Consulting',
    description: 'Strategy and operations advisors for Muslim-owned startups across the UAE.',
    ownerName: 'Sara Al Maktoum',
    services: ['Business strategy', 'Ops review', 'Pitch coaching'],
    isApproved: true,
    isActive: true,
    featured: true,
    isVerified: true,
    status: 'approved',
  },
  {
    id: 'seed-biz-products-retail',
    name: 'Noor Home Goods',
    category: 'Products',
    description: 'Thoughtfully made homewares from local artisans.',
    ownerName: 'Omar Hassan',
    services: ['Home décor', 'Gifting'],
    isApproved: true,
    isActive: true,
    featured: false,
    isVerified: false,
    status: 'approved',
  },
  {
    id: 'seed-biz-suspended-coaching',
    name: 'Sakinah Coaching Co.',
    category: 'Coaching',
    description: 'Career and life coaching for sisters in tech.',
    ownerName: 'Layla Rahman',
    services: ['1:1 coaching', 'Workshops'],
    isApproved: true,
    isActive: false,
    featured: false,
    isVerified: false,
    status: 'suspended',
  },
  {
    id: 'seed-biz-pending-education',
    name: 'Hikmah Learning Labs',
    category: 'Education',
    description: 'Weekend workshops on Quran literacy for kids and teens.',
    ownerName: 'Yusuf Ibrahim',
    services: ['Kids classes', 'Parent workshops'],
    isApproved: false,
    isActive: true,
    featured: false,
    isVerified: false,
    status: 'pending_review',
  },
  {
    id: 'seed-biz-discounts-merch',
    name: 'UMmah Merch House',
    category: 'Merchandise',
    description: 'Faith-inspired apparel with exclusive PB member pricing.',
    ownerName: 'Amina Farooq',
    services: ['Apparel', 'Custom prints'],
    isApproved: true,
    isActive: true,
    featured: false,
    isVerified: true,
    status: 'approved',
    hasMemberDiscount: true,
  },
  {
    id: 'seed-biz-services-jobs',
    name: 'Amanah Digital Services',
    category: 'Services',
    description: 'Web design, photography, and social for community brands.',
    ownerName: 'Khalid Saeed',
    services: ['Web design', 'Photography', 'Social media'],
    isApproved: true,
    isActive: true,
    featured: false,
    isVerified: false,
    status: 'approved',
  },
]

async function seed() {
  console.log('\n=== Seeding marketplace businesses (Part 5C/5D) ===\n')
  const now = new Date()

  for (const biz of businesses) {
    const ref = db.collection('businesses').doc(biz.id)
    const payload = sanitize({
      name: biz.name,
      businessName: biz.name,
      category: biz.category,
      businessType: biz.category,
      description: biz.description,
      communityBenefit: `Supports Passive Blessings members with ${biz.category.toLowerCase()} expertise.`,
      ownerName: biz.ownerName,
      ownerId: biz.id,
      userId: biz.id,
      email: `${biz.id.replace(/-/g, '.')}@example.com`,
      phone: '+971500000000',
      location: 'Dubai',
      website: 'https://example.com',
      logoURL: PLACEHOLDER(`${biz.id}-logo`, 200, 200),
      bannerURL: PLACEHOLDER(`${biz.id}-banner`, 1200, 400),
      services: biz.services,
      productImages: [
        PLACEHOLDER(`${biz.id}-p1`, 600, 450),
        PLACEHOLDER(`${biz.id}-p2`, 600, 450),
      ],
      tradeLicenceURL: PLACEHOLDER(`${biz.id}-licence`, 800, 600),
      isApproved: biz.isApproved,
      isActive: biz.isActive,
      featured: biz.featured,
      isVerified: biz.isVerified,
      hasMemberDiscount: biz.hasMemberDiscount === true,
      status: biz.status,
      seedTag: SEED_MARKER,
      createdAt: now,
      updatedAt: now,
      submittedAt: now,
    })

    await ref.set(payload, { merge: true })
    console.log(
      `  ✓ businesses/${biz.id}  approved=${biz.isApproved} active=${biz.isActive} featured=${biz.featured} [${biz.category}]`
    )
  }

  // Sample member-discount offer for merchandise business
  const discountBiz = 'seed-biz-discounts-merch'
  const offerDiscountId = 'seed-offer-member-discount'
  await db
    .collection('offers')
    .doc(offerDiscountId)
    .set(
      sanitize({
        id: offerDiscountId,
        businessId: discountBiz,
        businessName: 'UMMAH Merch House',
        title: 'PB Members 20% Off Apparel',
        description: 'Exclusive member-only discount across all tees and hoodies.',
        category: 'Merchandise',
        type: 'discount',
        status: 'active',
        price: 80,
        originalPrice: 100,
        imageURL: PLACEHOLDER('seed-offer-discount', 600, 450),
        images: [PLACEHOLDER('seed-offer-discount', 600, 450)],
        isMemberDiscount: true,
        memberBenefit: 20,
        discountPercentage: 20,
        seedTag: SEED_MARKER,
        createdAt: now,
        updatedAt: now,
      }),
      { merge: true }
    )
  console.log(`  ✓ offers/${offerDiscountId} (isMemberDiscount) → ${discountBiz}`)

  // Jobs + offers for services business (counts on card)
  const jobsBiz = 'seed-biz-services-jobs'
  const jobId = 'seed-job-web-designer'
  await db
    .collection('jobs')
    .doc(jobId)
    .set(
      sanitize({
        id: jobId,
        businessId: jobsBiz,
        businessName: 'Amanah Digital Services',
        title: 'Freelance Web Designer',
        description: 'Part-time contract building landing pages for community partners.',
        category: 'Services',
        jobType: 'freelance',
        status: 'open',
        seedTag: SEED_MARKER,
        createdAt: now,
        updatedAt: now,
      }),
      { merge: true }
    )
  console.log(`  ✓ jobs/${jobId} → ${jobsBiz}`)

  const offerSaleId = 'seed-offer-brand-photoshoot'
  await db
    .collection('offers')
    .doc(offerSaleId)
    .set(
      sanitize({
        id: offerSaleId,
        businessId: jobsBiz,
        businessName: 'Amanah Digital Services',
        title: 'Brand Photoshoot Package',
        description: 'Half-day outdoor shoot with 30 edited images.',
        category: 'Services',
        type: 'service',
        status: 'active',
        price: 1200,
        imageURL: PLACEHOLDER('seed-offer-photoshoot', 600, 450),
        images: [PLACEHOLDER('seed-offer-photoshoot', 600, 450)],
        isMemberDiscount: false,
        seedTag: SEED_MARKER,
        createdAt: now,
        updatedAt: now,
      }),
      { merge: true }
    )
  console.log(`  ✓ offers/${offerSaleId} → ${jobsBiz}`)

  // Extra published product offer for products business (filter coverage)
  const productOfferId = 'seed-offer-home-gift-set'
  await db
    .collection('offers')
    .doc(productOfferId)
    .set(
      sanitize({
        id: productOfferId,
        businessId: 'seed-biz-products-retail',
        businessName: 'Noor Home Goods',
        title: 'Eid Gift Set',
        description: 'Curated home set for gifting season.',
        category: 'Products',
        type: 'product',
        status: 'active',
        price: 250,
        imageURL: PLACEHOLDER('seed-offer-gift', 600, 450),
        images: [PLACEHOLDER('seed-offer-gift', 600, 450)],
        isMemberDiscount: false,
        seedTag: SEED_MARKER,
        createdAt: now,
        updatedAt: now,
      }),
      { merge: true }
    )
  console.log(`  ✓ offers/${productOfferId} → seed-biz-products-retail`)

  console.log('\nDone. Seed docs use IDs starting with "seed-biz-" / "seed-offer-" / "seed-job-".')
  console.log(`Marker field: seedTag = "${SEED_MARKER}"`)
  console.log('Expected in public directory: featured consulting, products, merch (discount), services (with job+offer counts).')
  console.log('Hidden: suspended coaching. Pending: education (admin queue only).\n')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
