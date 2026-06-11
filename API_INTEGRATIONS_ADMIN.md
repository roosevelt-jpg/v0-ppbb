# Admin API Integrations Management System

## Overview

A comprehensive centralized dashboard for managing all external API credentials and integrations. Admins can add, edit, delete, and test API configurations all from one secure interface.

## Features

- **Centralized Dashboard**: `/admin/integrations` - View all integrated APIs at a glance
- **Credential Management**: Add, edit, and delete API keys and secrets securely
- **Health Monitoring**: Real-time health checks for each service
- **Status Tracking**: Active/Inactive status for each integration
- **Secure Storage**: Base64 encryption for sensitive credentials
- **Mask Sensitive Data**: API keys are masked in the UI for security
- **Quick Actions**: Configure, test, and delete integrations with one-click buttons

## File Structure

### Frontend Components
```
components/admin/
├── integration-form.tsx    # Modal form for adding/editing credentials
├── integration-card.tsx    # Card component displaying integration status
```

### Pages
```
app/admin/
├── integrations/
    └── page.tsx            # Main integrations dashboard
```

### API Routes
```
app/api/admin/integrations/
├── route.ts                # GET all configs, POST new config
├── [name]/
│   ├── route.ts           # GET/POST/DELETE individual config
│   └── health/
│       └── route.ts       # Health check endpoint
```

### Utilities
```
lib/
├── api-config.ts          # Core credential management functions
├── types.ts               # ApiConfig and SystemHealth types
```

## Supported Integrations

The system supports configuration for:

1. **Anthropic Claude** - AI chatbot and content generation
2. **OpenAI** - GPT models for AI features
3. **Stripe** - Payment processing
4. **SendGrid** - Email service
5. **YouTube** - Video integration
6. **Google Maps** - Location services
7. **Twilio** - SMS and phone services
8. **PayPal** - Alternative payment gateway

## How to Use

### Adding a New Integration

1. Navigate to `/admin/integrations`
2. Scroll to "Available Integrations"
3. Click "Add" on the desired service
4. Fill in the form with API credentials:
   - API Key (required)
   - API Secret (if applicable)
   - Endpoint (if applicable)
   - Status (Active/Inactive)
5. Click "Save"

### Editing an Integration

1. Go to `/admin/integrations`
2. Find the integration in "Configured Services"
3. Click "Configure"
4. Update the credentials
5. Click "Save"

### Testing Service Health

1. Locate the integration card
2. Click "Check Health"
3. View the health status:
   - **Healthy**: Service is working properly
   - **Degraded**: Service has issues
   - **Down**: Service is unavailable

### Deleting an Integration

1. Click the trash icon on the integration card
2. Confirm deletion
3. Credentials will be removed from the system

## API Endpoints

### List All Integrations
```
GET /api/admin/integrations
Response: { configs: ApiConfig[] }
```

### Get Specific Integration
```
GET /api/admin/integrations/[name]
Response: { config: ApiConfig }
```

### Save Integration Config
```
POST /api/admin/integrations/[name]
Body: { apiKey, apiSecret?, endpoint?, status }
Response: { message, serviceName }
```

### Delete Integration Config
```
DELETE /api/admin/integrations/[name]
Response: { message }
```

### Check Service Health
```
POST /api/admin/integrations/[name]/health
Response: { health: SystemHealth }
```

## Security Features

- **Encryption**: API keys are encrypted with Base64 before storage (upgrade to proper encryption in production)
- **Masking**: Sensitive data is masked when displayed as `***REDACTED***`
- **Authentication**: Admin access required (managed by Firestore security rules)
- **Permissions**: Only users with `manage_integrations` permission can access
- **Audit Trail**: Track changes via Firestore timestamps and admin logs
- **Secure Form**: Password input type for API secrets with show/hide toggle

## Firestore Schema

Integrations are stored in the `apiConfigs` collection:

```typescript
{
  serviceName: string          // e.g., 'stripe', 'sendgrid'
  apiKey: string              // Encrypted
  apiSecret?: string          // Encrypted (optional)
  endpoint?: string           // Custom endpoint if needed
  status: 'active' | 'inactive'
  lastChecked: Date
  isHealthy: boolean
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}
```

## Configuration in Code

After saving credentials in the admin panel, use them in your code:

```typescript
import { getApiConfig } from '@/lib/api-config'

// Retrieve configuration
const stripeConfig = await getApiConfig('stripe')

// Use in your service
const stripe = new Stripe(stripeConfig.apiKey)
```

## Health Check Implementation

Services are checked for health status:

**Stripe**: Attempts to fetch account info
**SendGrid**: Attempts to validate email
**Other Services**: Generic health check (can be extended)

## Adding New Integrations

To add a new integration:

1. Add to `AVAILABLE_INTEGRATIONS` in `/app/admin/integrations/page.tsx`
2. Optionally implement health check logic in `/lib/api-config.ts`
3. Use the integration via `getApiConfig(serviceName)` throughout the app

## Production Considerations

1. Replace Base64 encryption with proper AES-256 encryption
2. Implement IP whitelisting for API keys
3. Add rate limiting to API endpoints
4. Log all credential access attempts
5. Implement secret rotation policies
6. Add 2FA for sensitive operations
7. Use secure vaults (AWS Secrets Manager, HashiCorp Vault)
8. Implement audit logging

## Troubleshooting

**Integration not saving?**
- Check Firestore permissions
- Verify admin has `manage_integrations` permission
- Check console for error messages

**Health check failing?**
- Verify API key is correct
- Check service is online
- Test API key manually

**Credentials not being read?**
- Ensure service name matches exactly
- Check Firestore has data
- Verify decryption is working

## Navigation

The integrations page is accessible from:
- Admin sidebar: Click "Integrations"
- Direct URL: `/admin/integrations`

## Future Enhancements

- Webhook testing
- API key rotation
- Scheduled health checks
- Integration templates
- Bulk import/export
- Rate limiting configuration
- Custom integration support
