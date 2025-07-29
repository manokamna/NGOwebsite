#!/bin/bash

# NGO Website Deployment Script for AWS Elastic Beanstalk

echo "🚀 Starting deployment to AWS Elastic Beanstalk..."

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo "❌ EB CLI is not installed. Please install it first:"
    echo "pip install awsebcli"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first"
    exit 1
fi

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    echo "📝 Creating .gitignore file..."
    cat > .gitignore << EOF
node_modules/
.env
.DS_Store
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.elasticbeanstalk/*
!.elasticbeanstalk/*.cfg.yml
!.elasticbeanstalk/*.global.yml
EOF
fi

# Ensure .env is not committed
if ! grep -q "^\.env$" .gitignore; then
    echo ".env" >> .gitignore
fi

echo "📦 Installing dependencies..."
npm install --production

# Initialize Elastic Beanstalk application if not already done
if [ ! -f .elasticbeanstalk/config.yml ]; then
    echo "🏗️  Initializing Elastic Beanstalk application..."
    eb init ngo-website --platform "Node.js 18 running on 64bit Amazon Linux 2" --region eu-north-1
fi

# Check if environment exists
if ! eb list | grep -q "ngo-website-env"; then
    echo "🌍 Creating new environment..."
    eb create ngo-website-env --instance-type t3.micro --cname ngo-website-app
    
    echo "🔧 Setting environment variables..."
    eb setenv \
        AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
        AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
        AWS_REGION=$AWS_REGION \
        S3_BUCKET_NAME=$S3_BUCKET_NAME \
        ADMIN_USERNAME=$ADMIN_USERNAME \
        ADMIN_PASSWORD=$ADMIN_PASSWORD \
        NODE_ENV=production \
        SESSION_SECRET=$SESSION_SECRET
else
    echo "🔄 Environment exists, deploying updates..."
    eb deploy ngo-website-env
fi

echo "✅ Deployment completed!"
echo "🌐 Your application should be available at the Elastic Beanstalk URL"
echo "📊 Check status with: eb status"
echo "📋 View logs with: eb logs"
echo "🔧 Open EB console with: eb console"