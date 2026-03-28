#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTANCE_ID="i-0ab66be8a267328ce"
REGION="ap-southeast-2"
S3_BUCKET="iems5718-deploy-$(date +%s)"
TARBALL="/tmp/shop-deploy-$$.tar.gz"

export AWS_DEFAULT_REGION="$REGION"

echo "=== Step 1: Building locally ==="
cd "$PROJECT_DIR"
npm run build

echo "=== Step 2: Packaging ==="
tar czf "$TARBALL" \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='data/*.db' \
  --exclude='data/*.db-*' \
  --exclude='.DS_Store' \
  --exclude='.env*' \
  --exclude='*.md' \
  --exclude='image.png' \
  --exclude='.next/cache' \
  --exclude='deploy.sh' \
  .
echo "  Package size: $(du -h "$TARBALL" | cut -f1)"

echo "=== Step 3: Creating temp S3 bucket ==="
aws s3 mb "s3://$S3_BUCKET" --region "$REGION" > /dev/null
trap 'echo "=== Cleaning up S3 bucket ===" && aws s3 rb "s3://$S3_BUCKET" --force --region "$REGION" > /dev/null 2>&1' EXIT

echo "=== Step 4: Uploading to S3 ==="
aws s3 cp "$TARBALL" "s3://$S3_BUCKET/deploy.tar.gz" > /dev/null
rm -f "$TARBALL"

PRESIGNED_URL=$(aws s3 presign "s3://$S3_BUCKET/deploy.tar.gz" --expires-in 300 --region "$REGION")

echo "=== Step 5: Deploying to server ==="
CMD_ID=$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters "{\"commands\":[\"cd /home/ec2-user/shop && find . -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} + && curl -sS -o /tmp/deploy.tar.gz '${PRESIGNED_URL}' && tar xzf /tmp/deploy.tar.gz 2>/dev/null && rm /tmp/deploy.tar.gz && find . -name '._*' -delete && chown -R ec2-user:ec2-user /home/ec2-user/shop && echo EXTRACT_OK\"]}" \
  --timeout-seconds 120 \
  --region "$REGION" \
  --query 'Command.CommandId' \
  --output text)

echo "  Waiting for file extraction..."
for i in $(seq 1 30); do
  sleep 5
  STATUS=$(aws ssm get-command-invocation --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" --region "$REGION" --query 'Status' --output text 2>/dev/null)
  if [ "$STATUS" = "Success" ]; then
    echo "  Files extracted successfully"
    break
  elif [ "$STATUS" = "Failed" ] || [ "$STATUS" = "Cancelled" ] || [ "$STATUS" = "TimedOut" ]; then
    echo "  ERROR: Extraction failed with status: $STATUS"
    aws ssm get-command-invocation --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" --region "$REGION" --query 'StandardErrorContent' --output text
    exit 1
  fi
done

echo "=== Step 6: Installing deps & restarting ==="
CMD_ID=$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters '{"commands":["su - ec2-user -c \"source ~/.bashrc && cd /home/ec2-user/shop && npm install --production 2>&1 | tail -3 && pm2 restart shop 2>/dev/null || pm2 start npm --name shop -- start && sleep 3 && pm2 status && echo DEPLOY_OK\""]}' \
  --timeout-seconds 300 \
  --region "$REGION" \
  --query 'Command.CommandId' \
  --output text)

echo "  Waiting for npm install & restart..."
for i in $(seq 1 60); do
  sleep 5
  STATUS=$(aws ssm get-command-invocation --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" --region "$REGION" --query 'Status' --output text 2>/dev/null)
  if [ "$STATUS" = "Success" ]; then
    OUTPUT=$(aws ssm get-command-invocation --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" --region "$REGION" --query 'StandardOutputContent' --output text)
    echo "$OUTPUT" | grep -E "(online|DEPLOY_OK|┌|│|└)" || true
    break
  elif [ "$STATUS" = "Failed" ] || [ "$STATUS" = "Cancelled" ] || [ "$STATUS" = "TimedOut" ]; then
    echo "  ERROR: Deploy failed with status: $STATUS"
    aws ssm get-command-invocation --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" --region "$REGION" --query 'StandardErrorContent' --output text
    exit 1
  fi
done

echo ""
echo "=== Deploy complete! ==="
echo "  http://13.210.106.248/"
