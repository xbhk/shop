#!/bin/bash

# BuddyForge Deployment Script for IEMS5718
# Uses SSH config alias "iems5718"

SSH_HOST="iems5718"
SERVER_PATH="/home/ec2-user/buddyforge"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== BuddyForge Deployment ===${NC}"

# Step 1: Build locally
echo -e "${GREEN}[1/4] Building...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

# Step 2: Create deployment package
echo -e "${GREEN}[2/4] Creating package...${NC}"
DEPLOY_DIR="/tmp/buddyforge-deploy-$(date +%s)"
mkdir -p "$DEPLOY_DIR"

cp -r .next "$DEPLOY_DIR/"
cp -r app "$DEPLOY_DIR/"
cp -r components "$DEPLOY_DIR/"
cp -r lib "$DEPLOY_DIR/"
cp -r public "$DEPLOY_DIR/"
cp -r data "$DEPLOY_DIR/"
cp package.json package-lock.json next.config.mjs tsconfig.json tailwind.config.ts postcss.config.js "$DEPLOY_DIR/"

# Step 3: Upload to server
echo -e "${GREEN}[3/4] Uploading to iems5718...${NC}"
ssh "$SSH_HOST" "mkdir -p $SERVER_PATH"
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next/cache' \
    "$DEPLOY_DIR/" "$SSH_HOST:$SERVER_PATH/"

# Step 4: Install dependencies
echo -e "${GREEN}[4/4] Installing dependencies...${NC}"
ssh "$SSH_HOST" "cd $SERVER_PATH && npm install --production"

rm -rf "$DEPLOY_DIR"

echo ""
echo -e "${GREEN}=== Done! ===${NC}"
echo "Start the server:"
echo "  ssh iems5718"
echo "  cd $SERVER_PATH && PORT=3000 npm start"
