# Firestore Real-Time Data Sync - Technical Architecture

## Overview

The Passive Blessings admin dashboard uses Firestore for real-time data synchronization across all integrations, users, and admin operations. This document outlines the complete architecture for real-time data storage and retrieval.

---

## Real-Time Data Flow Architecture

### 1. Data Collection Structure

```
Firestore (Real-Time Database)
│
├── collections/
│   ├── integrations/                    # All configured integrations
│   │   └── {userId}_{serviceId}
│   │       ├── id: string
│   │       ├── userId: string          # For per-user scoping
│   │       ├── serviceId: string
│   │       ├── serviceName: string
│   │       ├── credentials: {          # AES-256 encrypted
│   │       │   iv: string,
│   │       │   encryptedData: string
│   │       │ }
│   │       ├── status: 'active' | 'inactive' | 'error'
│   │       ├── lastError: string
│   │       ├── createdAt: timestamp
│   │       └── updatedAt: timestamp
│   │
│   ├── integrationHealth/               # Health monitoring
│   │   └── {serviceId}
│   │       ├── id: string
│   │       ├── serviceId: string
│   │       ├── serviceName: string
│   │       ├── status: 'operational' | 'degraded' | 'down' | 'not_configured'
│   │       ├── latency: number          # milliseconds
│   │       ├── lastChecked: timestamp
│   │       ├── uptime90d: number        # percentage (0-100)
│   │       ├── incidentCount: number
│   │       ├── incidents: [{
│   │       │   timestamp: timestamp,
│   │       │   message: string,
│   │       │   duration: number
│   │       │ }]
│   │       └── updatedAt: timestamp
│   │
│   ├── adminUsers/                      # Admin user permissions
│   │   └── {userId}
│   │       ├── id: string
│   │       ├── email: string
│   │       ├── adminRole: 'founder_admin' | 'admin' | 'moderator'
│   │       ├── permissions: string[]    # ['manage_integrations', ...]
│   │       ├── createdAt: timestamp
│   │       ├── updatedAt: timestamp
│   │       └── lastLogin: timestamp
│   │
│   └── [Other collections for members, donations, events, etc.]
```

---

## Real-Time Firebase Authentication Integration

### Authentication Flow

```
User Login → Firebase Auth
    ↓
Generate ID Token
    ↓
Browser stores token (secure session)
    ↓
API requests include Bearer token
    ↓
Server verifies with firebase-admin
    ↓
Permission check → Access granted/denied
    ↓
Real-time Firestore listener starts
    ↓
Live data sync to admin dashboard
```

### Token Verification (Server-Side)

```typescript
// In API routes (app/api/admin/integrations/route.ts)

1. Extract Bearer token from Authorization header
2. Call firebase-admin.auth().verifyIdToken(token)
3. Get uid (userId) from verified token
4. Query Firestore for user permissions
5. Check if user has required permission
6. If founder_admin: auto-grant manage_integrations
7. Proceed with requested operation
```

---

## Data Persistence & Encryption

### Credential Encryption Pipeline

```
User enters credentials → Client component
    ↓
Send via HTTPS to API endpoint
    ↓
Server receives credentials
    ↓
Extract serviceId for encryption key
    ↓
Generate random IV (Initialization Vector)
    ↓
Encrypt with AES-256-CBC
    ↓
Store in Firestore:
{
  iv: "random_hex_string",
  encryptedData: "encrypted_credentials_base64"
}
    ↓
Return success response
    ↓
User sees "Configuration saved"
```

### Credential Decryption Pipeline

```
Request for integration data → API endpoint
    ↓
Verify authentication & permissions
    ↓
Query Firestore for {userId}_{serviceId}
    ↓
Extract encrypted credentials:
{
  iv: "random_hex_string",
  encryptedData: "encrypted_base64"
}
    ↓
Use serviceId to derive encryption key
    ↓
Extract IV from stored data
    ↓
Decrypt with AES-256-CBC
    ↓
Parse decrypted JSON
    ↓
Redact sensitive fields in response
    ↓
Return to client
```

---

## Real-Time Data Sync Implementation

### Client-Side Real-Time Listeners

```typescript
// In components/admin/integration-modal.tsx

const auth = useFirebase();

useEffect(() => {
  if (!auth.user) return;

  // Real-time listener for integration changes
  const unsubscribe = onSnapshot(
    doc(db, 'integrations', `${auth.user.uid}_{serviceId}`),
    (doc) => {
      // Automatically update UI when Firestore changes
      setIntegration(doc.data());
    },
    (error) => {
      setError('Real-time sync failed');
    }
  );

  return () => unsubscribe(); // Cleanup
}, [auth.user, serviceId]);
```

### Server-Side Real-Time Operations

```typescript
// In lib/integrations/handlers-server.ts

export async function saveIntegrationServer(
  userId: string,
  serviceId: string,
  credentials: Record<string, string>
): Promise<Integration> {
  const db = getAdminDb(); // firebase-admin Firestore
  
  // Encrypt credentials
  const encrypted = encryptCredentials(credentials, serviceId);
  
  // Write to Firestore with timestamp
  await db.collection('integrations').doc(`${userId}_${serviceId}`).set(
    {
      userId,
      serviceId,
      credentials: encrypted,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(), // Triggers real-time listeners
    },
    { merge: true } // Update if exists
  );

  // This write automatically triggers:
  // 1. Client-side onSnapshot() listeners
  // 2. Cloud Function triggers (if any)
  // 3. Security rule validations
}
```

---

## Real-Time Health Monitoring

### Health Check Cycle

