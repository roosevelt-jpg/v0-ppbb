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
const password = 'AdminPassword123!@#';

console.log('[v0] Creating NEW admin user...');
console.log('[v0] Email:', email);
console.log('[v0] Password:', password);

const postData = JSON.stringify({
  email: email,
  password: password,
  displayName: 'Admin User',
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
        console.log('[v0] User created successfully!');
        console.log('[v0] UID:', response.localId);
        
        // Now test login immediately
        testLogin(email, password, FIREBASE_API_KEY);
      } else if (response.error?.message === 'EMAIL_EXISTS') {
        console.log('[v0] User already exists, testing login...');
        testLogin(email, password, FIREBASE_API_KEY);
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

req.write(postData);
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

  setTimeout(() => {
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
            console.log('[v0]');
            console.log('[v0] Use these credentials:');
            console.log('[v0] Email:', email);
            console.log('[v0] Password:', password);
          } else {
            console.log('[v0] Login failed:', response.error?.message);
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
  }, 1000);
}
