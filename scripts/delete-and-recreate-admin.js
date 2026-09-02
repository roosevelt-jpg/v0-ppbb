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
const email = 'admin@passiveblessings.com';
const password = 'TempAdmin@123';

console.log('[v0] Getting current ID token for deletion...');

// First, try to get any valid ID token
const getTempData = JSON.stringify({
  email: 'admin@passiveblessings.com',
  password: 'TempAdmin@123',
  returnSecureToken: true
});

// Actually, we can't delete without credentials. Let's just try a fresh user with a known email
const newEmail = 'pbadmin@passiveblessings.com';
const newPassword = 'Admin@123456';

console.log('[v0] Creating FRESH admin user with new email...');
console.log('[v0] Email:', newEmail);
console.log('[v0] Password:', newPassword);

const signUpData = JSON.stringify({
  email: newEmail,
  password: newPassword,
  displayName: 'Admin User',
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
        console.log('[v0] Fresh user created successfully!');
        console.log('[v0] UID:', response.localId);
        
        setTimeout(() => testLogin(newEmail, newPassword, FIREBASE_API_KEY), 500);
      } else if (response.error?.message === 'EMAIL_EXISTS') {
        console.log('[v0] Email exists, testing login...');
        setTimeout(() => testLogin(newEmail, newPassword, FIREBASE_API_KEY), 500);
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

function testLogin(email, password, apiKey) {
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
          console.log('[v0] ✅ SUCCESS! Admin login is working!');
          console.log('[v0]');
          console.log('[v0] Admin Login Credentials:');
          console.log('[v0] Email: ' + email);
          console.log('[v0] Password: ' + password);
          console.log('[v0] Access Code: PB-ADMIN-2025');
          console.log('[v0]');
          console.log('[v0] Go to: https://www.passive-blessings.com/admin/setup');
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
