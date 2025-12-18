# Email Simulator Troubleshooting

## Quick Fixes

### 1. Simulator Not Working

**Check if EMAIL_SIMULATOR is set:**
```bash
grep EMAIL_SIMULATOR .env
```

**Should show:**
```
EMAIL_SIMULATOR=true
```

**If not set, add to .env:**
```env
EMAIL_SIMULATOR=true
```

**Then restart the server!**

### 2. Simulator UI Not Loading

**Check server is running:**
```bash
curl http://localhost:3000/health
```

**Should return:** `{"status":"ok"}`

**Check simulator route:**
```bash
curl http://localhost:3000/simulator/emails
```

**Should return:** `{"emails":[],"count":0}`

### 3. Emails Still Being Sent (Not Simulated)

**Verify environment variable is loaded:**
```bash
# Check what the server sees
node -e "require('dotenv').config(); console.log('EMAIL_SIMULATOR:', process.env.EMAIL_SIMULATOR)"
```

**Should show:** `EMAIL_SIMULATOR: true`

**If it shows `undefined`, the .env file isn't being loaded. Check:**
- `.env` file exists in project root
- Server is started from project root
- No typos in variable name

### 4. Server Won't Start

**Check for syntax errors:**
```bash
npm run build
```

**Check server logs for errors**

### 5. Simulator Shows No Emails

**Test sending an email:**
```bash
curl -X POST http://localhost:3000/inbound/email \
  -H "Content-Type: application/json" \
  -d '{"from": "core@cocentrica.org", "subject": "ME", "text": "ME"}'
```

**Check console output** - you should see:
```
📧 [EMAIL SIMULATOR]
To: core@cocentrica.org
Subject: Re: ME
---
[email content]
---
```

**Then refresh** http://localhost:3000/simulator

## Common Issues

### Issue: "Cannot find module"
**Solution:** Make sure all files are saved and server is restarted

### Issue: "Route not found"
**Solution:** Check `src/server.ts` includes:
```typescript
await fastify.register(registerEmailSimulatorRoute);
```

### Issue: "Simulator always empty"
**Solution:** 
1. Make sure EMAIL_SIMULATOR=true
2. Restart server
3. Send a test command
4. Check console for simulator logs

## Test Commands

### Test Simulator Directly
```bash
npm run test:simulator
```

### Test via HTTP
```bash
# Start server first, then:
curl -X POST http://localhost:3000/inbound/email \
  -H "Content-Type: application/json" \
  -d '{"from": "core@cocentrica.org", "subject": "ME", "text": "ME"}'
```

### Check Simulator Status
```bash
curl http://localhost:3000/simulator/emails
```

## Still Not Working?

1. **Check server logs** for errors
2. **Verify .env file** has EMAIL_SIMULATOR=true
3. **Restart server** after changing .env
4. **Check browser console** if UI doesn't load
5. **Verify route is registered** in server.ts

## Debug Mode

Add to your test command:
```bash
EMAIL_SIMULATOR=true NODE_ENV=development npm run dev
```

This ensures the simulator is definitely enabled.

