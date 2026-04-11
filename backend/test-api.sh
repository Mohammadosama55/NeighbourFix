#!/bin/bash

# NeighbourFix Backend Quick Test Script
# This script tests all API endpoints using curl

set -e

BASE_URL="http://localhost:5000"
RESIDENT_EMAIL="john132@test.com"
RESIDENT_PASS="Password123!"
ADMIN_EMAIL="admi31n@municipality.gov"
ADMIN_PASS="AdminPass123!"

echo "🧪 NeighbourFix Backend Testing Script"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Register Resident
echo -e "${YELLOW}[1/8] Registering resident...${NC}"
RESIDENT_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Resident",
    "email": "'$RESIDENT_EMAIL'",
    "password": "'$RESIDENT_PASS'",
    "phone": "9876543210",
    "role": "resident",
    "wardNumber": "10",
    "address": "123 Main Street"
  }')

RESIDENT_TOKEN=$(echo $RESIDENT_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -z "$RESIDENT_TOKEN" ]; then
  echo -e "${RED}❌ Failed to register resident${NC}"
  echo $RESIDENT_RESPONSE
  exit 1
fi
echo -e "${GREEN}✅ Resident registered${NC}"
echo "Token: $RESIDENT_TOKEN"
echo ""

# Step 2: Register Admin
echo -e "${YELLOW}[2/8] Registering admin...${NC}"
ADMIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Officer",
    "email": "'$ADMIN_EMAIL'",
    "password": "'$ADMIN_PASS'",
    "phone": "1234567890",
    "role": "ward_admin",
    "wardNumber": "10",
    "address": "Municipal Office"
  }')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}❌ Failed to register admin${NC}"
  echo $ADMIN_RESPONSE
  exit 1
fi
echo -e "${GREEN}✅ Admin registered${NC}"
echo ""

# Step 3: Login
echo -e "${YELLOW}[3/8] Testing login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$RESIDENT_EMAIL'",
    "password": "'$RESIDENT_PASS'"
  }')

if echo $LOGIN_RESPONSE | grep -q "token"; then
  echo -e "${GREEN}✅ Login successful${NC}"
else
  echo -e "${RED}❌ Login failed${NC}"
  exit 1
fi
echo ""

# Step 4: Get Profile
echo -e "${YELLOW}[4/8] Getting user profile...${NC}"
PROFILE_RESPONSE=$(curl -s -X GET $BASE_URL/api/auth/me \
  -H "Authorization: Bearer $RESIDENT_TOKEN")

if echo $PROFILE_RESPONSE | grep -q "$RESIDENT_EMAIL"; then
  echo -e "${GREEN}✅ Profile retrieved${NC}"
else
  echo -e "${RED}❌ Profile retrieval failed${NC}"
  exit 1
fi
echo ""

# Step 5: Create Complaint
echo -e "${YELLOW}[5/8] Creating complaint...${NC}"
COMPLAINT_RESPONSE=$(curl -s -X POST $BASE_URL/api/complaints \
  -H "Authorization: Bearer $RESIDENT_TOKEN" \
  -F "title=Pothole on Main Street" \
  -F "description=Large dangerous pothole" \
  -F "category=road" \
  -F "wardNumber=10" \
  -F "address=Main Street" \
  -F "location={\"coordinates\":[77.5994,12.9716]}")

COMPLAINT_ID=$(echo $COMPLAINT_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4 | head -1)
if [ -z "$COMPLAINT_ID" ]; then
  echo -e "${RED}❌ Complaint creation failed${NC}"
  echo $COMPLAINT_RESPONSE
  exit 1
fi
echo -e "${GREEN}✅ Complaint created${NC}"
echo "Complaint ID: $COMPLAINT_ID"
echo ""

# Step 6: Get Complaints
echo -e "${YELLOW}[6/8] Getting all complaints...${NC}"
COMPLAINTS=$(curl -s -X GET $BASE_URL/api/complaints)
if echo $COMPLAINTS | grep -q "Pothole"; then
  echo -e "${GREEN}✅ Complaints retrieved${NC}"
else
  echo -e "${RED}❌ Failed to get complaints${NC}"
  exit 1
fi
echo ""

# Step 7: Upvote Complaint
echo -e "${YELLOW}[7/8] Testing upvote...${NC}"
UPVOTE_RESPONSE=$(curl -s -X POST $BASE_URL/api/complaints/$COMPLAINT_ID/upvote \
  -H "Authorization: Bearer $RESIDENT_TOKEN")

if echo $UPVOTE_RESPONSE | grep -q "upvotes"; then
  echo -e "${GREEN}✅ Upvote successful${NC}"
else
  echo -e "${RED}❌ Upvote failed${NC}"
  exit 1
fi
echo ""

# Step 8: Get Heatmap
echo -e "${YELLOW}[8/8] Getting heatmap data...${NC}"
HEATMAP=$(curl -s -X GET $BASE_URL/api/complaints/heatmap)
if echo $HEATMAP | grep -q "heatmap"; then
  echo -e "${GREEN}✅ Heatmap retrieved${NC}"
else
  echo -e "${RED}❌ Heatmap failed${NC}"
  exit 1
fi
echo ""

echo -e "${GREEN}======================================"
echo "✨ All tests passed successfully! ✨"
echo "=====================================${NC}"
echo ""
echo "API is ready for frontend development!"
