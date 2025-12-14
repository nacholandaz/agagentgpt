# Testing Guide

This guide explains how to test the Cocéntrica Core Email Agent system.

## Prerequisites

1. **PostgreSQL running** (local or remote)
2. **Node.js 18+** installed
3. **Dependencies installed**: `npm install`

## Quick Start Testing

### 1. Set Up Environment

```bash
# Copy and edit .env file
cp .env.example .env

# Edit .env with your database URL:
# DATABASE_URL="postgresql://user:password@localhost:5432/cocentrica"
```

### 2. Initialize Database

```bash
# Generate Prisma client
npm run prisma:generate

# Create database schema
npm run prisma:migrate

# Seed first Core member
export SEED_EMAIL="admin@example.com"
export SEED_HANDLE="admin"
export SEED_NAME="Admin User"
export SEED_PASSWORD="admin123"
npm run prisma:seed
```

### 3. Start Server

```bash
npm run dev
```

The server should start on `http://localhost:3000`

## Testing Methods

### Method 1: Direct HTTP Requests (curl)

#### Test Health Check

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok"}`

#### Test ME Command

```bash
curl -X POST http://localhost:3000/inbound/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "admin@example.com",
    "subject": "ME",
    "text": "ME"
  }'
```

Expected: Server processes and sends email response (if SMTP configured)

#### Test LIST Command

```bash
curl -X POST http://localhost:3000/inbound/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "admin@example.com",
    "subject": "LIST",
    "text": "LIST"
  }'
```

#### Test INVITE Command

```bash
curl -X POST http://localhost:3000/inbound/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "admin@example.com",
    "subject": "INVITE",
    "text": "INVITE\nemail: newuser@example.com\nhandle: newuser\nname: New User"
  }'
```

This will create an invite. Check the database or use the token to test acceptance.

### Method 2: Using Test Script

We've created a test script (`test-commands.sh`) that automates testing.

### Method 3: Manual Database Testing

You can also test by directly querying the database:

```bash
# Connect to PostgreSQL
psql -d cocentrica

# Check users
SELECT handle, name, level, email FROM "User";

# Check system mode
SELECT * FROM "SystemConfig" WHERE key = 'system_mode';

# Check invites
SELECT token, email, handle, "isUsed", "expiresAt" FROM "Invite";
```

## Testing Scenarios

### Scenario 1: Bootstrap Flow

1. **Seed creates first Core member** (Level 5)
2. **First Core promotes second Core**:
   ```bash
   curl -X POST http://localhost:3000/inbound/email \
     -H "Content-Type: application/json" \
     -d '{
       "from": "admin@example.com",
       "subject": "INVITE",
       "text": "INVITE\nemail: core2@example.com\nhandle: core2\nname: Core Member 2"
     }'
   ```
   
   After invite is accepted, promote:
   ```bash
   curl -X POST http://localhost:3000/inbound/email \
     -H "Content-Type: application/json" \
     -d '{
       "from": "admin@example.com",
       "subject": "PROMOTE",
       "text": "PROMOTE\nuser: @core2\nto: 5\nreason: Second Core member"
     }'
   ```

3. **Second Core promotes third** (requires 2 votes):
   ```bash
   # First vote (auto from creator)
   curl -X POST http://localhost:3000/inbound/email \
     -H "Content-Type: application/json" \
     -d '{
       "from": "core2@example.com",
       "subject": "PROMOTE",
       "text": "PROMOTE\nuser: @user1\nto: 5\nreason: Third Core member"
     }'
   
   # Second vote (from first Core)
   # Get request ID from database, then:
   curl -X POST http://localhost:3000/inbound/email \
     -H "Content-Type: application/json" \
     -d '{
       "from": "admin@example.com",
       "subject": "VOTE",
       "text": "VOTE\nrequest: <request-id>\nvote: FOR\ncomment: Approved"
     }'
   ```

### Scenario 2: Visibility Testing

1. Create users at different levels
2. Send LIST command from each level
3. Verify users only see their level or lower
4. Verify Level 5 sees emails, others don't

### Scenario 3: Odd Core Rule

1. Get Core count to 3 (odd)
2. Try to promote to Core (should fail - would make it 4, even)
3. Try to demote from Core (should fail - would make it 2, even)
4. Promote two users to Core (should work - makes it 5, odd)

### Scenario 4: Invite Flow

1. Create invite via email command
2. Get token from database or email
3. Visit `/accept?token=<token>` in browser
4. Fill form and submit
5. Verify user created at Level 1

## Testing Without SMTP

If you don't have SMTP configured, you can:

1. **Use MailHog** (local SMTP testing):
   ```bash
   # Install MailHog
   # macOS: brew install mailhog
   # Linux: Download from https://github.com/mailhog/MailHog
   
   # Run MailHog
   mailhog
   
   # Update .env:
   SMTP_HOST=localhost
   SMTP_PORT=1025
   SMTP_SECURE=false
   SMTP_USER=
   SMTP_PASS=
   ```

2. **Check server logs** - responses are logged
3. **Query database** - check for created records
4. **Mock email service** - modify emailService.ts to log instead of send

## Common Issues

### Database Connection Error

```
Error: P1001: Can't reach database server
```

**Solution**: Check DATABASE_URL in .env and ensure PostgreSQL is running.

### Email Not Sending

```
Error: Failed to send email
```

**Solution**: 
- Check SMTP settings in .env
- Use MailHog for local testing
- Check server logs for detailed error

### User Not Found

```
Error: User @handle not found
```

**Solution**: 
- Verify user exists in database
- Check email matches exactly
- Ensure user is active (`isActive = true`)

### Command Not Recognized

```
Unknown command
```

**Solution**: 
- Commands are case-insensitive but must be exact: ME, LIST, INVITE, etc.
- Check email body format (key: value pairs)

## Debugging Tips

1. **Enable Prisma logging**: Already enabled in development mode
2. **Check server logs**: Fastify logs all requests
3. **Database inspection**: Use Prisma Studio:
   ```bash
   npx prisma studio
   ```
4. **Test individual functions**: Create a test file to import and test services directly

## Next Steps

Once basic testing works:
1. Test with real SMTP provider (SendGrid, SES)
2. Set up webhook from email service to `/inbound/email`
3. Test with multiple users at different levels
4. Verify all governance rules work correctly
5. Test edge cases (last Core member, etc.)

