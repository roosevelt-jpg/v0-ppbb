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

console.log('[v0] Creating super admin Firebase user...');
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
        console.log('[v0]');
        console.log('[v0] ✅ SUCCESS! Super admin user created!');
        console.log('[v0]');
        console.log('[v0] Firebase UID:', response.localId);
        console.log('[v0]');
        console.log('[v0] Super Admin Credentials:');
        console.log('[v0] Email:', email);
        console.log('[v0] Password:', password);
        console.log('[v0]');
        console.log('[v0] Go to https://test.myflynai.com/admin/setup and login');
        console.log('[v0] Access Code: PB-ADMIN-2025');
      } else if (response.error?.message === 'EMAIL_EXISTS') {
        console.log('[v0]');
        console.log('[v0] ℹ️ Super admin user already exists');
        console.log('[v0] Email:', email);
        console.log('[v0] Password:', password);
        console.log('[v0]');
        console.log('[v0] Go to https://test.myflynai.com/admin/setup to login');
        console.log('[v0] Access Code: PB-ADMIN-2025');
      } else {
        console.log('[v0] Error:', response.error?.message || data);
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
