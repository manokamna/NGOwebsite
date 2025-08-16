#!/bin/bash

# Deploy Lambda Functions Script
set -e

echo "🚀 Deploying Lambda Functions..."

# Create IAM role for Lambda if it doesn't exist
ROLE_NAME="sarojvandana-lambda-role"
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text 2>/dev/null || echo "")

if [ -z "$ROLE_ARN" ]; then
    echo "Creating IAM role for Lambda..."
    
    # Create trust policy
    cat > lambda-trust-policy.json <<EOF
{
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
}
EOF

    ROLE_ARN=$(aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file://lambda-trust-policy.json \
        --query 'Role.Arn' \
        --output text)
    
    # Attach policies
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
    
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess
    
    echo "IAM role created: $ROLE_ARN"
    echo "Waiting for role to propagate..."
    sleep 10
fi

# Function to deploy a Lambda function
deploy_function() {
    local FUNCTION_NAME=$1
    local FUNCTION_DIR=$2
    
    echo "Deploying $FUNCTION_NAME..."
    
    cd lambda-functions/$FUNCTION_DIR
    
    # Create deployment package
    zip -r function.zip index.js
    
    # Check if function exists
    if aws lambda get-function --function-name $FUNCTION_NAME --region eu-north-1 2>/dev/null; then
        # Update existing function
        aws lambda update-function-code \
            --function-name $FUNCTION_NAME \
            --zip-file fileb://function.zip \
            --region eu-north-1
    else
        # Create new function
        aws lambda create-function \
            --function-name $FUNCTION_NAME \
            --runtime nodejs18.x \
            --role $ROLE_ARN \
            --handler index.handler \
            --zip-file fileb://function.zip \
            --timeout 30 \
            --memory-size 256 \
            --region eu-north-1 \
            --environment Variables="{ADMIN_USERNAME=admin,ADMIN_PASSWORD=ngo2024}"
    fi
    
    # Clean up
    rm function.zip
    cd ../..
    
    echo "✅ $FUNCTION_NAME deployed successfully"
}

# Deploy all functions
deploy_function "sarojvandana-contact-form" "contact-form"
deploy_function "sarojvandana-admin-auth" "admin-auth"
deploy_function "sarojvandana-image-upload" "image-upload"
deploy_function "sarojvandana-image-management" "image-management"

echo "✅ All Lambda functions deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Set up API Gateway"
echo "2. Configure environment variables"
echo "3. Test the functions"