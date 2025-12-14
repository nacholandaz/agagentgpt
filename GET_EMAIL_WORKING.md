# Get Email Working - Step by Step Guide

This guide will help you get the email system fully working so you can send and receive emails.

## 🎯 What You Need

1. **Database** - To store users and process commands
2. **SMTP (Outgoing)** - To send email responses
3. **Email Webhook (Incoming)** - To receive emails and process commands
4. **ngrok** - To expose your local server to the internet (for webhooks)

---

## Step 1: Set Up Database (Required First)

The email system needs the database to work. Follow these steps:

### 1.1 Create PostgreSQL Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# In psql, run:
CREATE DATABASE cocentrica;
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cocentrica TO your_user;
\q
```

### 1.2 Update `.env` with Database URL

```env
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/cocentrica
```

### 1.3 Run Migrations

```bash
cd /home/hqadm/AGAgent
npm run prisma:migrate
```

### 1.4 Seed First User (Core Member)

```bash
# Set seed variables
export SEED_EMAIL="hq@fronesis.mx"  # Use your actual email
export SEED_HANDLE="admin"
export SEED_NAME="Admin User"
export SEED_PASSWORD="your-secure-password"

# Run seed
npm run prisma:seed
```

**Important**: Use the same email you'll use to send commands!

---

## Step 2: Configure SMTP (Outgoing Email)

You need SMTP to send email responses. You have Gmail configured, but need to set up the app password.

### 2.1 Get Gmail App Password

1. Go to https://myaccount.google.com/apppasswords
2. Sign in with `hq@fronesis.mx`
3. If 2-Step Verification isn't enabled, enable it first
4. Create an App Password:
   - Select "Mail" as the app
   - Select "Other" as the device
   - Name it "Cocéntrica Agent"
5. Copy the 16-character password (looks like: `abcd efgh ijkl mnop`)

### 2.2 Update `.env` with App Password

```env
EMAIL_FROM=hq@fronesis.mx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hq@fronesis.mx
SMTP_PASS=abcdefghijklmnop  # Paste your 16-char app password here (no spaces)
```

### 2.3 Test SMTP Connection

```bash
cd /home/hqadm/AGAgent
npm run test:email
```

You should see: `✅ SMTP server is ready to send emails!`

If you see an error:
- Double-check the app password (no spaces)
- Make sure 2-Step Verification is enabled
- Try using the password without spaces

---

## Step 3: Set Up Email Webhook (Incoming Email)

To receive emails, you need a service that forwards emails to your server. For local development, use **SendGrid** (easiest).

### 3.1 Install and Configure ngrok

```bash
# Install ngrok (if not installed)
# Linux:
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Sign up at https://ngrok.com (free) and get authtoken
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 3.2 Start Your Server

```bash
cd /home/hqadm/AGAgent
npm run dev
```

Keep this running in one terminal.

### 3.3 Start ngrok in Another Terminal

```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

### 3.4 Update `.env` with ngrok URL

```env
BASE_URL=https://abc123.ngrok-free.app
```

**Note**: If you restart ngrok, you'll get a new URL and need to update this.

### 3.5 Set Up SendGrid Inbound Parse

1. **Sign up** at https://sendgrid.com (free tier: 100 emails/day)
2. **Go to**: Settings → Inbound Parse
3. **Click**: "Add Host & URL"
4. **Configure**:
   - **Subdomain**: `mail` (or any name)
   - **Domain**: Use SendGrid's provided domain (e.g., `inbound.sendgrid.net`) OR your own domain
   - **Destination URL**: `https://abc123.ngrok-free.app/inbound/email` (your ngrok URL)
   - **Check**: "POST the raw, full MIME message"
5. **Save**

**For Testing (No DNS Setup)**:
- Use SendGrid's provided domain
- They'll give you an email like: `anything@mail.yourdomain.inbound.sendgrid.net`
- Send emails to this address and they'll be forwarded to your webhook

**For Production (With Your Domain)**:
- Add MX record: `mail.yourdomain.com` → `mx.sendgrid.net` (priority 10)
- Send emails to `commands@mail.yourdomain.com`

