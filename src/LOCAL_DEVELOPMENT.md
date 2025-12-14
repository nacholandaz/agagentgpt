# Local Development Setup

This guide will help you run the Cocéntrica email system locally using ngrok to expose your server to the internet for email webhooks.

## Prerequisites

1. **Node.js** installed (v18+ recommended)
2. **PostgreSQL** database running locally or remotely
3. **ngrok** account and CLI installed
4. **Google Workspace** account (hq@fronesis.mx) with App Password

## Step 1: Install ngrok

```bash
# On Linux
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Or download from https://ngrok.com/download
```

Sign up at https://ngrok.com (free tier available) and get your authtoken:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

## Step 2: Configure Environment Variables

Create a `.env` file in `/home/hqadm/` (parent directory):

```env
# Server Configuration
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cocentrica

# Email Configuration - Google Workspace
EMAIL_FROM=hq@fronesis.mx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hq@fronesis.mx
SMTP_PASS=YOUR_APP_PASSWORD_HERE

# Security
JWT_SECRET=change-me-in-production

# Governance
DEFAULT_REQUIRED_VOTES=2
CORE_REQUIRED_VOTES=3
```

**Important**: Replace `YOUR_APP_PASSWORD_HERE` with your Google App Password (see Google Workspace setup below).

## Step 3: Get Google App Password

1. Go to https://myaccount.google.com/apppasswords
2. Sign in with hq@fronesis.mx
3. If 2-Step Verification isn't enabled, enable it first
4. Create an App Password for "Mail"
5. Copy the 16-character password and paste it in your `.env` file

## Step 4: Set Up Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database
npm run prisma:seed
```

## Step 5: Start the Server

In one terminal:

```bash
cd /home/hqadm
npm run dev
```

The server will start on `http://localhost:3000`

## Step 6: Start ngrok Tunnel

In a **second terminal**:

```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

## Step 7: Update BASE_URL

Update your `.env` file with the ngrok URL:

```env
BASE_URL=https://abc123.ngrok-free.app
```

**Note**: If you restart ngrok, you'll get a new URL and need to update this again. Consider using ngrok's paid plan for a static domain.

## Step 8: Configure Email Webhook Service

You need a service to forward emails to your ngrok URL. Choose one:

### Option A: SendGrid Inbound Parse (Recommended)

1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Go to Settings → Inbound Parse
3. Add a new hostname (e.g., `mail.yourdomain.com` or use SendGrid's provided domain)
4. Set POST URL to: `https://abc123.ngrok-free.app/inbound/email`
5. Configure your domain's MX records to point to SendGrid
6. Or use SendGrid's provided domain for testing

### Option B: Mailgun Routes

1. Sign up at https://mailgun.com (free tier: 5,000 emails/month)
2. Add your domain or use Mailgun's sandbox domain
3. Go to Receiving → Routes
4. Create a route that forwards to: `https://abc123.ngrok-free.app/inbound/email`
5. Configure MX records for your domain

### Option C: Cloudflare Email Routing (If you use Cloudflare)

1. In Cloudflare dashboard, go to Email → Email Routing
2. Set up routing rules to forward emails to a webhook
3. Configure the webhook URL: `https://abc123.ngrok-free.app/inbound/email`

## Step 9: Test the Setup

1. Send an email to your configured email address (e.g., `commands@yourdomain.com`)
2. The email service should forward it to your ngrok URL
3. Check your server logs to see if the webhook was received
4. You should receive a response email

## Troubleshooting

### ngrok URL changes every time
- **Free tier**: URLs change on restart. Update `BASE_URL` in `.env` each time
- **Paid tier**: Get a static domain for $8/month

### Webhook not receiving emails
- Check ngrok web interface: http://localhost:4040 (shows all requests)
- Verify the webhook URL is correct in your email service
- Check server logs for errors
- Test the endpoint manually:
  ```bash
  curl -X POST https://abc123.ngrok-free.app/inbound/email \
    -H "Content-Type: application/json" \
    -d '{"from":"test@example.com","subject":"ME","text":"ME"}'
  ```

### Email sending fails
- Verify Google App Password is correct
- Check 2-Step Verification is enabled
- Ensure SMTP settings in `.env` are correct
- Check server logs for SMTP errors

### Database connection issues
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check `DATABASE_URL` in `.env` is correct
- Ensure database exists: `createdb cocentrica`

## Quick Start Script

Use the provided `start-local.sh` script to automate starting both the server and ngrok:

```bash
chmod +x start-local.sh
./start-local.sh
```

This will:
1. Start the server in the background
2. Start ngrok
3. Display the ngrok URL for you to copy

## Next Steps

Once local development is working, see `CLOUD_DEPLOYMENT.md` for production deployment options.

