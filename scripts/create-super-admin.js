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
const email = 'roosevelt@myflynai.com';
const password = 'Roosevelt@SuperAdmin2025';

console.log('[v0] Creating SUPER ADMIN user...');
console.log('[v0] Email:', email);
console.log('[v0] Password:', password);

const signUpData = JSON.stringify({
  email: email,
  password: password,
  displayName: 'Roosevelt Admin',
  returnSecureToken: true
});

const options = {
  hostname: 'identitytoolkit.googleapis.com',
  path: `/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(signUpData)
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
        console.log('[v0] User created successfully!');
        console.log('[v0] UID:', response.localId);
        
        setTimeout(() => testLogin(email, password, FIREBASE_API_KEY, response.localId), 500);
      } else if (response.error?.message === 'EMAIL_EXISTS') {
        console.log('[v0] Email exists, testing login...');
        // Extract UID from error or get it another way
        setTimeout(() => testLogin(email, password, FIREBASE_API_KEY, null), 500);
      } else {
        console.log('[v0] Error:', response.error?.message);
        console.log('[v0] Full response:', data);
      }
    } catch (error) {
      console.log('[v0] Parse error:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.log('[v0] Request error:', error.message);
});

req.write(signUpData);
req.end();

function testLogin(email, password, apiKey, uid) {
  console.log('[v0] Testing login...');
  
  const loginData = JSON.stringify({
    email: email,
    password: password,
    returnSecureToken: true
  });

  const options = {
    hostname: 'identitytoolkit.googleapis.com',
    path: `/v1/accounts:signInWithPassword?key=${apiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
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
          console.log('[v0]');
          console.log('[v0] ✅ SUCCESS! Super Admin account created!');
          console.log('[v0]');
          console.log('[v0] Super Admin Credentials:');
          console.log('[v0] Email: ' + email);
          console.log('[v0] Password: ' + password);
          console.log('[v0] UID: ' + response.localId);
          console.log('[v0]');
          console.log('[v0] Next Steps:');
          console.log('[v0] 1. Run: node scripts/create-super-admin-firestore.js');
          console.log('[v0] 2. This will create the super admin profile in Firestore');
          console.log('[v0] 3. Then login to /admin/setup with access code PB-ADMIN-2025');
          console.log('[v0]');
        } else {
          console.log('[v0] ❌ Login failed:', response.error?.message);
        }
      } catch (error) {
        console.log('[v0] Parse error:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.log('[v0] Request error:', error.message);
  });

  req.write(loginData);
  req.end();
}