---

## Step 4: Test the Full Email Flow

### 4.1 Test Sending Email (SMTP)

```bash
# Start server
npm run dev

# In another terminal, test sending an email via command
curl -X POST http://localhost:3000/inbound/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "hq@fronesis.mx",
    "subject": "ME",
    "text": "ME"
  }'
```

**Check your email inbox** - you should receive a response!

### 4.2 Test Receiving Email (Webhook)

1. **Make sure**:
   - Server is running: `npm run dev`
   - ngrok is running: `ngrok http 3000`
   - SendGrid is configured with your ngrok URL

2. **Send an email** to your SendGrid address (e.g., `test@mail.yourdomain.inbound.sendgrid.net`):
   - **To**: Your SendGrid email address
   - **From**: `hq@fronesis.mx` (the email you seeded)
   - **Subject**: `ME`
   - **Body**: `ME`

3. **Check**:
   - ngrok web interface: http://localhost:4040 (see incoming requests)
   - Server logs (should show the webhook request)
   - Your email inbox (should receive a response)

---

## Step 5: Alternative - Use MailHog for Local Testing

If you don't want to set up SendGrid yet, use MailHog for local email testing:

### 5.1 Install MailHog

```bash
# Download MailHog
wget https://github.com/mailhog/MailHog/releases/download/v1.0.1/MailHog_linux_amd64
chmod +x MailHog_linux_amd64
sudo mv MailHog_linux_amd64 /usr/local/bin/mailhog
```

### 5.2 Start MailHog

```bash
mailhog
```

This starts:
- SMTP server on `localhost:1025`
- Web UI on `http://localhost:8025`

### 5.3 Update `.env` for MailHog

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

### 5.4 Test

```bash
# Send a test command
curl -X POST http://localhost:3000/inbound/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "hq@fronesis.mx",
    "subject": "ME",
    "text": "ME"
  }'

# Check MailHog web UI
# Open http://localhost:8025 in your browser
# You should see the sent email there
```

**Note**: MailHog only works for **sending** emails. For **receiving** emails (webhooks), you still need SendGrid or another service.

---

## 🎯 Quick Checklist

- [ ] Database created and migrations run
- [ ] First user seeded with your email
- [ ] Gmail app password obtained and set in `.env`
- [ ] SMTP test passes: `npm run test:email`
- [ ] Server starts: `npm run dev`
- [ ] ngrok installed and running
- [ ] `BASE_URL` in `.env` set to ngrok URL
- [ ] SendGrid (or other service) configured with webhook URL
- [ ] Test sending email (curl command works)
- [ ] Test receiving email (send email to webhook address)

---

## 🐛 Troubleshooting

### "SMTP connection failed"
- Check app password is correct (no spaces)
- Verify 2-Step Verification is enabled
- Try port 465 with `SMTP_SECURE=true`

### "No sender email found"
- Check email payload format
- Verify `from` field is present in webhook payload

### "User not found"
- Make sure you seeded a user with the email you're using
- Check database: `npm run prisma:studio`

### Webhook not receiving emails
- Check ngrok is running: http://localhost:4040
- Verify SendGrid URL is correct
- Check server logs for errors
- Test webhook with curl first

### Emails not sending
- Test SMTP: `npm run test:email`
- Check server logs for SMTP errors
- Verify `.env` SMTP settings

---

## 📚 Next Steps

Once email is working:

1. **Test all commands**: ME, LIST, INVITE, PROMOTE, DEMOTE, VOTE
2. **Set up production**: See `src/CLOUD_DEPLOYMENT.md`
3. **Configure your domain**: Set up MX records for production
4. **Monitor**: Set up logging and error tracking

---

## 💡 Pro Tips

1. **For local dev**: Use MailHog for sending, SendGrid for receiving
2. **For production**: Use SendGrid or Mailgun for both sending and receiving
3. **Keep ngrok running**: The URL changes each time you restart it
4. **Use ngrok paid plan**: Get a static domain ($8/month) so URL doesn't change
5. **Test with curl first**: Before setting up webhooks, test with curl to verify everything works

