# Cocéntrica Email System

Email-driven governance system for Cocéntrica.

## Quick Start

### Local Development (with ngrok)

1. **Set up environment**:
   ```bash
   # Create .env file in parent directory (/home/hqadm/.env)
   # See LOCAL_DEVELOPMENT.md for template
   ```

2. **Install dependencies** (if not already done):
   ```bash
   cd /home/hqadm
   npm install
   ```

3. **Set up database**:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Start development**:
   ```bash
   cd src
   ./start-local.sh
   ```
   
   Or manually:
   ```bash
   # Terminal 1: Start server
   npm run dev
   
   # Terminal 2: Start ngrok
   ngrok http 3000
   ```

5. **Update BASE_URL** in `.env` with your ngrok URL

6. **Configure email webhook** (see EMAIL_WEBHOOK_SETUP.md)

### Production Deployment

See `CLOUD_DEPLOYMENT.md` for detailed deployment guides to:
- Railway
- Render
- Fly.io
- DigitalOcean
- AWS

## Documentation

- **[LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)** - Complete local setup guide
- **[EMAIL_WEBHOOK_SETUP.md](./EMAIL_WEBHOOK_SETUP.md)** - Configure email services for webhooks
- **[CLOUD_DEPLOYMENT.md](./CLOUD_DEPLOYMENT.md)** - Production deployment options

## Configuration

### Environment Variables

Required variables (set in `/home/hqadm/.env`):

```env
# Server
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000  # Update with ngrok URL for local dev

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cocentrica

# Email (Google Workspace: hq@fronesis.mx)
EMAIL_FROM=hq@fronesis.mx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hq@fronesis.mx
SMTP_PASS=<google-app-password>

# Security
JWT_SECRET=<strong-random-secret>

# Governance (optional)
DEFAULT_REQUIRED_VOTES=2
CORE_REQUIRED_VOTES=3
```

## Project Structure

```
src/
├── config.ts              # Configuration
├── server.ts              # Fastify server
├── prisma.ts              # Prisma client
├── routes/
│   ├── inboundEmail.ts    # Email webhook handler
│   └── acceptInvite.ts    # Invite acceptance
└── services/
    ├── email/             # Email sending
    ├── commands/          # Command parsing & handling
    ├── governance/        # Governance rules
    ├── security/          # Authentication
    └── visibility/        # Visibility filtering
```

## Available Commands

- `ME` - Show your profile
- `LIST` - List visible users
- `INVITE <email>` - Invite a user
- `PROMOTE <handle> <level>` - Promote a user (requires votes)
- `DEMOTE <handle> <level>` - Demote a user (requires votes)
- `VOTE <request-id> <yes|no>` - Vote on a governance request

## Testing

```bash
# Test locally
npm run test:local

# Test commands
npm run test:commands

# Test email
npm run test:email
```

## Support

For issues or questions, check the documentation files or review the code comments.

