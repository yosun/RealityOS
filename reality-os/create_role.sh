#!/bin/bash
set -e

ROLE_NAME="AppRunnerECRAccessRole"

# Trust policy for App Runner
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "build.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

echo "Checking if role $ROLE_NAME exists..."

if aws iam get-role --role-name $ROLE_NAME >/dev/null 2>&1; then
    echo "Role $ROLE_NAME exists."
else
    echo "Creating role $ROLE_NAME..."
    aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document "$TRUST_POLICY"
fi

echo "Attaching AWSAppRunnerServicePolicyForECRAccess..."
aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess

echo "Role setup complete."
