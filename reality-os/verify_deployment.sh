#!/bin/bash
set -e

DISTRIBUTION_ID="E2CBD72Y2YFIQT"
BUCKET_NAME="realityos"

echo "=== Deployment Status Check ==="

echo "1. S3 Last Modified (Source of Truth):"
S3_TIME=$(aws s3 ls s3://$BUCKET_NAME/index.html | awk '{print $1, $2}')
echo "   index.html: $S3_TIME"

echo ""
echo "2. CloudFront Invalidation Status:"
INVALIDATION_JSON=$(aws cloudfront list-invalidations --distribution-id $DISTRIBUTION_ID --max-items 1)
INVALIDATION_ID=$(echo "$INVALIDATION_JSON" | grep -o '"Id": "[^"]*"' | cut -d'"' -f4)
INVALIDATION_STATUS=$(echo "$INVALIDATION_JSON" | grep -o '"Status": "[^"]*"' | cut -d'"' -f4)
INVALIDATION_TIME=$(echo "$INVALIDATION_JSON" | grep -o '"CreateTime": "[^"]*"' | cut -d'"' -f4)

echo "   Latest Invalidation ID: $INVALIDATION_ID"
echo "   Status: $INVALIDATION_STATUS"
echo "   Created At: $INVALIDATION_TIME"

if [ "$INVALIDATION_STATUS" == "Completed" ]; then
    echo "✅ CloudFront cache is updated."
else
    echo "⚠️  CloudFront invalidation is still in progress."
fi

echo ""
echo "3. Deployed Version Check:"
LIVE_URL="https://d3o8kr3f57bjz6.cloudfront.net"

# Fetch index.html to find the main JS file
echo "   Fetching index.html..."
INDEX_HTML=$(curl -s "$LIVE_URL/")

# Extract the main JS file (assets/index-*.js)
# Pattern: src="/assets/index-[a-zA-Z0-9]*.js"
JS_FILE=$(echo "$INDEX_HTML" | grep -o '/assets/index-[a-zA-Z0-9]*\.js' | head -1)

if [ -z "$JS_FILE" ]; then
    echo "   ❌ Could not find main JS file in index.html"
else
    echo "   Found JS bundle: $JS_FILE"
    
    # Fetch the JS file
    JS_CONTENT=$(curl -s "$LIVE_URL$JS_FILE")
    
    # Extract version string (v0.X.X ...)
    # Pattern: v[0-9]+\.[0-9]+\.[0-9]+[^<]*
    # We look for the pattern "vX.X.X (" basically.
    # In the minified code it might be: params:{children:"v0.4.2 (Source Mode Default)"}
    # Let's try to grep "v[0-9]\+\.[0-9]\+\.[0-9]\+ ([^)]*)"
    
    DEPLOYED_VERSION=$(echo "$JS_CONTENT" | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+ ([^)]*)' | head -1)
    
    if [ -n "$DEPLOYED_VERSION" ]; then
        echo "   🚀 Deployed Version: $DEPLOYED_VERSION"
    else
        echo "   ⚠️  Could not find version string in JS bundle."
    fi
fi
