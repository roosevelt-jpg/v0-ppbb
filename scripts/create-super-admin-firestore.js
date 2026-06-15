const https = require('https');
const fs = require('fs');

// Load env vars
const envPath = '/vercel/share/.env.project';
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  if (!line.trim() || line.trim().startsWith('#')) return;
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    let value = valueParts.join('=').trim();
    value = value.replace(/^['"](.*)['"]$/, '$1');
    env[key.trim()] = value;
  }
});

const FIREBASE_API_KEY = env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Get the super admin UID from user input or environment
const superAdminUid = process.argv[2];

if (!superAdminUid) {
  console.log('[v0] Please provide the super admin UID as argument');
  console.log('[v0] Usage: node scripts/create-super-admin-firestore.js <UID>');
  console.log('[v0]');
  console.log('[v0] Steps:');
  console.log('[v0] 1. Run: node scripts/create-super-admin.js');
  console.log('[v0] 2. Copy the UID from output');
  console.log('[v0] 3. Run: node scripts/create-super-admin-firestore.js <UID>');
  process.exit(1);
}

console.log('[v0] Creating super admin profile in Firestore...');
console.log('[v0] UID:', superAdminUid);

const superAdminData = {
  fields: {
    id: { stringValue: superAdminUid },
    email: { stringValue: 'roosevelt@myflynai.com' },
    displayName: { stringValue: 'Roosevelt Admin' },
    firstName: { stringValue: 'Roosevelt' },
    lastName: { stringValue: 'Admin' },
    role: { stringValue: 'super_admin' },
    permissions: { arrayValue: {
      values: [
        { stringValue: 'admin.create_admin' },
        { stringValue: 'admin.manage_users' },
        { stringValue: 'admin.manage_permissions' },
        { stringValue: 'admin.view_all' },
        { stringValue: 'admin.create_access_codes' },
        { stringValue: 'admin.manage_access_codes' },
        { stringValue: 'admin.manage_roles' },
        { stringValue: 'admin.delete_admin' }
      ]
    }},
    status: { stringValue: 'active' },
    createdAt: { timestampValue: new Date().toISOString() },
    updatedAt: { timestampValue: new Date().toISOString() },
    lastLogin: { timestampValue: new Date().toISOString() }
  }
};

const postData = JSON.stringify(superAdminData);

const options = {
  hostname: 'firestore.googleapis.com',
  path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${superAdminUid}?key=${FIREBASE_API_KEY}`,
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('[v0]');
        console.log('[v0] ✅ SUCCESS! Super admin profile created in Firestore!');
        console.log('[v0]');
        console.log('[v0] Super Admin Account Ready:');
        console.log('[v0] Email: roosevelt@myflynai.com');
        console.log('[v0] Password: Roosevelt@SuperAdmin2025');
        console.log('[v0] Role: super_admin');
        console.log('[v0] Permissions: All admin permissions granted');
        console.log('[v0]');
        console.log('[v0] Login at: https://test.myflynai.com/admin/setup');
        console.log('[v0] Access Code: PB-ADMIN-2025');
        console.log('[v0]');
      } else {
        console.log('[v0] Error creating profile:', response);
      }
    } catch (error) {
      console.log('[v0] Parse error:', error.message);
      console.log('[v0] Response status:', res.statusCode);
    }
  });
});

req.on('error', (error) => {
  console.log('[v0] Request error:', error.message);
});

req.write(postData);
req.end();
