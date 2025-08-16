#!/bin/bash

# API Gateway Setup Script
set -e

API_ID="klbot0zc8l"
REGION="eu-north-1"
STAGE_NAME="prod"

echo "🚀 Setting up API Gateway endpoints..."

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[0].id' --output text)
echo "Root Resource ID: $ROOT_ID"

# Function to create API endpoint
create_endpoint() {
    local RESOURCE_PATH=$1
    local HTTP_METHOD=$2
    local LAMBDA_FUNCTION=$3
    
    echo "Creating endpoint: $HTTP_METHOD $RESOURCE_PATH -> $LAMBDA_FUNCTION"
    
    # Create resource
    RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --region $REGION \
        --parent-id $ROOT_ID \
        --path-part $RESOURCE_PATH \
        --query 'id' \
        --output text 2>/dev/null || \
        aws apigateway get-resources \
        --rest-api-id $API_ID \
        --region $REGION \
        --query "items[?pathPart=='$RESOURCE_PATH'].id | [0]" \
        --output text)
    
    # Create method
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --region $REGION \
        --resource-id $RESOURCE_ID \
        --http-method $HTTP_METHOD \
        --authorization-type NONE \
        --no-api-key-required 2>/dev/null || true
    
    # Add OPTIONS method for CORS
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --region $REGION \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --authorization-type NONE \
        --no-api-key-required 2>/dev/null || true
    
    # Set up Lambda integration
    LAMBDA_ARN="arn:aws:lambda:$REGION:524664341571:function:$LAMBDA_FUNCTION"
    
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --region $REGION \
        --resource-id $RESOURCE_ID \
        --http-method $HTTP_METHOD \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" 2>/dev/null || true
    
    # Set up OPTIONS integration for CORS
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --region $REGION \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --type MOCK \
        --request-templates '{"application/json":"{\"statusCode\": 200}"}' 2>/dev/null || true
    
    # Set up OPTIONS method response
    aws apigateway put-method-response \
        --rest-api-id $API_ID \
        --region $REGION \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}' 2>/dev/null || true
    
    # Set up OPTIONS integration response
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --region $REGION \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Session-Id'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'GET,POST,PUT,DELETE,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'}' 2>/dev/null || true
    
    # Grant Lambda permission
    aws lambda add-permission \
        --function-name $LAMBDA_FUNCTION \
        --region $REGION \
        --statement-id "apigateway-$RESOURCE_PATH-$HTTP_METHOD" \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:$REGION:524664341571:$API_ID/*/$HTTP_METHOD/$RESOURCE_PATH" 2>/dev/null || true
    
    echo "✅ Endpoint created: $HTTP_METHOD /$RESOURCE_PATH"
}

# Create API endpoints
create_endpoint "contact" "POST" "sarojvandana-contact-form"
create_endpoint "admin-login" "POST" "sarojvandana-admin-auth"
create_endpoint "admin-logout" "POST" "sarojvandana-admin-auth"
create_endpoint "admin-verify" "GET" "sarojvandana-admin-auth"
create_endpoint "images" "POST" "sarojvandana-image-upload"
create_endpoint "images" "GET" "sarojvandana-image-upload"

# Create image management endpoints with path parameter
echo "Creating image management endpoints..."
IMAGES_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[?pathPart=='images'].id | [0]" --output text)

# Create {key+} resource under /images
KEY_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --region $REGION \
    --parent-id $IMAGES_ID \
    --path-part "{key+}" \
    --query 'id' \
    --output text 2>/dev/null || \
    aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query "items[?pathPart=='{key+}'].id | [0]" \
    --output text)

# Add PUT method for image update
aws apigateway put-method \
    --rest-api-id $API_ID \
    --region $REGION \
    --resource-id $KEY_RESOURCE_ID \
    --http-method PUT \
    --authorization-type NONE \
    --request-parameters '{"method.request.path.key":true}' \
    --no-api-key-required 2>/dev/null || true

# Add DELETE method for image deletion
aws apigateway put-method \
    --rest-api-id $API_ID \
    --region $REGION \
    --resource-id $KEY_RESOURCE_ID \
    --http-method DELETE \
    --authorization-type NONE \
    --request-parameters '{"method.request.path.key":true}' \
    --no-api-key-required 2>/dev/null || true

# Set up Lambda integrations for image management
MGMT_LAMBDA_ARN="arn:aws:lambda:$REGION:524664341571:function:sarojvandana-image-management"

for METHOD in PUT DELETE; do
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --region $REGION \
        --resource-id $KEY_RESOURCE_ID \
        --http-method $METHOD \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$MGMT_LAMBDA_ARN/invocations" 2>/dev/null || true
    
    aws lambda add-permission \
        --function-name sarojvandana-image-management \
        --region $REGION \
        --statement-id "apigateway-images-key-$METHOD" \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:$REGION:524664341571:$API_ID/*/$METHOD/images/*" 2>/dev/null || true
done

echo "✅ All endpoints created!"

# Deploy API
echo "Deploying API to $STAGE_NAME stage..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --region $REGION \
    --stage-name $STAGE_NAME \
    --stage-description "Production stage" \
    --description "Initial deployment"

API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE_NAME"
echo ""
echo "✅ API Gateway setup complete!"
echo "API URL: $API_URL"
echo ""
echo "Endpoints:"
echo "  POST   $API_URL/contact"
echo "  POST   $API_URL/admin-login"
echo "  POST   $API_URL/admin-logout"
echo "  GET    $API_URL/admin-verify"
echo "  GET    $API_URL/images"
echo "  POST   $API_URL/images"
echo "  PUT    $API_URL/images/{key}"
echo "  DELETE $API_URL/images/{key}"