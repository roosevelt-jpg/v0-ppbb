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

console.log('[v0] Testing Firebase Auth...');
console.log('[v0] Email: admin@passiveblessings.com');
console.log('[v0] Password: Admin@PassiveBlessing2025');

const postData = JSON.stringify({
  email: 'admin@passiveblessings.com',
  password: 'Admin@PassiveBlessing2025',
  returnSecureToken: true
});

const options = {
  hostname: 'identitytoolkit.googleapis.com',
  path: `/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
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
        console.log('[v0] SUCCESS! Login works!');
        console.log('[v0] UID:', response.localId);
        console.log('[v0] Token:', response.idToken.substring(0, 20) + '...');
      } else {
        console.log('[v0] ERROR:', response.error?.message || data);
      }
    } catch (error) {
      console.log('[v0] Parse error:', error.message);
      console.log('[v0] Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('[v0] Request error:', error.message);
});

req.write(postData);
req.end();