```
Every 5 minutes:

1. Server queries all integrations
2. For each active integration:
   a. Test connection/credentials
   b. Measure response latency
   c. Record status (operational/degraded/down)
   d. Update Firestore integrationHealth/{serviceId}
3. Real-time listeners push update to dashboard
4. Admin sees live status without refresh
5. Charts/analytics auto-update with new data
```

### Health Check Implementation

```typescript
// In lib/integrations/handlers-server.ts

export async function getIntegrationHealthServer(
  serviceId: string
): Promise<IntegrationHealth | null> {
  const db = getAdminDb();
  
  // Real-time query
  const snap = await db
    .collection('integrationHealth')
    .doc(serviceId)
    .get();
  
  return snap.exists ? (snap.data() as IntegrationHealth) : null;
}

// Health data structure
{
  serviceId: 'firebase',
  status: 'operational',
  latency: 45, // milliseconds
  lastChecked: 2026-06-13T12:30:54Z,
  uptime90d: 99.8,
  incidentCount: 1
}
```

---

## Per-User Data Isolation

### Database-Level Scoping

```
Instead of shared integrations, each user has isolated data:

Before:
integrations/
├── firebase
├── paypal
└── whatsapp

After (with userId scoping):
integrations/
├── user123_firebase      # User A's Firebase config
├── user123_paypal        # User A's PayPal config
├── user456_firebase      # User B's Firebase config (different data)
└── user456_paypal        # User B's PayPal config

Benefit: No cross-user data leakage
```

### Permission Verification

```typescript
// Server-side check before returning data

export async function getAllIntegrationsServer(
  userId: string
): Promise<Integration[]> {
  const db = getAdminDb();
  
  // Filter by userId - guarantees per-user data isolation
  const snap = await db
    .collection('integrations')
    .where('userId', '==', userId) // CRITICAL: filters by user
    .get();
  
  // Return only current user's integrations
  return snap.docs.map(doc => doc.data() as Integration);
}
```

---

## API Endpoint Details

### GET /api/admin/integrations
**Returns:** All integrations for current user with health status

```typescript
Request:
GET /api/admin/integrations
Authorization: Bearer {idToken}

Response:
{
  data: [
    {
      id: "user123_firebase",
      userId: "user123",
      serviceId: "firebase",
      serviceName: "Firebase Admin SDK",
      credentials: {REDACTED}, // Never expose
      status: "active",
      createdAt: "2026-06-13T...",
      updatedAt: "2026-06-13T..."
    },
    ...
  ]
}
```

### POST /api/admin/integrations
**Saves:** New integration configuration (triggers real-time update)

```typescript
Request:
POST /api/admin/integrations
Authorization: Bearer {idToken}
Content-Type: application/json

{
  serviceId: "paypal",
  credentials: {
    clientId: "xxx",
    clientSecret: "yyy",
    mode: "sandbox"
  },
  serviceName: "PayPal"
}

Response:
{
  success: true,
  data: {
    id: "user123_paypal",
    status: "active",
    createdAt: "2026-06-13T..."
  }
}

Side Effects:
- Firestore document created/updated
- All connected clients get real-time update
- Health check scheduled for new integration
```

### GET /api/admin/integrations/health
**Returns:** Real-time health status for all integrations

```typescript
Request:
GET /api/admin/integrations/health
Authorization: Bearer {idToken}

Response:
{
  success: true,
  summary: {
    total: 14,
    operational: 8,
    degraded: 2,
    down: 0,
    notConfigured: 4,
    avgLatency: 42
  },
  health: [
    {
      serviceId: "firebase",
      serviceName: "Firebase Admin SDK",
      status: "operational",
      latency: 35,
      lastChecked: "2026-06-13T12:30:54Z",
      uptime90d: 99.8,
      incidentCount: 1
    },
    ...
  ]
}
```

---

## Security & Best Practices

### 1. Credential Encryption
- ✅ AES-256-CBC with random IVs
- ✅ Encrypted before Firestore storage
- ✅ Never logged or exposed in responses
- ✅ Decryption only on server-side

### 2. Authentication
- ✅ Firebase ID tokens on all requests
- ✅ Token verification with firebase-admin
- ✅ Automatic permission verification
- ✅ founder_admin auto-grant on first access

### 3. Per-User Isolation
- ✅ Data scoped by userId_{serviceId}
- ✅ Query filters ensure user-only access
- ✅ Cross-user access denied at API level
- ✅ Firestore security rules enforce

### 4. Real-Time Sync
- ✅ Server-side listeners for health checks
- ✅ Client-side listeners for UI updates
- ✅ Automatic re-sync on token refresh
- ✅ Error handling with fallback mechanisms

---

## Production Deployment

### Environment Variables Required

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin (Server-Side Only)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_ADMIN_CLIENT_EMAIL=admin@your-project.iam.gserviceaccount.com
```

### Deployment Status

- ✅ Build: 80MB (optimized)
- ✅ API Routes: All endpoints active
- ✅ Firestore: Connected and syncing
- ✅ Authentication: Firebase Auth integrated
- ✅ Real-Time: Listeners active
- ✅ Health Monitoring: Running
- ✅ Production: https://test.myflynai.com

---

## Monitoring & Maintenance

### Metrics to Track
1. Integration health status (real-time)
2. API response latency
3. Firestore query performance
4. Failed authentication attempts
5. Credential update frequency
6. System error rates

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Real-time updates not showing | Check Firebase security rules, verify listener subscriptions |
| Credentials not saving | Verify encryption, check Firestore quota |
| Health check failing | Test API credentials, check network connectivity |
| Slow responses | Check Firestore indexing, optimize queries |
| Permission denied | Verify founder_admin role, check token expiration |

---

**System Status:** Production Ready ✅  
**Last Updated:** June 13, 2026  
**Real-Time Sync:** Active ✅
