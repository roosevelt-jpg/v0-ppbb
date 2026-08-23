/**
 * One-time Firestore data migration: old (downgraded) project -> new
 * production project. Copies every document (recursively including
 * subcollections) from the source project into the destination project.
 *
 * Why this exists: the app was repointed from the "pasiveblessings" Firebase
 * project to "passiveblessings-cc0ef" (see .firebaserc history). Firestore
 * data does not follow a project switch automatically, so content that
 * existed before the switch is invisible on the new project until it's
 * copied over explicitly. This script does that copy using plain Admin SDK
 * reads/writes, which works even if the source project is on the free
 * Spark plan (unlike `gcloud firestore export/import`, which requires
 * Blaze on both ends).
 *
 * IMPORTANT — Auth-UID-keyed collections:
 * `users`, `adminUsers`, and `admin-users` are keyed by Firebase Auth UID.
 * Auth UIDs are project-specific, so copying these documents by ID is only
 * correct AFTER migrating Firebase Auth itself with matching UIDs:
 *
 *   firebase auth:export users.json --project=<old-project-id>
 *   firebase auth:import users.json --project=<new-project-id> --hash-algo=SCRYPT ...
 *   (see: https://firebase.google.com/docs/cli/auth#auth-export-import)
 *
 * These three collections are excluded by default. Run Auth migration
 * first, then re-run this script with --include=users,adminUsers,admin-users
 * to bring the profile documents over too.
 *
 * Usage:
 *   node scripts/migrate-firestore-data.mjs \
 *     --from=/path/to/pasiveblessings-service-account.json \
 *     --to=/path/to/passiveblessings-cc0ef-service-account.json \
 *     [--collections=pages,events,businesses]   # allowlist (default: all top-level collections)
 *     [--include=users,adminUsers]              # add back specific default-excluded collections
 *     [--overwrite]                             # overwrite docs that already exist in destination
 *     [--dry-run]                               # print what would happen, write nothing
 */
import { readFileSync } from 'fs'
import { initializeApp, cert, deleteApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const DEFAULT_EXCLUDE = ['users', 'adminUsers', 'admin-users']

function parseArgs(argv) {
  const args = {}
  for (const raw of argv) {
    const match = raw.match(/^--([^=]+)(?:=(.*))?$/)
    if (!match) continue
    args[match[1]] = match[2] ?? true
  }
  return args
}

function csv(value) {
  return typeof value === 'string'
    ? value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : []
}

async function copyDocRecursive(sourceDocRef, destDocRef, bulkWriter, opts, stats) {
  const snap = await sourceDocRef.get()
  if (snap.exists) {
    if (opts.overwrite) {
      stats.written++
      if (!opts.dryRun) bulkWriter.set(destDocRef, snap.data())
    } else {
      const destSnap = await destDocRef.get()
      if (destSnap.exists) {
        stats.skippedExisting++
      } else {
        stats.written++
        if (!opts.dryRun) bulkWriter.set(destDocRef, snap.data())
      }
    }
  }

  const subcollections = await sourceDocRef.listCollections()
  for (const sub of subcollections) {
    await copyCollectionRecursive(sub, destDocRef.collection(sub.id), bulkWriter, opts, stats)
  }
}

async function copyCollectionRecursive(sourceColRef, destColRef, bulkWriter, opts, stats) {
  const snap = await sourceColRef.get()
  stats.collections.add(sourceColRef.path)
  for (const doc of snap.docs) {
    await copyDocRecursive(sourceColRef.doc(doc.id), destColRef.doc(doc.id), bulkWriter, opts, stats)
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.from || !args.to) {
    console.error(
      'Usage: node scripts/migrate-firestore-data.mjs --from=<old-service-account.json> --to=<new-service-account.json> [--collections=a,b,c] [--include=users,adminUsers] [--overwrite] [--dry-run]'
    )
    process.exit(1)
  }

  const opts = {
    overwrite: Boolean(args.overwrite),
    dryRun: Boolean(args['dry-run']),
  }

  const excluded = new Set(DEFAULT_EXCLUDE.filter((c) => !csv(args.include).includes(c)))
  const allowlist = csv(args.collections)

  const sourceSa = JSON.parse(readFileSync(args.from, 'utf8'))
  const destSa = JSON.parse(readFileSync(args.to, 'utf8'))

  const sourceApp = initializeApp({ credential: cert(sourceSa), projectId: sourceSa.project_id }, 'source')
  const destApp = initializeApp({ credential: cert(destSa), projectId: destSa.project_id }, 'dest')

  const sourceDb = getFirestore(sourceApp)
  const destDb = getFirestore(destApp)
  const bulkWriter = destDb.bulkWriter()
  bulkWriter.onWriteError((err) => {
    console.error(`Write failed for ${err.documentRef.path} (attempt ${err.failedAttempts}):`, err.message)
    return err.failedAttempts < 3
  })

  console.log(`Source: ${sourceSa.project_id}`)
  console.log(`Dest:   ${destSa.project_id}`)
  console.log(`Mode:   ${opts.dryRun ? 'DRY RUN (no writes)' : opts.overwrite ? 'OVERWRITE existing docs' : 'skip docs that already exist in dest'}`)
  console.log(`Excluding: ${[...excluded].join(', ') || '(none)'}`)
  console.log('')

  const topLevel = allowlist.length > 0 ? allowlist : (await sourceDb.listCollections()).map((c) => c.id)

  const stats = { written: 0, skippedExisting: 0, collections: new Set() }

  for (const name of topLevel) {
    if (excluded.has(name)) {
      console.log(`Skipping excluded collection: ${name}`)
      continue
    }
    console.log(`Copying collection: ${name}`)
    await copyCollectionRecursive(sourceDb.collection(name), destDb.collection(name), bulkWriter, opts, stats)
  }

  if (!opts.dryRun) await bulkWriter.close()

  console.log('')
  console.log(`Collections touched: ${stats.collections.size}`)
  console.log(`Documents written:   ${stats.written}`)
  console.log(`Documents skipped (already existed in dest): ${stats.skippedExisting}`)

  await deleteApp(sourceApp)
  await deleteApp(destApp)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
