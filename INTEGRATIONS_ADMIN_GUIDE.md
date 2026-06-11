# Admin API Integrations Management - Complete Guide

## System Overview

The Admin API Integrations system provides a centralized, secure interface for managing all external service credentials and integrations in Passive Blessings. Built with enterprise-grade security, comprehensive logging, and real-time health monitoring.

## Security Architecture

### Encryption

- **Algorithm**: AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode)
- **Key Storage**: Environment variable `API_ENCRYPTION_KEY`
- **Each Key Unique**: Every API key is encrypted with random IV (Initialization Vector)
- **No Decryption on Display**: Keys shown as masked (first 4 chars visible, rest hidden)

### Access Control

- **Admin Only**: Only users with `manage_integrations` permission
- **Firestore Security Rules**: Row-level security enforcement
- **Role-Based**: Different permissions for different admin levels
- **Audit Logging**: Every action tracked with timestamp and user info

### Key Validation

Each service has format validation:
- **Stripe**: Must start with `sk_` and be 20+ chars
- **SendGrid**: Must start with `SG.` and be 50+ chars
- **Anthropic**: Must start with `sk-` and be 30+ chars
- **OpenAI**: Must start with `sk-` and be 30+ chars
- **PayPal**: Format validation for Account ID
- **Twilio**: Must start with `AC` and be 30+ chars

## Supported Integrations

### 1. Anthropic Claude
- **Purpose**: AI-powered chatbot, content generation, analysis
- **Setup Time**: 5 minutes
- **Required**: API Key only
- **Test**: Chat with the bot after setup

### 2. OpenAI GPT Models
- **Purpose**: Advanced AI features, text generation, embeddings
- **Setup Time**: 5 minutes
- **Required**: API Key (Secret Key, not Publishable)
- **Test**: Send a test prompt through your app

### 3. Stripe
- **Purpose**: Payment processing, subscriptions, invoicing
- **Setup Time**: 10 minutes
- **Required**: Secret Key (not Publishable Key)
- **Optional**: Webhook Signing Secret
- **Test**: Process a test payment

### 4. SendGrid
- **Purpose**: Email delivery, transactional emails, newsletters
- **Setup Time**: 8 minutes
- **Required**: API Key with Mail Send permission
- **Optional**: Sender email verification
- **Test**: Send a test email

### 5. YouTube
- **Purpose**: Video embedding, channel integration, analytics
- **Setup Time**: 15 minutes
- **Required**: API Key or OAuth credentials
- **Test**: Load a YouTube video in your app

### 6. Google Maps
- **Purpose**: Location services, mapping, geolocation
- **Setup Time**: 10 minutes
- **Required**: API Key (with Maps restrictions)
- **Test**: Display a map on your page

### 7. Twilio
- **Purpose**: SMS messaging, phone calls, communication
- **Setup Time**: 12 minutes
- **Required**: Account SID and Auth Token
- **Test**: Send a test SMS

### 8. PayPal
- **Purpose**: Alternative payment gateway, subscriptions
- **Setup Time**: 10 minutes
- **Required**: Client ID and Client Secret
- **Optional**: Webhook Certificate
- **Test**: Process a test transaction

## How to Use

### Adding a New Integration

1. Navigate to **Admin Panel** → **Integrations**
2. Find the service in "Available Integrations"
3. Click **"Add"** button
4. Enter credentials from the service provider
5. Click **"Save"**
6. Click **"Check Health"** to verify connection
7. Set status to **"Active"** when ready

### Editing Credentials

1. Go to **Admin Panel** → **Integrations**
2. Find service in "Configured Services"
3. Click **"Configure"** button
4. Update fields as needed
5. Click **"Save"**
6. System automatically re-checks health

### Testing Connection

1. Locate integration card
2. Click **"Check Health"** button
3. Wait for health check (typically 2-5 seconds)
4. Results show:
   - **Healthy** (green): Service working perfectly
   - **Degraded** (amber): Service has issues
   - **Down** (red): Service unavailable

### Removing Integration

1. Click **trash icon** on integration card
2. Confirm deletion
3. Credentials immediately removed from system
4. Service becomes unavailable in app

## API Documentation

### Get All Integrations
```bash
GET /api/admin/integrations

Response:
{
  "configs": [
    {
      "serviceName": "stripe",
      "apiKey": "***REDACTED***",
      "status": "active",
      "lastChecked": "2025-06-11T10:30:00Z"
    }
  ]
}
```

### Get Specific Integration
```bash
GET /api/admin/integrations/stripe

Response:
{
  "config": {
    "serviceName": "stripe",
    "apiKey": "***REDACTED***",
    "status": "active"
  }
}
```

### Save Integration
```bash
POST /api/admin/integrations/stripe
Content-Type: application/json

{
  "apiKey": "sk_live_...",
  "apiSecret": "optional_secret",
  "endpoint": "optional_endpoint",
  "status": "active"
}

Response:
{
  "message": "Integration saved successfully",
  "serviceName": "stripe"
}
```

### Delete Integration
```bash
DELETE /api/admin/integrations/stripe

Response:
{
  "message": "Integration deleted successfully"
}
```

