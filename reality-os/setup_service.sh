#!/bin/bash
set -e

# Load credentials
if [ -f ../.agent/.credentials ]; then
    set -a
    source ../.agent/.credentials
    set +a
fi

SERVICE_NAME="reality-os-service"
REPO_NAME="reality-os"
REGION=$AWS_REGION
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
IMAGE_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME:latest"

# Check if service exists
SERVICE_ARN=$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" --output text)

if [ -n "$SERVICE_ARN" ]; then
    echo "Service $SERVICE_NAME already exists (ARN: $SERVICE_ARN). Updating configuration..."
    
    aws apprunner update-service \
        --service-arn $SERVICE_ARN \
        --source-configuration "AuthenticationConfiguration={AccessRoleArn=arn:aws:iam::$ACCOUNT_ID:role/AppRunnerECRAccessRole},AutoDeploymentsEnabled=true,ImageRepository={ImageIdentifier=$IMAGE_URI,ImageConfiguration={Port=3000,RuntimeEnvironmentVariables={NODE_ENV=production,PORT=3000,FAL_KEY=$FAL_KEY,AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY,S3_BUCKET_NAME=$S3_BUCKET_NAME}},ImageRepositoryType=ECR}"
        
else
    echo "Creating App Runner Service: $SERVICE_NAME"
    
    aws apprunner create-service \
        --service-name $SERVICE_NAME \
        --source-configuration "AuthenticationConfiguration={AccessRoleArn=arn:aws:iam::$ACCOUNT_ID:role/AppRunnerECRAccessRole},AutoDeploymentsEnabled=true,ImageRepository={ImageIdentifier=$IMAGE_URI,ImageConfiguration={Port=3000,RuntimeEnvironmentVariables={NODE_ENV=production,PORT=3000,FAL_KEY=$FAL_KEY,AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY,S3_BUCKET_NAME=$S3_BUCKET_NAME}},ImageRepositoryType=ECR}" \
        --instance-configuration "Cpu=1024,Memory=2048"

fi
