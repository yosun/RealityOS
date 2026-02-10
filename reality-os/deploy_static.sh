#!/bin/bash
set -e

# Load credentials for AWS CLI
if [ -f ../.agent/.credentials ]; then
    set -a
    source ../.agent/.credentials
    set +a
fi

BUCKET_NAME=$S3_BUCKET_NAME

echo "Building React App..."
npm run build

echo "Deploying to S3 Bucket: $BUCKET_NAME"

# Sync dist folder to S3
aws s3 sync dist/ s3://$BUCKET_NAME \
    --delete

# Invalidate CloudFront (Optional but recommended)
# DISTRIBUTION_ID=E2CBD72Y2YFIQT
# aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
echo "⚠️  Don't forget to invalidate CloudFront if needed!"
echo "aws cloudfront create-invalidation --distribution-id E2CBD72Y2YFIQT --paths '/*'"
