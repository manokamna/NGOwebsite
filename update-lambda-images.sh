#!/bin/bash

# Script to automatically update Lambda function with new team images
# Run this whenever new images are uploaded to S3

echo "🔍 Scanning S3 for team images..."

# Get list of all files in the team folder
FILES=$(aws s3 ls s3://sarojvandana-images/ngo-images/team/ --region eu-north-1 | awk '{print $4}' | grep -E '\.(jpg|jpeg|png|gif)$')

echo "📁 Found images:"
echo "$FILES"

# Create the JavaScript array format
JS_ARRAY=""
for file in $FILES; do
    if [ -n "$JS_ARRAY" ]; then
        JS_ARRAY="$JS_ARRAY,\n"
    fi
    JS_ARRAY="$JS_ARRAY        '$file'"
done

echo "🔧 Updating Lambda function..."

# Update the Lambda function code
cd lambda-functions/image-upload

# Create backup
cp index.js index.js.backup

# Update the allKnownFiles array in the Lambda function
sed -i '' "/const allKnownFiles = \[/,/\];/{
    /const allKnownFiles = \[/!{
        /\];/!d
    }
}" index.js

# Insert new array
sed -i '' "s/const allKnownFiles = \[.*/const allKnownFiles = [\n$JS_ARRAY\n        \/\/ This list gets updated whenever new images are uploaded\n    ];/" index.js

echo "📦 Deploying to AWS Lambda..."

# Deploy the updated function
zip -r function.zip index.js
aws lambda update-function-code --function-name sarojvandana-image-upload --zip-file fileb://function.zip --region eu-north-1 > /dev/null

echo "✅ Lambda function updated successfully!"
echo "🌐 New images will now appear on the website at: https://sarojvandana.com/about.html"

# Test the API
echo "🧪 Testing API response..."
IMAGE_COUNT=$(curl -s "https://klbot0zc8l.execute-api.eu-north-1.amazonaws.com/prod/images?category=team" | jq '.count')
echo "📊 API now returns $IMAGE_COUNT team images"

cd ../..
echo "🎉 Done!"