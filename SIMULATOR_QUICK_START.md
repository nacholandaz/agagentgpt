# 🚀 Email Simulator - Quick Start

## Enable Simulator

Add to `.env`:
```env
EMAIL_SIMULATOR=true
```

## Start Server

```bash
npm run dev
```

## View Emails

Open in browser: **http://localhost:3000/simulator**

## Test a Command

```bash
curl -X POST http://localhost:3000/inbound/email \
  -H "Content-Type: application/json" \
  -d '{"from": "core@cocentrica.org", "subject": "ME", "text": "ME"}'
```

## That's It! 🎉

The email will appear instantly in the simulator UI.

See `EMAIL_SIMULATOR_GUIDE.md` for full documentation.

