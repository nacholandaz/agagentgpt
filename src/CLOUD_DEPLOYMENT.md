# Cloud Deployment Guide

This guide covers deploying Cocéntrica to various cloud platforms for production use.

## Overview

For production, you'll want to:
1. Deploy the server to a cloud platform
2. Set up a proper domain with SSL
3. Configure email webhooks to your production URL
4. Set up database (managed PostgreSQL)
5. Configure environment variables

## Platform Options

### 1. Railway (Recommended - Easiest)

**Pros**: Very easy setup, automatic deployments, PostgreSQL included  
**Cons**: Can be expensive at scale

#### Setup Steps:

1. **Sign up** at https://railway.app
2. **Create new project**
3. **Add PostgreSQL** service (Railway provides this)
4. **Add Node.js** service:
   - Connect your GitHub repo, OR
   - Deploy from local directory
5. **Configure environment variables**:
   ```
   DATABASE_URL=<railway-postgres-url>
   PORT=3000
   NODE_ENV=production
   BASE_URL=https://your-app.railway.app
   EMAIL_FROM=core@cocentrica.org
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=core@cocentrica.org
   SMTP_PASS=<your-app-password>
   JWT_SECRET=<generate-strong-secret>
   ```
6. **Set build command**: `npm run build`
7. **Set start command**: `npm start`
8. **Deploy!**

Railway will automatically:
- Build your app
- Run migrations (add `prisma migrate deploy` to build)
- Provide HTTPS URL
- Handle restarts

#### Custom Domain:

1. Go to your service → Settings → Domains
2. Add your custom domain
3. Update DNS records as shown
4. Update `BASE_URL` in environment variables

---

### 2. Render

**Pros**: Free tier available, easy setup  
**Cons**: Free tier spins down after inactivity

#### Setup Steps:

1. **Sign up** at https://render.com
2. **Create new Web Service**
3. **Connect GitHub repo** or deploy from local
4. **Configure**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. **Add PostgreSQL** database (separate service)
6. **Set environment variables** (same as Railway)
7. **Deploy**

#### Custom Domain:

1. Go to service → Settings → Custom Domains
2. Add your domain
3. Update DNS records
4. Update `BASE_URL`

---

### 3. Fly.io

**Pros**: Global edge deployment, good performance  
**Cons**: More configuration needed

#### Setup Steps:

1. **Install flyctl**: `curl -L https://fly.io/install.sh | sh`
2. **Sign up**: `fly auth signup`
3. **Create app**: `fly launch`
4. **Create Dockerfile** (see below)
5. **Set secrets**:
   ```bash
   fly secrets set DATABASE_URL=...
   fly secrets set EMAIL_FROM=hq@fronesis.mx
   fly secrets set SMTP_USER=hq@fronesis.mx
   fly secrets set SMTP_PASS=...
   fly secrets set JWT_SECRET=...
   fly secrets set BASE_URL=https://your-app.fly.dev
   ```
6. **Deploy**: `fly deploy`

#### Dockerfile for Fly.io:

Create `Dockerfile` in project root:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

---

### 4. DigitalOcean App Platform

**Pros**: Simple, good pricing  
**Cons**: Less feature-rich than others

#### Setup Steps:

1. **Sign up** at https://digitalocean.com
2. **Create App** → GitHub repo
3. **Configure**:
   - Build: `npm run build`
   - Run: `npm start`
4. **Add Database** (Managed PostgreSQL)
5. **Set environment variables**
6. **Deploy**

---

### 5. AWS (EC2/ECS/Lambda)

**Pros**: Most scalable, full control  
**Cons**: Complex setup, requires AWS knowledge

#### Options:

- **EC2**: Traditional server (use with PM2)
- **ECS**: Container orchestration
- **Lambda**: Serverless (requires adaptation)
- **Elastic Beanstalk**: Easier AWS deployment

See AWS documentation for detailed setup.

---

## Database Setup

### Managed PostgreSQL Options:

