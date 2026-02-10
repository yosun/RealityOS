#!/bin/bash
set -e

# Load credentials
if [ -f ../.agent/.credentials ]; then
    set -a
    source ../.agent/.credentials
    set +a
fi

# Validate credentials
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "Error: AWS credentials not found in ../.agent/.credentials"
    exit 1
fi

echo "Deploying to AWS Region: $AWS_REGION"

# Get Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $ACCOUNT_ID"

# ECR Repo Name
REPO_NAME="reality-os"
ECR_URL="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
IMAGE_URI="$ECR_URL/$REPO_NAME:latest"

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL

# Create Repo if not exists
echo "Ensuring ECR repository exists..."
aws ecr describe-repositories --repository-names $REPO_NAME || aws ecr create-repository --repository-name $REPO_NAME

# Build Docker Image
echo "Building Docker image for linux/amd64..."
docker build --platform linux/amd64 -t $REPO_NAME .

# Tag and Push
echo "Pushing image to ECR..."
docker tag $REPO_NAME:latest $IMAGE_URI
docker push $IMAGE_URI

echo "✅ Image pushed successfully: $IMAGE_URI"
echo "You can now create an App Runner service using this image URI."

# Optional: Create App Runner Service (Simplified)
# aws apprunner create-service ... (Requires standardized config)

echo "Deployment Phase 1 Complete. Check ECR."
