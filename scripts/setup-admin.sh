#!/bin/bash

# Passive Blessings Admin Setup Script
# This script helps initialize the admin dashboard with default site settings

echo "==========================================="
echo "Passive Blessings - Admin Setup"
echo "==========================================="
echo ""
echo "This script will help you:"
echo "1. Initialize site settings in Firestore"
echo "2. Configure API keys (Stripe, SendGrid)"
echo "3. Set up your admin dashboard"
echo ""

# Check if Firebase is configured
if [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo "⚠️  Firebase not configured. Please set FIREBASE_PROJECT_ID environment variable."
    echo "You can configure it in:"
    echo "  - .env.local file"
    echo "  - Vercel project settings"
    echo "  - Environment variables"
    exit 1
fi

echo "✅ Firebase project detected: $FIREBASE_PROJECT_ID"
echo ""

echo "Default Settings:"
echo "- Site Name: Passive Blessings"
echo "- Primary Color: #111111 (Ink Black)"
echo "- Secondary Color: #f7f6f2 (Warm White)"
echo "- Accent Color: #888888 (Warm Grey)"
echo ""

echo "Next Steps:"
echo "1. Go to: http://localhost:3000/admin/settings"
echo "2. Sign in with your admin account"
echo "3. Configure:"
echo "   - Logo (light and dark versions)"
echo "   - Site description"
echo "   - Brand colors"
echo "   - Contact information"
echo "4. Save Stripe API key for payments"
echo "5. Save SendGrid API key for emails"
echo ""

echo "Documentation:"
echo "- Admin Settings: /admin/settings"
echo "- CMS Pages: /admin/pages"
echo "- System Health: /admin/health"
echo ""

echo "Need help? Check the README.md for detailed instructions."
