#!/bin/bash

# Test script for Cocéntrica Core Email Agent
# Usage: ./test-commands.sh [admin-email]

BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_EMAIL="${1:-admin@example.com}"

echo "Testing Cocéntrica Core Email Agent"
echo "Base URL: $BASE_URL"
echo "Admin Email: $ADMIN_EMAIL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_command() {
    local name=$1
    local email=$2
    local subject=$3
    local text=$4
    
    echo -e "${YELLOW}Testing: $name${NC}"
    echo "Email: $email"
    echo "Command: $subject"
    echo ""
    
    response=$(curl -s -X POST "$BASE_URL/inbound/email" \
        -H "Content-Type: application/json" \
        -d "{
            \"from\": \"$email\",
            \"subject\": \"$subject\",
            \"text\": \"$text\"
        }")
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Request sent successfully${NC}"
        echo "Response: $response"
    else
        echo -e "${RED}✗ Request failed${NC}"
    fi
    echo ""
    sleep 1
}

# Test health check
echo -e "${YELLOW}=== Health Check ===${NC}"
health=$(curl -s "$BASE_URL/health")
if [ "$health" == '{"status":"ok"}' ]; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server health check failed${NC}"
    echo "Response: $health"
    exit 1
fi
echo ""

# Test 1: ME command
test_command "ME" "$ADMIN_EMAIL" "ME" "ME"

# Test 2: LIST command
test_command "LIST" "$ADMIN_EMAIL" "LIST" "LIST"

# Test 3: INVITE command
test_command "INVITE" "$ADMIN_EMAIL" "INVITE" "INVITE
email: testuser@example.com
handle: testuser
name: Test User"

echo -e "${YELLOW}=== Note ===${NC}"
echo "To test PROMOTE, DEMOTE, and VOTE commands:"
echo "1. First accept the invite (visit /accept?token=<token>)"
echo "2. Then promote the user"
echo "3. Check database for request IDs to vote on"
echo ""
echo "To check database:"
echo "  npx prisma studio"
echo ""