### Check Service Health
```bash
POST /api/admin/integrations/stripe/health

Response:
{
  "health": {
    "serviceName": "stripe",
    "status": "healthy",
    "responseTime": 245,
    "lastChecked": "2025-06-11T10:30:00Z"
  }
}
```

## Audit Logging

Every action is logged including:
- Who made the change (admin email)
- What action (create, update, delete, test)
- When it happened (timestamp)
- Result (success or failure)
- Service affected
- Error messages (if any)

### View Audit Trail

1. Go to **Admin Panel** → **Integrations** → **Activity Log**
2. Filter by:
   - **Service**: Filter by integration name
   - **Admin**: Filter by who made changes
   - **Date Range**: Select custom date range
3. Export logs for compliance

## Usage Tracking

The system automatically tracks API usage:
- Total requests per service
- Success vs error rates
- Response time statistics (average, p95)
- Top error endpoints
- Error rate trends

### View Usage Stats

1. Go to **Admin Panel** → **Integrations** → **Usage**
2. Select service from dropdown
3. View last 24 hours by default
4. Select custom time range
5. Export reports

## Monitoring & Alerts

### Health Checks

- Automatic checks every 15 minutes (configurable)
- Manual check available with "Check Health" button
- Alerts when service status changes
- Email notifications for critical failures

### Thresholds

- **Error Rate**: Alert if > 5% in last hour
- **Response Time**: Alert if p95 > 5000ms
- **Service Down**: Immediate critical alert

## Production Checklist

- [ ] Generate secure `API_ENCRYPTION_KEY`
- [ ] Store key in secure vault (AWS Secrets Manager recommended)
- [ ] Configure Firestore security rules
- [ ] Enable audit logging
- [ ] Set up health check monitoring
- [ ] Configure email alerts
- [ ] Test all integrations in production
- [ ] Document team procedures
- [ ] Set up log retention policies
- [ ] Configure backup procedures

## Troubleshooting

### Integration Not Saving

**Problem**: Form won't save changes
**Solution**:
1. Check admin has `manage_integrations` permission
2. Verify API key format is correct
3. Check Firestore has write permissions
4. Check browser console for errors

### Health Check Failing

**Problem**: "Check Health" returns error
**Solution**:
1. Verify API key is active and valid in provider
2. Check service status at provider's status page
3. Verify IP whitelist (if enabled)
4. Check rate limits not exceeded
5. Try deleting and re-adding credential

### Can't Access Integrations Page

**Problem**: 401 Unauthorized or 403 Forbidden
**Solution**:
1. Verify admin is logged in
2. Check user role has admin access
3. Verify Firestore security rules
4. Check user exists in auth system

## Best Practices

1. **Rotate Keys Regularly**: Change API keys every 90 days
2. **Use Service Accounts**: Don't use personal API keys
3. **Monitor Usage**: Check usage stats weekly
4. **Review Audit Logs**: Monthly compliance review
5. **Test After Update**: Always run health check after changes
6. **Document Changes**: Add notes when updating credentials
7. **Use Staging First**: Test in staging before production
8. **Set Up Alerts**: Configure email alerts for errors
9. **Backup Credentials**: Keep secure backup (encrypted)
10. **Principle of Least Privilege**: Give each service only needed permissions

## Advanced Configuration

### Custom Health Checks

To add custom health check for new service:

1. Edit `/lib/api-config.ts`
2. Add case to `checkServiceHealth()` switch
3. Implement service-specific test
4. Return `SystemHealth` object

### Custom Validation

To add format validation for new service:

1. Edit `/lib/encryption.ts`
2. Add case to `validateApiKeyFormat()` switch
3. Add regex or validation logic
4. Test validation

### Webhook Integration

To add webhooks:

1. Get webhook URL from integration page
2. Configure in service provider dashboard
3. Verify signature validation enabled
4. Test with provider's webhook simulator

## Performance Optimization

- Health checks cached for 15 minutes
- Audit logs indexed on serviceName, timestamp
- Usage metrics batched and aggregated
- UI updates only when data changes

## Security Considerations

- Never log full API keys
- Always use HTTPS for API calls
- Rotate encryption keys regularly
- Use IP whitelisting if available
- Enable MFA for admin accounts
- Regularly update dependencies
- Monitor for unusual activity
- Keep audit logs for 90+ days

## Support & Escalation

### Issues with Integration Setup

1. Review documentation for specific service
2. Check service provider's support docs
3. Try recreating credentials
4. Contact service provider support

### System Issues

1. Check system health page
2. Review admin logs for errors
3. Clear browser cache
4. Contact platform support team

## FAQ

**Q: Can I use one API key across multiple environments?**
A: Not recommended. Use separate keys for development, staging, and production.

**Q: What if I forget my API key?**
A: You'll need to generate a new one from the service provider. The old one can't be recovered.

**Q: How often should I rotate keys?**
A: Every 90 days minimum, or immediately if compromised.

**Q: Can I restrict access by IP?**
A: Yes, through individual service providers. Check each service's IP whitelisting options.

**Q: Are credentials backed up?**
A: Automatically in Firestore backups. Never exported in plaintext.

**Q: What if I lose the encryption key?**
A: All credentials become unrecoverable. Set up key backup immediately.

---

**Last Updated**: June 2025 | **Version**: 1.0.0 | **Status**: Production Ready
