const fs = require('fs')
const path = require('path')
const { GoogleAuth } = require('google-auth-library')

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  const env = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    let value = trimmed.slice(eq + 1)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value.replace(/\\n/g, '\n')
  }
  return env
}

async function main() {
  const env = loadEnvLocal()
  const projectId = env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = env.FIREBASE_ADMIN_PRIVATE_KEY
  const rules = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing FIREBASE_ADMIN_* credentials in .env.local')
  }

  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: [
      'https://www.googleapis.com/auth/firebase',
      'https://www.googleapis.com/auth/cloud-platform',
    ],
  })
  const client = await auth.getClient()
  const { token } = await client.getAccessToken()
  if (!token) throw new Error('Failed to obtain access token')

  const createRes = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: {
          files: [{ name: 'firestore.rules', content: rules }],
        },
      }),
    }
  )
  const created = await createRes.json()
  if (!createRes.ok) {
    console.error('Create ruleset failed', createRes.status, created)
    process.exit(1)
  }
  console.log('Created ruleset:', created.name)

  const releaseName = `projects/${projectId}/releases/cloud.firestore`
  const releaseBody = {
    name: releaseName,
    rulesetName: created.name,
  }

  const releaseRes = await fetch(
    `https://firebaserules.googleapis.com/v1/${releaseName}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(releaseBody),
    }
  )
  const releaseText = await releaseRes.text()
  let released
  try {
    released = JSON.parse(releaseText)
  } catch {
    released = releaseText
  }
  if (!releaseRes.ok) {
    const patchRes = await fetch(
      `https://firebaserules.googleapis.com/v1/${releaseName}?updateMask=rulesetName`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(releaseBody),
      }
    )
    const patchText = await patchRes.text()
    let patched
    try {
      patched = JSON.parse(patchText)
    } catch {
      patched = patchText
    }
    if (!patchRes.ok) {
      console.error('Release PUT failed', releaseRes.status, released)
      console.error('Release PATCH failed', patchRes.status, patched)
      console.error(
        'Ruleset was created but not released. Publish manually in Firebase Console → Firestore → Rules, or run: firebase login && npx firebase-tools deploy --only firestore:rules'
      )
      process.exit(1)
    }
    console.log('Patched release:', patched.name || patched)
  } else {
    console.log('Updated release:', released.name || released)
  }

  console.log('SUCCESS: firestore rules deployed to', projectId)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
