#!/bin/bash

# Local Development Startup Script
# Starts the server and ngrok tunnel

set -e

echo "🚀 Starting Cocéntrica Local Development Environment"
echo ""

# Check if .env exists
if [ ! -f "../.env" ]; then
    echo "❌ Error: .env file not found in parent directory"
    echo "   Please create .env file with your configuration"
    exit 1
fi

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ Error: ngrok is not installed"
    echo "   Install it from: https://ngrok.com/download"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "../node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd ..
    npm install
    cd src
fi

echo "🔧 Starting server in background..."
cd ..
npm run dev > server.log 2>&1 &
SERVER_PID=$!
cd src

# Wait a moment for server to start
sleep 3

# Check if server started successfully
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ Error: Server failed to start. Check server.log for details"
    exit 1
fi

echo "✅ Server started (PID: $SERVER_PID)"
echo ""
echo "🌐 Starting ngrok tunnel..."
echo ""
echo "📋 Copy the HTTPS URL below and update BASE_URL in your .env file"
echo "   (The URL will be shown in the ngrok output)"
echo ""
echo "💡 Tip: Keep this terminal open. Press Ctrl+C to stop both server and ngrok"
echo ""

# Start ngrok
ngrok http 3000

# Cleanup on exit
trap "echo ''; echo '🛑 Stopping server...'; kill $SERVER_PID 2>/dev/null; exit" INT TERM

