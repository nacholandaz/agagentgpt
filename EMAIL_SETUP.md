# Email Setup Guide

This guide explains how to configure email (SMTP) for the Cocéntrica Core Email Agent.

## Quick Setup

### 1. Edit `.env` file

Open your `.env` file and configure the SMTP settings:

```env
EMAIL_FROM="core@cocentrica.org"
SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-username"
SMTP_PASS="your-password"
```

## SMTP Provider Options

### Option 1: SendGrid (Recommended for Production)

1. **Sign up** at [SendGrid](https://sendgrid.com/)
2. **Create API Key**:
   - Go to Settings → API Keys
   - Create API Key with "Mail Send" permissions
3. **Configure `.env`**:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key-here
   ```

### Option 2: AWS SES (Amazon Simple Email Service)

1. **Set up AWS SES**:
   - Verify your domain or email address
   - Create SMTP credentials
2. **Configure `.env`**:
   ```env
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-ses-access-key
   SMTP_PASS=your-ses-secret-key
   ```
   Note: Host varies by region (us-east-1, eu-west-1, etc.)

### Option 3: Gmail (For Testing Only)

⚠️ **Warning**: Gmail has strict limits and is not recommended for production.

1. **Enable App Password**:
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Generate App Password
2. **Configure `.env`**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

### Option 4: Mailgun

1. **Sign up** at [Mailgun](https://www.mailgun.com/)
2. **Get SMTP credentials** from dashboard
3. **Configure `.env`**:
   ```env
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-mailgun-username
   SMTP_PASS=your-mailgun-password
   ```

### Option 5: Local Testing with MailHog

For local development without a real SMTP provider:

1. **Install MailHog**:
   ```bash
   # macOS
   brew install mailhog
   
   # Linux (download binary)
   wget https://github.com/mailhog/MailHog/releases/download/v1.0.1/MailHog_linux_amd64
   chmod +x MailHog_linux_amd64
   sudo mv MailHog_linux_amd64 /usr/local/bin/mailhog
   
   # Or use Docker
   docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
   ```

2. **Start MailHog**:
   ```bash
   mailhog
   ```
   This starts:
   - SMTP server on `localhost:1025`
   - Web UI on `http://localhost:8025`

3. **Configure `.env`**:
   ```env
   SMTP_HOST=localhost
   SMTP_PORT=1025
   SMTP_SECURE=false
   SMTP_USER=
   SMTP_PASS=
   ```

4. **View emails**:
   - Open `http://localhost:8025` in your browser
   - All sent emails will appear here

## Testing Email Configuration

### Method 1: Test via Command

1. **Start your server**:
   ```bash
   npm run dev
   ```

2. **Send a test command** (creates an invite which sends an email):
   ```bash
   curl -X POST http://localhost:3000/inbound/email \
     -H "Content-Type: application/json" \
     -d '{
       "from": "admin@example.com",
       "subject": "INVITE",
       "text": "INVITE\nemail: test@example.com\nhandle: testuser\nname: Test User"
     }'
   ```

3. **Check**:
   - If using MailHog: Open `http://localhost:8025`
   - If using real SMTP: Check the recipient's inbox
   - Check server logs for errors

### Method 2: Test Script

Create a simple test script to verify SMTP connection:

```bash
# Save as test-email.js
node -e "
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP connection failed:', error.message);
  } else {
    console.log('✅ SMTP server is ready to send emails');
  }
});
"
```

Run: `node test-email.js`

## Common Issues

### Issue: "Invalid login" or "Authentication failed"

**Solutions**:
- Double-check username/password
- For Gmail: Use App Password, not regular password
- For SendGrid: Use `apikey` as username, API key as password
- Check if 2FA is enabled (may need app password)

### Issue: "Connection timeout"

**Solutions**:
- Check firewall settings
- Verify SMTP host and port
- Try port 465 with `SMTP_SECURE=true` (SSL/TLS)
- Check if your IP is whitelisted (some providers require this)

### Issue: "Relay access denied"

**Solutions**:
- Verify your email/domain is verified (SES, SendGrid)
- Check sender email matches verified domain
- Some providers require verified sender addresses

### Issue: Emails going to spam

**Solutions**:
- Set up SPF, DKIM, and DMARC records for your domain
- Use a verified domain (not a free email service)
- Warm up your sending domain gradually
- Include proper email headers

## Production Recommendations

1. **Use a dedicated email service** (SendGrid, Mailgun, SES)
2. **Verify your domain** with SPF/DKIM records
3. **Monitor email delivery** and bounce rates
4. **Set up webhooks** for delivery status
5. **Use environment variables** (never commit credentials)
6. **Implement rate limiting** to avoid being flagged as spam

## Webhook Setup (Optional)

To receive inbound emails, configure your email provider to POST to:

```
POST http://your-domain.com/inbound/email
```

### SendGrid Inbound Parse

1. Go to Settings → Inbound Parse
2. Add hostname and URL: `http://your-domain.com/inbound/email`
3. SendGrid will POST emails to this endpoint

### Mailgun Routes

1. Go to Receiving → Routes
2. Create route: `POST /inbound/email`
3. Forward to: `http://your-domain.com/inbound/email`

### AWS SES

1. Set up SES receipt rules
2. Configure SNS to trigger Lambda/HTTP endpoint
3. Forward to: `http://your-domain.com/inbound/email`

## Security Notes

- **Never commit `.env` file** to version control
- **Use environment variables** in production
- **Rotate credentials** regularly
- **Use least privilege** for API keys
- **Monitor for suspicious activity**

## Quick Reference

| Provider | Host | Port | Secure | Notes |
|----------|------|------|--------|-------|
| SendGrid | smtp.sendgrid.net | 587 | false | Use `apikey` as user |
| AWS SES | email-smtp.REGION.amazonaws.com | 587 | false | Region-specific |
| Gmail | smtp.gmail.com | 587 | false | Requires app password |
| Mailgun | smtp.mailgun.org | 587 | false | - |
| MailHog | localhost | 1025 | false | Local testing only |

