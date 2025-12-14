# Email Webhook Setup Guide

This guide explains how to configure email services to forward incoming emails to your Cocéntrica server via webhooks.

## Overview

Your server expects webhooks at `POST /inbound/email` with email data. The route supports multiple payload formats from different services.

## Supported Email Services

### 1. SendGrid Inbound Parse (Recommended for Testing)

**Pros**: Easy setup, free tier (100 emails/day), good documentation  
**Cons**: Limited free tier

#### Setup Steps:

1. **Sign up** at https://sendgrid.com
2. **Verify your domain** (or use SendGrid's provided domain for testing)
3. **Go to**: Settings → Inbound Parse
4. **Click**: "Add Host & URL"
5. **Configure**:
   - **Subdomain**: `mail` (or any subdomain)
   - **Domain**: Your domain (e.g., `cocentrica.org`) or use SendGrid's domain
   - **Destination URL**: `https://your-ngrok-url.ngrok-free.app/inbound/email`
   - **Check**: "POST the raw, full MIME message"
6. **Update DNS**:
   - Add MX record: `mail.yourdomain.com` → `mx.sendgrid.net` (priority 10)
   - Or use SendGrid's provided domain for testing (no DNS changes needed)

#### Testing:

Send an email to `anything@mail.yourdomain.com` (or SendGrid's test domain) and it will be forwarded to your webhook.

---

### 2. Mailgun Routes

**Pros**: Generous free tier (5,000 emails/month), reliable  
**Cons**: Requires domain verification

#### Setup Steps:

1. **Sign up** at https://mailgun.com
2. **Add your domain** (or use sandbox domain for testing)
3. **Verify domain** by adding DNS records
4. **Go to**: Receiving → Routes
5. **Create Route**:
   - **Expression Type**: Catch All
   - **Priority**: 0
   - **Actions**: 
     - Forward to: `https://your-ngrok-url.ngrok-free.app/inbound/email`
     - Store: (optional)
6. **Update DNS**:
   - Add MX record: `yourdomain.com` → `mxa.mailgun.org` (priority 10)
   - Add MX record: `yourdomain.com` → `mxb.mailgun.org` (priority 10)

#### Testing:

Send an email to `anything@yourdomain.com` and it will be forwarded to your webhook.

---

### 3. AWS SES + API Gateway + Lambda

**Pros**: Very scalable, pay-as-you-go  
**Cons**: More complex setup, requires AWS account

#### Setup Steps:

1. **Set up SES** to receive emails for your domain
2. **Create Lambda function** that forwards to your webhook
3. **Set up API Gateway** or use SES's SNS integration
4. **Configure SES** to trigger Lambda on incoming emails

This is more complex but very scalable for production.

---

### 4. Postmark Inbound

**Pros**: Simple, developer-friendly  
**Cons**: Paid service (no free tier for inbound)

#### Setup Steps:

1. **Sign up** at https://postmarkapp.com
2. **Add your server** and domain
3. **Configure Inbound**:
   - Set webhook URL: `https://your-ngrok-url.ngrok-free.app/inbound/email`
4. **Update DNS**:
   - Add MX record pointing to Postmark's servers

---

### 5. Cloudflare Email Routing (If using Cloudflare)

**Pros**: Free, easy if already using Cloudflare  
**Cons**: Only works if your domain is on Cloudflare

#### Setup Steps:

1. **In Cloudflare dashboard**:
   - Go to Email → Email Routing
   - Enable Email Routing
2. **Add destination**:
   - Create email address (e.g., `commands@cocentrica.org`)
   - Set action: "Send to HTTP endpoint"
   - URL: `https://your-ngrok-url.ngrok-free.app/inbound/email`
3. **Update DNS**:
   - Cloudflare automatically adds MX records

---

## Webhook Payload Format

Your server accepts multiple payload formats. The route extracts:

- **From email**: `from`, `sender`, `envelope.from`, or `headers.from`
- **Subject**: `subject`
- **Body**: `text`, `body`, `body-plain`, or `body-html` (HTML is stripped)

### Example Payloads:

**SendGrid format**:
```json
{
  "from": "user@example.com",
  "subject": "ME",
  "text": "ME",
  "headers": {
    "from": "user@example.com"
  }
}
```

**Mailgun format**:
```json
{
  "sender": "user@example.com",
  "subject": "ME",
  "body-plain": "ME",
  "envelope": {
    "from": "user@example.com"
  }
}
```

**Generic format**:
```json
{
  "from": "user@example.com",
  "subject": "ME",
  "body": "ME"
}
```

## Testing Webhooks Locally

### Using ngrok:

1. Start your server: `npm run dev`
2. Start ngrok: `ngrok http 3000`
3. Copy the HTTPS URL
4. Configure your email service to use that URL
5. Send a test email

### Using curl:

Test the endpoint directly:

```bash
curl -X POST https://your-ngrok-url.ngrok-free.app/inbound/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "subject": "ME",
    "text": "ME"
  }'
```

### Using ngrok web interface:

Visit http://localhost:4040 while ngrok is running to see all incoming requests and replay them.

## Recommended Setup for Local Development

1. **Use SendGrid** with their provided test domain (no DNS setup needed)
2. **Use ngrok** to expose your local server
3. **Update BASE_URL** in `.env` with your ngrok URL
4. **Configure SendGrid** to forward to your ngrok URL

## Recommended Setup for Production

1. **Use Mailgun** or **AWS SES** (more reliable, better scaling)
2. **Deploy server** to cloud (Railway, Render, Fly.io)
3. **Use your own domain** with proper MX records
4. **Set up monitoring** and error handling

## Troubleshooting

### Webhook not receiving emails

1. **Check ngrok is running**: Visit http://localhost:4040
2. **Verify URL is correct** in email service settings
3. **Check server logs** for incoming requests
4. **Test with curl** to verify endpoint works
5. **Check email service logs** for delivery status

### Emails not being processed

1. **Check server logs** for errors
2. **Verify user exists** in database with that email
3. **Check email format** - ensure `from` field is present
4. **Verify database connection** is working

### DNS issues

1. **Use email service's test domain** for local development
2. **Wait for DNS propagation** (can take up to 48 hours)
3. **Verify MX records** using: `dig MX yourdomain.com`
4. **Check SPF/DKIM records** if emails are being rejected

