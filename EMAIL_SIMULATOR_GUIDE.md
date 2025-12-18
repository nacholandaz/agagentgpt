# Email Simulator Guide

The email simulator allows you to test the email system **without sending real emails**. Perfect for rapid development and iteration!

## 🚀 Quick Start

### 1. Enable Simulator Mode

Add to your `.env` file:

```env
EMAIL_SIMULATOR=true
```

### 2. Start the Server

```bash
npm run dev
```

### 3. View Emails in Browser

Open: **http://localhost:3000/simulator**

You'll see a beautiful web interface showing all simulated emails!

## 📧 How It Works

When `EMAIL_SIMULATOR=true`:
- ✅ All emails are stored in memory (not sent)
- ✅ Emails appear instantly in the simulator UI
- ✅ Console logs show email details
- ✅ No SMTP configuration needed
- ✅ Perfect for testing and development

## 🧪 Testing Commands

### Test via HTTP

```bash
# ME command
curl -X POST http://localhost:3000/inbound/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "core@cocentrica.org",
    "subject": "ME",
    "text": "ME"
  }'

# LIST command
curl -X POST http://localhost:3000/inbound/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "core@cocentrica.org",
    "subject": "LIST",
    "text": "LIST"
  }'

# INVITE command
curl -X POST http://localhost:3000/inbound/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "core@cocentrica.org",
    "subject": "INVITE",
    "text": "INVITE\nemail: test@example.com\nhandle: testuser\nname: Test User"
  }'
```

### Test Script

```bash
npm run test:simulator
```

This runs a quick test and shows emails in the console.

## 🎨 Simulator Features

### Web UI (`/simulator`)
- **View all emails** in a beautiful interface
- **Auto-refresh** every 5 seconds
- **Clear all emails** with one click
- **See full email content** including subject, body, recipient, timestamp
- **View requester level** for each email

### API Endpoints

- `GET /simulator/emails` - Get all emails as JSON
- `GET /simulator/emails/:email` - Get emails for specific recipient
- `POST /simulator/clear` - Clear all emails

### Console Output

Every email is also logged to console:

```
📧 [EMAIL SIMULATOR]
To: user@example.com
Subject: Command Response
---
Email body content here
---
```

## 🔄 Switching Between Simulator and Real Email

### Use Simulator (Development)
```env
EMAIL_SIMULATOR=true
```

### Use Real SMTP (Production)
```env
EMAIL_SIMULATOR=false
# Or remove the line entirely
# Make sure SMTP settings are configured
```

## 💡 Tips

1. **Keep simulator open**: Open `http://localhost:3000/simulator` in a browser tab while developing
2. **Auto-refresh**: The UI refreshes every 5 seconds automatically
3. **Clear when needed**: Use "Clear All" to reset between test sessions
4. **Check console**: Emails are also logged to console for quick debugging
5. **Test all commands**: Try ME, LIST, INVITE, PROMOTE, DEMOTE, VOTE

## 🐛 Troubleshooting

### Simulator not showing emails
- Make sure `EMAIL_SIMULATOR=true` is in `.env`
- Restart the server after changing `.env`
- Check server logs for errors

### Emails still being sent
- Verify `EMAIL_SIMULATOR=true` is set
- Restart the server
- Check that `NODE_ENV` is not set to `production` (simulator auto-enables in test mode)

### Simulator UI not loading
- Make sure server is running on port 3000
- Check browser console for errors
- Try accessing `/simulator/emails` (JSON endpoint) to verify API works

## 📊 Example Workflow

1. **Start server with simulator**:
   ```bash
   EMAIL_SIMULATOR=true npm run dev
   ```

2. **Open simulator UI**: http://localhost:3000/simulator

3. **Send test command**:
   ```bash
   curl -X POST http://localhost:3000/inbound/email \
     -H "Content-Type: application/json" \
     -d '{"from": "core@cocentrica.org", "subject": "ME", "text": "ME"}'
   ```

4. **See email appear** in simulator UI instantly!

5. **Iterate and test** without worrying about sending real emails

## 🎯 Benefits

- ⚡ **Fast iteration** - No waiting for SMTP
- 🔒 **Safe testing** - No accidental emails
- 👀 **Visual feedback** - See exactly what emails look like
- 🧹 **Easy cleanup** - Clear all with one click
- 📝 **Full content** - See complete email body
- 🎨 **Beautiful UI** - Easy to read and navigate

Enjoy rapid email development! 🚀

