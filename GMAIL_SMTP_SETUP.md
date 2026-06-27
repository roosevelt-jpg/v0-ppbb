# Gmail SMTP Integration Setup Guide

## Overview
The Passive Blessings admin system now includes Gmail SMTP integration for sending admin invitations with access codes, roles, and permissions. This guide walks you through setting up Gmail SMTP and using the admin invitation system.

---

## Step 1: Enable 2-Factor Authentication (2FA) on Your Gmail Account

Gmail requires 2FA to generate App Passwords. If you haven't already:

1. Go to [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. In the left navigation, click **Security**
3. Scroll down to **How you sign in to Google**
4. Click **2-Step Verification** and follow the on-screen instructions
5. Once 2FA is enabled, return to the Security page

---

## Step 2: Generate a Gmail App Password

1. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. If prompted to sign in, use your Gmail credentials
3. Under **Select the app and device you want to generate the app password for:**
   - **App**: Select "Mail"
   - **Device**: Select "Windows Computer" (or your device type)
4. Click **Generate**
5. Google will show you a 16-character password (e.g., `abcd efgh ijkl mnop`)
6. Copy this password - **you'll never see it again!**

**Important**: This is NOT your Gmail password. It's a special app password used only for applications like this.

---

## Step 3: Configure Gmail SMTP in the Admin Panel

1. **Login as Super Admin** to your Passive Blessings admin panel
2. Navigate to **Admin > Integrations** (sidebar under "ASSETS" or integration menu)
3. Find **Gmail SMTP** card or search for it
4. Click **Configure** or the Gmail SMTP card
5. Fill in the form:
   - **Gmail Email Address**: Your Gmail account (e.g., `your-email@gmail.com`)
   - **Gmail App Password**: Paste the 16-character password from Step 2
   - **From Name** (optional): Name to appear in emails (e.g., "Passive Blessings Admin")
6. Click **Save Configuration**
7. You should see a success message: "Gmail SMTP configured successfully"

### Verification
To verify the configuration works:
- The system will attempt to verify credentials
- If verification succeeds, you're ready to send invitations
- If it fails, double-check your Gmail email and App Password are correct

---

## Step 4: Using the Admin Invitation System

### How to Invite a New Admin

1. Go to **Admin > Management** (in the admin sidebar under "SECURITY")
2. Click the **Access Codes** tab (should be open by default)
3. Fill in the form:
   - **Admin Name**: Full name of the person (e.g., "Sarah Johnson")
   - **Email Address**: Their email (e.g., `sarah@example.com`)
   - **Role**: Select either:
     - **Admin**: Limited access to specific functions
     - **Super Admin**: Full system access
   - **Permissions** (optional): Check specific permissions or leave empty for full access
     - Manage Members
     - Manage Events
     - Manage Settings
     - Manage Admins
     - View Reports
     - Manage Content
     - Manage Integrations

4. Click **Generate & Send Invitation**
5. The system will:
   - Generate a unique 24-hour access code
   - Send an email to the new admin with:
     - Welcome message
     - Their assigned role
     - List of permissions
     - Access code (formatted for easy copying)
     - Setup link
     - Setup instructions
     - Expiration warning

### Email Template
The invitation email includes:
- **Role Badge**: Shows their role (Admin or Super Admin)
- **Permissions List**: All permissions granted
- **Access Code**: Large, formatted code they'll need during setup
- **Setup Steps**: 4-step walkthrough to complete their account
- **Security Notice**: Reminds them to keep the code private
- **Expiration**: 24-hour countdown

---

## Step 5: New Admin Setup Process

When a new admin receives the invitation email, they should:

1. **Click "Go to Setup"** link in the email or visit `/admin/setup`
2. **Enter Access Code**: Paste the code from the email
3. **Create Account**: Set up their password and confirm email
4. **Complete Profile**: Add any additional information
5. **Access Dashboard**: They're now an admin!

---

## Troubleshooting

### "Email service not configured"
- Go to **Admin > Integrations**
- Verify Gmail SMTP is configured
- Check that both email and app password are saved

### "Failed to send invitation email"
**Possible causes:**
- Gmail App Password is incorrect
- Gmail account doesn't have 2FA enabled
- The Gmail account was recently created (try waiting a few minutes)
- Your email has disabled "Less secure app access"

**Solution:**
1. Verify the Gmail App Password by re-generating it at [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Update the configuration in Admin > Integrations
3. Try sending the invitation again

### "Access code expired"
- Access codes are valid for 24 hours
- Ask the Super Admin to generate a new code
- Send a new invitation to the admin's email

### Email not received
- Check spam/junk folder
- Verify email address is correct
- Check that Gmail SMTP is still configured
- Try sending another test invitation

---

## Security Best Practices

1. **Keep your App Password secret**
   - Never share it with anyone
   - Don't commit it to version control
   - It's encrypted in Firestore

2. **Use access codes properly**
   - Each code can only be used once
   - Codes expire after 24 hours
   - They're shown in the Management page for your records

3. **Monitor admin access**
   - Check the **Active Admins** tab to see who has access
   - Remove admins who no longer need access
   - Audit logs track all admin actions

4. **Rotate app passwords periodically**
   - Generate new App Passwords every 3-6 months
   - Update the configuration in Integrations
   - The old password continues working until replaced

---

## Admin Permissions Reference

### Manage Members
- Add new members to the system
- Edit member profiles and information
- Remove members
- Manage member status and roles

### Manage Events
- Create and publish events
- Edit existing events
- Delete events
- Manage event dates, times, locations
- Upload event materials and images

### Manage Admins
- Invite new admins via access codes
- View list of active admins
- Remove admin access
- Change admin roles and permissions

### Manage Settings
- Update site name and description
- Configure branding (logos, colors)
- Set contact information
- Configure social media links
- Set up Gmail SMTP

### View Reports
- Access analytics dashboard
- Export member reports
- View event attendance
- Generate custom reports

### Manage Content
- Create and edit pages
- Publish content
- Manage FAQs
- Edit footer and navigation
- Manage static content

### Manage Integrations
- Configure third-party services
- Set up payment processors
- Connect email services
- View integration status

---

## FAQs

**Q: Can I use my regular Gmail password instead of an App Password?**
A: No, Gmail App Passwords are required for security. Regular passwords won't work with SMTP.

**Q: How many admins can I invite?**
A: Unlimited! Each admin gets their own access code and account.

**Q: What happens if an admin loses their access code?**
A: Generate a new one through the Management page. Each admin should save their code or setup immediately.

**Q: Can I send bulk invitations?**
A: Currently, invitations are one-at-a-time. For bulk invitations, contact the development team.

**Q: How do I know if an email was sent successfully?**
A: You'll see a success notification in the admin panel. The access code will appear in the "Generated Access Codes" section.

**Q: Can admins change their own permissions?**
A: No, only Super Admins can modify roles and permissions.

**Q: What if I want to change an admin's permissions later?**
A: Contact a Super Admin to update their role and permissions in the Management page.

---

## Contact & Support

For issues or questions:
1. Check this guide first
2. Review the Troubleshooting section
3. Contact your system administrator
4. Report bugs to the development team

---

**Last Updated**: June 27, 2026
**Version**: 1.0
**Status**: Production Ready ✓
