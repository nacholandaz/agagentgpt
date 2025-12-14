# Quick Start Guide - Get It Working Now

## ✅ What's Already Done

1. ✅ Prisma schema fixed (removed invalid documentation)
2. ✅ Prisma client generated
3. ✅ Dependencies installed

## 🔧 What You Need To Do

### Step 1: Set Up PostgreSQL Database

1. **Make sure PostgreSQL is running:**
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql
   
   # If not running, start it:
   sudo systemctl start postgresql
   ```

2. **Create the database:**
   ```bash
   # Connect to PostgreSQL as postgres user
   sudo -u postgres psql
   
   # In psql, run:
   CREATE DATABASE cocentrica;
   CREATE USER your_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE cocentrica TO your_user;
   \q
   ```

3. **Update your `.env` file** with the correct database URL:
   ```env
   DATABASE_URL=postgresql://your_user:your_password@localhost:5432/cocentrica
   ```

### Step 2: Run Database Migrations

```bash
cd /home/hqadm/AGAgent
npm run prisma:migrate
```

This will create all the necessary tables in your database.

### Step 3: Seed the Database (Create First Core Member)

```bash
# Set environment variables for seeding
export SEED_EMAIL="admin@example.com"
export SEED_HANDLE="admin"
export SEED_NAME="Admin User"
export SEED_PASSWORD="secure-password-here"

# Run seed
npm run prisma:seed
```

**Or** edit `prisma/seed.ts` to set default values, then just run:
```bash
npm run prisma:seed
```

### Step 4: Configure Email (Optional for Testing)

For local testing, you can use MailHog or configure real SMTP:

**Option A: MailHog (Local Testing)**
```bash
# Install MailHog (if not installed)
# Download from: https://github.com/mailhog/MailHog/releases

# Start MailHog
mailhog

# Update .env:
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

**Option B: Real SMTP (Gmail/Google Workspace)**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Step 5: Start the Server

```bash
cd /home/hqadm/AGAgent
npm run dev
```

The server should start on `http://localhost:3000`

### Step 6: Test It Works

1. **Health check:**
   ```bash
   curl http://localhost:3000/health
   ```
   Should return: `{"status":"ok"}`

2. **Test a command (ME):**
   ```bash
   curl -X POST http://localhost:3000/inbound/email \
     -H "Content-Type: application/json" \
     -d '{
       "from": "admin@example.com",
       "subject": "ME",
       "text": "ME"
     }'
   ```
   (Replace `admin@example.com` with the email you used in the seed)

## 🐛 Troubleshooting

### Database Connection Error

**Error:** `Authentication failed against database server`

**Solution:**
1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify DATABASE_URL in `.env` is correct
3. Test connection: `psql $DATABASE_URL`
4. Make sure database exists: `createdb cocentrica` (if needed)

### Migration Errors

**Error:** `Migration failed`

**Solution:**
```bash
# Reset database (WARNING: deletes all data)
npm run db:reset

# Or manually drop and recreate:
psql -c "DROP DATABASE cocentrica;"
psql -c "CREATE DATABASE cocentrica;"
npm run prisma:migrate
```

### Server Won't Start

**Check:**
1. Port 3000 is not in use: `lsof -i :3000`
2. All dependencies installed: `npm install`
3. Prisma client generated: `npm run prisma:generate`
4. Check server logs for specific errors

### Email Not Sending

**For testing without real email:**
- Use MailHog (see Step 4)
- Check server logs - responses are logged even if email fails
- Test with `npm run test:email`

## 📚 Next Steps

Once the server is running:

1. **For local development with email webhooks:**
   - See `src/LOCAL_DEVELOPMENT.md` for ngrok setup
   - See `src/EMAIL_WEBHOOK_SETUP.md` for email service configuration

2. **For testing:**
   - See `TESTING.md` for comprehensive test scenarios
   - Use `npm run test:commands` for command testing
   - Use `npm run test:local` for direct function testing

3. **For production deployment:**
   - See `src/CLOUD_DEPLOYMENT.md` for deployment guides

## 🎯 Quick Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `cocentrica` created
- [ ] `.env` file configured with correct `DATABASE_URL`
- [ ] Migrations run: `npm run prisma:migrate`
- [ ] Database seeded: `npm run prisma:seed`
- [ ] Email configured (optional for testing)
- [ ] Server starts: `npm run dev`
- [ ] Health check works: `curl http://localhost:3000/health`

