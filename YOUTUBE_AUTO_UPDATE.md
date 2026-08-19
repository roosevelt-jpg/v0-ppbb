# Automatic YouTube Video Updates Implementation

## How It Works

The YouTube widget now automatically updates videos from your channel daily at 2 AM UTC. The system includes:

1. **hosting platform Cron Job** - Triggers `/api/youtube/refresh` endpoint daily
2. **API Endpoint** - Securely fetches and caches new videos
3. **Smart Caching** - Videos refresh only if older than 24 hours
4. **Manual Refresh Option** - Admin panel can manually trigger updates anytime

## Setup Instructions

### 1. Set Environment Variables

Add these to your hosting platform project settings:

```
YOUTUBE_REFRESH_TOKEN=your-secret-token-here
CRON_SECRET=your-cron-secret-here
ADMIN_TOKEN=your-admin-token-here
```

Generate secure tokens:
```bash
openssl rand -base64 32
```

### 2. How Videos Update

**Daily Automatic Updates:**
- Runs every day at 2 AM UTC (adjustable in `hosting.json`)
- Fetches latest 4 videos from your YouTube channel
- Updates Firestore automatically
- Homepage reflects changes within seconds

**Manual Updates:**
- Admin can click "Refresh Videos" in admin panel anytime
- Or call the API endpoint with valid admin token

### 3. Cron Schedule Format

The `hosting.json` uses cron syntax:
- `0 2 * * *` = Every day at 2 AM UTC
- `0 */6 * * *` = Every 6 hours
- `30 2 * * 1` = Every Monday at 2:30 AM UTC

### 4. API Endpoints

**Automatic (GET):**
```bash
GET /api/youtube/refresh
Header: x-hosting-cron-secret: {CRON_SECRET}
```

**Manual (POST):**
```bash
POST /api/youtube/refresh
Body: { "adminToken": "{ADMIN_TOKEN}" }
```

### 5. Testing

Test the refresh endpoint locally:
```bash
# With valid token
curl -X GET http://localhost:3000/api/youtube/refresh \
  -H "Authorization: Bearer YOUR_YOUTUBE_REFRESH_TOKEN"
```

## Features

- ✓ Daily automatic updates (24-hour cache)
- ✓ Manual refresh from admin panel
- ✓ Secure with token authentication
- ✓ Error handling and logging
- ✓ hosting platform Cron integration
- ✓ Firebase integration for persistence

## Video Refresh Frequency

- **First load:** Fetches immediately if no videos cached
- **Subsequent loads:** Uses cache for 24 hours
- **Manual refresh:** Available anytime in admin panel
- **Auto refresh:** Runs daily at 2 AM UTC via hosting platform Cron

The homepage will always show the latest 4 videos from your channel!
