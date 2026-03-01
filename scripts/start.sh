#!/bin/bash

# BuddyForge Server Start Script
# Run this on your AWS server to start the application

APP_DIR="/home/ec2-user/buddyforge"
PORT=3000
LOG_FILE="$APP_DIR/app.log"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$APP_DIR" || exit 1

echo -e "${YELLOW}Starting BuddyForge on port $PORT...${NC}"

# Check if already running
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "Port $PORT is already in use. Stopping existing process..."
    PID=$(lsof -t -i:$PORT)
    kill $PID
    sleep 2
fi

# Start the application
PORT=$PORT nohup npm start > "$LOG_FILE" 2>&1 &

sleep 3

# Check if started
if lsof -i :$PORT > /dev/null 2>&1; then
    echo -e "${GREEN}BuddyForge is running!${NC}"
    echo "Visit http://localhost:$PORT or your domain"
    echo "Logs: tail -f $LOG_FILE"
else
    echo "Failed to start. Check logs:"
    tail -50 "$LOG_FILE"
fi
