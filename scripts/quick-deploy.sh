#!/bin/bash

# Quick deploy to IEMS5718 AWS server
# Uses SSH config alias "iems5718"

SSH_HOST="iems5718"
SERVER_PATH="/home/ec2-user/buddyforge"

echo "=== Building ==="
npm run build

echo "=== Creating deploy package ==="
DEPLOY_DIR="/tmp/buddyforge-$(date +%s)"
mkdir -p "$DEPLOY_DIR"

# Copy production build and source
cp -r .next "$DEPLOY_DIR/"
cp -r app "$DEPLOY_DIR/"
cp -r components "$DEPLOY_DIR/"
cp -r lib "$DEPLOY_DIR/"
cp -r public "$DEPLOY_DIR/"
cp -r data "$DEPLOY_DIR/"
cp package.json package-lock.json next.config.mjs tsconfig.json tailwind.config.ts postcss.config.js "$DEPLOY_DIR/"

echo "=== Uploading to iems5718 ==="
ssh "$SSH_HOST" "mkdir -p $SERVER_PATH"
scp -r "$DEPLOY_DIR"/* "$SSH_HOST:$SERVER_PATH/"

echo "=== Installing dependencies on server ==="
ssh "$SSH_HOST" "cd $SERVER_PATH && npm install --production"

rm -rf "$DEPLOY_DIR"

echo ""
echo "=== Deploy Complete! ==="
echo "SSH to server and run:"
echo "  ssh iems5718"
echo "  cd $SERVER_PATH"
echo "  PORT=3000 npm start"
