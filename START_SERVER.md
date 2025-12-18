# How to Start the Server

## Quick Start

```bash
cd /home/hqadm/AGAgent
npm run dev
```

The server will start on `http://localhost:3000`

## Then Access Simulator

Once server is running, open in browser:
```
http://localhost:3000/simulator
```

## Verify Server is Running

You should see in the terminal:
```
Server listening on http://0.0.0.0:3000
```

## If Server Won't Start

1. **Check database connection** - Make sure PostgreSQL is running
2. **Check .env file** - Make sure DATABASE_URL is correct
3. **Check for errors** - Look at the terminal output

## Quick Test

After starting server, test health endpoint:
```bash
# In another terminal
wget -qO- http://localhost:3000/health
# Should return: {"status":"ok"}
```

