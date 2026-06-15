const fs = require('fs');
const https = require('https');

// Load environment variables from .env.project
const envPath = '/vercel/share/.env.project';
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  if (!line.trim() || line.trim().startsWith('#')) return;
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    let value = valueParts.join('=').trim();
    // Remove quotes if present
    value = value.replace(/^['"](.*)['"]$/, '$1');
    env[key.trim()] = value;
  }
});

const FIREBASE_API_KEY = env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIREBASE_PROJECT_ID = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!FIREBASE_API_KEY || !FIREBASE_PROJECT_ID) {
  console.error('[v0] Missing Firebase configuration');
  process.exit(1);
}

// Use Firebase REST API to create user
function createAdminUser() {
  return new Promise((resolve, reject) => {
    const email = 'admin@passiveblessings.com';
    const password = 'Admin@PassiveBlessing2025';
    const displayName = 'Admin User';

    const postData = JSON.stringify({
      email: email,
      password: password,
      displayName: displayName,
      returnSecureToken: true
    });

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      method: 'POST',
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

          if (res.statusCode === 200) {
            console.log('[v0] Admin user created successfully!');
            console.log(`[v0] Email: ${email}`);
            console.log(`[v0] Password: ${password}`);
            console.log(`[v0] UID: ${response.localId}`);
            console.log('[v0] You can now login to the admin panel at /admin/setup');
            resolve();
          } else {
            if (response.error?.message === 'EMAIL_EXISTS') {
              console.log('[v0] Admin user already exists!');
              console.log(`[v0] Email: ${email}`);
              console.log(`[v0] Password: ${password}`);
              console.log('[v0] You can login to the admin panel at /admin/setup');
              resolve();
            } else {
              reject(new Error(`Firebase API Error: ${response.error?.message || data}`));
            }
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

createAdminUser()
  .then(() => {
    console.log('[v0] Admin user setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[v0] Error creating admin user:', error.message);
    process.exit(1);
  });
