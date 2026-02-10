#!/bin/bash
set -e

# Load credentials
if [ -f ../.agent/.credentials ]; then
    set -a
    source ../.agent/.credentials
    set +a
fi

FUNCTION_NAME="reality-os-proxy"
ROLE_NAME="RealityOSLambdaRole"
ZIP_FILE="function.zip"

echo "Creating IAM Role..."
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

if ! aws iam get-role --role-name $ROLE_NAME >/dev/null 2>&1; then
    aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document "$TRUST_POLICY"
    echo "Role created. Waiting for propagation..."
    sleep 10
fi

# Attach policies
aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess 
# Note: S3FullAccess is broad, ideally scope to bucket.

echo "Zipping function..."
cd lambda
zip -r ../$ZIP_FILE index.mjs
cd ..

ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)

echo "Deploying Lambda Function..."
if aws lambda get-function --function-name $FUNCTION_NAME >/dev/null 2>&1; then
    aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file fileb://$ZIP_FILE
    echo "Waiting for code update..."
    sleep 5
    aws lambda update-function-configuration --function-name $FUNCTION_NAME --timeout 60 --environment "Variables={GEMINI_KEY=$GEMINI_KEY,FAL_KEY=$FAL_KEY,S3_BUCKET_NAME=$S3_BUCKET_NAME,PROXY_SECRET=055a161ab28156a33cfbe7bdf3d188cefe221300e78643a527d6bcc6c49ee845}"
else
    # Sleep to ensure role is ready
    sleep 5
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime nodejs20.x \
        --role $ROLE_ARN \
        --handler index.handler \
        --zip-file fileb://$ZIP_FILE \
        --environment "Variables={FAL_KEY=$FAL_KEY,S3_BUCKET_NAME=$S3_BUCKET_NAME}"
fi

echo "Configuring Function URL..."
aws lambda update-function-url-config \
    --function-name $FUNCTION_NAME \
    --auth-type NONE \
    --cors "AllowOrigins=['*'],AllowMethods=['*'],AllowHeaders=['*']"

# Remove old permission if exists (ignore error)
aws lambda remove-permission --function-name $FUNCTION_NAME --statement-id FunctionURLAllowPublicAccess || true

# Add public permission
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --action lambda:InvokeFunctionUrl \
    --statement-id FunctionURLAllowPublicAccess \
    --principal "*" \
    --function-url-auth-type NONE

FUNC_URL=$(aws lambda get-function-url-config --function-name $FUNCTION_NAME --query 'FunctionUrl' --output text)
echo "✅ Lambda Deployed: $FUNC_URL"

# Cleanup
rm $ZIP_FILE
