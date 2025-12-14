# Cocéntrica Core Email Agent

A production-ready, email-driven governance system for Cocéntrica. This is **not a web app** - it is an **email agent** operating via `core@cocentrica.org`.

## Core Concept

- Users exist at **levels 1–5**
- **Level 5 = Core**
- Core governs itself and activates the rest of the system
- All interaction happens via **email commands**
- Users must **never see or infer levels higher than their own**

## Technology Stack

- Node.js + TypeScript
- Fastify
- PostgreSQL
- Prisma ORM
- Nodemailer (SMTP)
- Zod for validation
- No frontend except a minimal invite-accept page

## Key Rules

### 1. Absolute Secrecy of Higher Levels

A user:
- can only see users with `level <= their level`
- must not see:
  - higher-level users
  - higher-level counts
  - higher-level labels
  - wording that implies higher levels exist
- **Even the existence of higher levels must be hidden**

This is enforced **server-side**, before sending any email.

### 2. Email Visibility

- **Only Level 5 users can see emails**
- Levels 1–4 only see `handle` + `name`

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your database and email settings.

3. Set up the database:

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

4. Seed the first Core member:

```bash
# Set seed environment variables
export SEED_EMAIL="admin@example.com"
export SEED_HANDLE="admin"
export SEED_NAME="Admin User"
export SEED_PASSWORD="secure-password-here"

# Run seed
npm run prisma:seed
```

5. Start the server:

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Email Commands

All commands are sent via email to `core@cocentrica.org` (or your configured email address).

### `ME`

Returns your information:
- handle, name, level
- inviter handle (if any)
- invitee count
- visible user count

**Example:**
```
ME
```

### `LIST`

Returns all visible users (users at your level or lower).

**Example:**
```
LIST
```

### `INVITE`

Creates an invite for a new user.

**Format:**
```
INVITE
email: user@example.com
handle: newuser
name: New User
```

### `PROMOTE`

Creates a promotion request.

**Format:**
```
PROMOTE
user: @handle
to: 3
reason: Excellent contribution
```

### `DEMOTE`

Creates a demotion request.

**Format:**
```
DEMOTE
user: @handle
to: 2
reason: Policy violation
```

### `VOTE`

Vote on a level change request.

**Format:**
```
VOTE
request: <request-id>
vote: FOR
comment: I agree with this change
```

## Testing

### Quick Test

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Test health check**:
   ```bash
   curl http://localhost:3000/health
   ```

3. **Test commands via HTTP** (see `TESTING.md` for full guide):
   ```bash
   # ME command
   curl -X POST http://localhost:3000/inbound/email \
     -H "Content-Type: application/json" \
     -d '{
       "from": "admin@example.com",
       "subject": "ME",
       "text": "ME"
     }'
   ```

4. **Use test scripts**:
   ```bash
   # Test commands via HTTP
   npm run test:commands
   
   # Test functions directly (no HTTP)
   npm run test:local
   ```

### Full Testing Guide

See **[TESTING.md](./TESTING.md)** for comprehensive testing instructions including:
- Step-by-step setup
- All test scenarios
- Bootstrap flow testing
- Visibility testing
- Odd Core rule testing
- Debugging tips

### Test invite acceptance

1. Create an invite via email command:
   ```bash
   curl -X POST http://localhost:3000/inbound/email \
     -H "Content-Type: application/json" \
     -d '{
       "from": "admin@example.com",
       "subject": "INVITE",
       "text": "INVITE\nemail: newuser@example.com\nhandle: newuser\nname: New User"
     }'
   ```

2. Get the token from database or email, then visit:
   ```
   http://localhost:3000/accept?token=YOUR_TOKEN_HERE
   ```

3. Or use Prisma Studio to view invites:
   ```bash
   npm run prisma:studio
   ```

## Email Setup

See **[EMAIL_SETUP.md](./EMAIL_SETUP.md)** for complete email configuration guide.

### Quick Setup

1. **For local testing** (MailHog):
   ```bash
   # Install MailHog
   brew install mailhog  # macOS
   # Or download from https://github.com/mailhog/MailHog
   
   # Start MailHog
   mailhog
   # View emails at http://localhost:8025
   ```

2. **Configure `.env`**:
   ```env
   SMTP_HOST=localhost
   SMTP_PORT=1025
   SMTP_SECURE=false
   ```

3. **Test email configuration**:
   ```bash
   npm run test:email
   ```

### Production Providers

- **SendGrid**: `smtp.sendgrid.net:587` (use `apikey` as username)
- **AWS SES**: `email-smtp.REGION.amazonaws.com:587`
- **Mailgun**: `smtp.mailgun.org:587`
- **Gmail**: `smtp.gmail.com:587` (requires app password, testing only)

See `EMAIL_SETUP.md` for detailed setup instructions for each provider.

## Governance Rules

### Bootstrap Mode

- When Core count = **1**: That user can promote the second Core member (requires 1 vote)
- When Core count = **2**: Either Core member can nominate a third (requires 2 votes)
- When Core count reaches **3**: System switches to `ACTIVE` mode

### Active Mode

- Core size must always be **odd** (3, 5, 7, ...)
- Block any single Level 5 change that would make Core even
- Core changes must happen in **±2 steps** (paired promotions/demotions)

### Influence Rule

A user can:
- create a promotion/demotion request **only if** `creator.level >= target.level`
- vote **only if** `voter.level >= target.level`

**You can only influence your level or lower.**

## Project Structure

```
src/
  server.ts                 # Main server entry point
  config.ts                 # Configuration
  prisma.ts                 # Prisma client
  routes/
    inboundEmail.ts         # POST /inbound/email
    acceptInvite.ts         # GET/POST /accept
  services/
    commands/
      commandParser.ts      # Parse email commands
      commandHandlers.ts    # Handle each command
    governance/
      governanceService.ts  # Bootstrap, odd Core rule, voting
    visibility/
      visibilityService.ts  # Level secrecy enforcement
    email/
      emailService.ts       # Email sending with filtering
    security/
      securityService.ts    # Authentication & authorization
prisma/
  schema.prisma            # Database schema
  seed.ts                  # Seed first Core member
```

## Security Considerations

1. **Never reveal higher levels**: All responses are filtered before sending
2. **Email visibility**: Only Level 5 users see emails in LIST responses
3. **Influence rules**: Strictly enforced server-side
4. **Password hashing**: Uses bcrypt with salt rounds
5. **Input validation**: All inputs are validated and sanitized

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Database migrations
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npm run db:reset
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a secure `JWT_SECRET`
3. Configure proper SMTP credentials
4. Set up PostgreSQL with proper backups
5. Use a reverse proxy (nginx, Caddy) for HTTPS
6. Configure your email service to POST to `/inbound/email`

## License

ISC