1. **Railway PostgreSQL** (easiest, included)
2. **Render PostgreSQL** (free tier available)
3. **Supabase** (free tier, PostgreSQL)
4. **Neon** (serverless PostgreSQL, free tier)
5. **AWS RDS** (scalable, pay-as-you-go)
6. **DigitalOcean Managed Database**

### Migration Strategy:

1. **Development**: Run migrations manually
2. **Production**: Add to build process:

```json
// package.json
{
  "scripts": {
    "build": "tsc && prisma generate",
    "postbuild": "prisma migrate deploy",
    "start": "node dist/server.js"
  }
}
```

Or use Railway's post-deploy hook, Render's build command, etc.

---

## Environment Variables Checklist

Required for production:

```env
# Server
PORT=3000
NODE_ENV=production
BASE_URL=https://your-production-url.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Email (Google Workspace)
EMAIL_FROM=hq@fronesis.mx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hq@fronesis.mx
SMTP_PASS=<app-password>

# Security
JWT_SECRET=<generate-strong-random-secret>

# Governance (optional, defaults provided)
DEFAULT_REQUIRED_VOTES=2
CORE_REQUIRED_VOTES=3
```

### Generate Strong JWT Secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Post-Deployment Checklist

- [ ] Server is running and accessible
- [ ] Database migrations completed
- [ ] Environment variables set correctly
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (HTTPS)
- [ ] Email webhook service configured to production URL
- [ ] Test sending an email command
- [ ] Test receiving email responses
- [ ] Monitor logs for errors
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure backups for database
- [ ] Set up health check monitoring

---

## Email Webhook Configuration

After deployment, update your email service (SendGrid, Mailgun, etc.) to point to your production URL:

```
https://your-production-url.com/inbound/email
```

See `EMAIL_WEBHOOK_SETUP.md` for detailed webhook configuration.

---

## Monitoring & Maintenance

### Health Checks:

Your server has a health endpoint: `GET /health`

Set up monitoring to ping this endpoint:
- **UptimeRobot** (free)
- **Pingdom**
- **StatusCake**

### Logs:

- **Railway**: Built-in log viewer
- **Render**: Built-in log viewer
- **Fly.io**: `fly logs`
- **AWS**: CloudWatch

### Error Tracking:

Consider adding:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Datadog** for full observability

---

## Scaling Considerations

1. **Database**: Use connection pooling (Prisma does this automatically)
2. **Server**: Most platforms auto-scale, but monitor usage
3. **Email**: Google Workspace has rate limits (2,000/day for free)
4. **Webhooks**: Ensure your endpoint can handle concurrent requests

---

## Cost Estimates

- **Railway**: ~$5-20/month (includes database)
- **Render**: Free tier or ~$7/month + database
- **Fly.io**: ~$5-15/month
- **DigitalOcean**: ~$5-12/month + database
- **AWS**: Pay-as-you-go, can be very cheap or expensive

---

## Recommended Production Stack

1. **Hosting**: Railway or Render (easiest)
2. **Database**: Managed PostgreSQL (included or separate)
3. **Email Webhooks**: Mailgun or SendGrid
4. **Monitoring**: UptimeRobot + Sentry
5. **Domain**: Your existing domain (fronesis.mx)

---

## Migration from Local to Production

1. **Export local database** (if you have test data):
   ```bash
   pg_dump cocentrica > backup.sql
   ```

2. **Deploy to cloud**

3. **Run migrations**:
   ```bash
   prisma migrate deploy
   ```

4. **Import data** (if needed):
   ```bash
   psql $DATABASE_URL < backup.sql
   ```

5. **Update email webhook** URL to production

6. **Test thoroughly** before going live

---

## Troubleshooting

### Build fails

- Check Node.js version (should be 18+)
- Verify all dependencies in package.json
- Check build logs for specific errors

### Database connection fails

- Verify DATABASE_URL is correct
- Check database is accessible from cloud platform
- Verify firewall rules allow connections

### Emails not working

- Verify SMTP credentials are correct
- Check Google App Password hasn't expired
- Verify BASE_URL is set to production URL
- Check email service webhook URL is updated

### App crashes on startup

- Check all required environment variables are set
- Verify database migrations have run
- Check logs for specific error messages

