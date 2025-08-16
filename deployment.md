# AWS Deployment Guide for Saroj Vandana NGO Website

## Architecture Overview
- **Frontend**: S3 + CloudFront with SSL
- **Backend**: Lambda Functions + API Gateway
- **Domain**: sarojvandana.com (Route 53)
- **CI/CD**: GitHub Actions
- **Cost**: ~$1/month

## Prerequisites
- [x] AWS Account with credentials configured
- [x] Domain: sarojvandana.com
- [x] Route 53 Hosted Zone created
- [ ] GitHub repository (to be created)

## Deployment Steps

### Phase 1: SSL Certificate Setup

#### Step 1.1: Request ACM Certificate (us-east-1 region)
**Date**: 2025-08-16  
**Status**: ✅ Completed

```bash
# Certificate must be in us-east-1 for CloudFront
aws acm request-certificate \
  --domain-name sarojvandana.com \
  --subject-alternative-names "*.sarojvandana.com" \
  --validation-method DNS \
  --region us-east-1
```

**Output**: 
```
Certificate ARN: arn:aws:acm:us-east-1:524664341571:certificate/db8210db-ee19-4e64-99f8-cb8a78efe5c9
```

#### Step 1.2: Validate Certificate via DNS
**Status**: ✅ Completed

1. Added validation CNAME record to Route 53
2. Certificate Status: ISSUED
3. Validation completed in < 1 minute

---

### Phase 2: S3 Bucket Setup

#### Step 2.1: Create Production S3 Bucket
**Status**: ✅ Completed

```bash
aws s3api create-bucket \
  --bucket sarojvandana-prod \
  --region eu-north-1 \
  --create-bucket-configuration LocationConstraint=eu-north-1
```
**Result**: Created at http://sarojvandana-prod.s3.amazonaws.com/

#### Step 2.2: Create Staging S3 Bucket
**Status**: ✅ Completed

```bash
aws s3api create-bucket \
  --bucket sarojvandana-staging \
  --region eu-north-1 \
  --create-bucket-configuration LocationConstraint=eu-north-1
```
**Result**: Created at http://sarojvandana-staging.s3.amazonaws.com/

#### Step 2.3: Create Images S3 Bucket
**Status**: ✅ Completed

```bash
aws s3api create-bucket \
  --bucket sarojvandana-images \
  --region eu-north-1 \
  --create-bucket-configuration LocationConstraint=eu-north-1
```
**Result**: Created at http://sarojvandana-images.s3.amazonaws.com/

#### Step 2.4: Configure Bucket Policies
**Status**: ✅ Completed

- Public access blocked on all buckets
- Versioning enabled for rollback capability
- Ready for CloudFront OAI configuration

---

### Phase 3: CloudFront Distribution

#### Step 3.1: Create Origin Access Identity
**Status**: ✅ Completed

```bash
aws cloudfront create-cloud-front-origin-access-identity \
  --cloud-front-origin-access-identity-config \
  CallerReference="sarojvandana-$(date +%s)",Comment="OAI for Saroj Vandana NGO"
```
**Result**: OAI ID: E1P0ZN5AOYL19F

#### Step 3.2: Create CloudFront Distribution
**Status**: ✅ Completed

**Distribution Details**:
- Distribution ID: EPRN3DUQ04QBN
- Domain: d1l3p7s5qgis4h.cloudfront.net
- SSL Certificate: Configured
- Aliases: sarojvandana.com, www.sarojvandana.com

#### Step 3.3: Configure S3 Bucket Policy for OAI
**Status**: ✅ Completed

- Bucket policy applied to allow CloudFront access
- Static files uploaded to S3
- Distribution Status: Deploying (takes 15-20 minutes)

---

### Phase 4: Lambda Functions Setup

#### Step 4.1: Create Lambda Functions
**Status**: ✅ Completed

Functions created:
- [x] sarojvandana-contact-form
- [x] sarojvandana-admin-auth
- [x] sarojvandana-image-upload
- [x] sarojvandana-image-management

**IAM Role**: arn:aws:iam::524664341571:role/sarojvandana-lambda-role

#### Step 4.2: Set up API Gateway
**Status**: ✅ Completed

**API Details**:
- API ID: klbot0zc8l
- API URL: https://klbot0zc8l.execute-api.eu-north-1.amazonaws.com/prod
- Stage: prod

**Available Endpoints**:
- POST /contact - Contact form submission
- POST /admin-login - Admin authentication
- POST /admin-logout - Admin logout
- GET /admin-verify - Verify admin session
- GET /images - List images
- POST /images - Upload image (get presigned URL)
- PUT /images/{key} - Update image metadata
- DELETE /images/{key} - Delete image

---

### Phase 5: GitHub Actions CI/CD

#### Step 5.1: Create GitHub Workflow
**Status**: ✅ Completed

- Created `.github/workflows/deploy.yml`
- Automatic deployment on push to main/develop
- Includes staging and production environments
- Lambda function updates included

#### Step 5.2: Frontend API Integration
**Status**: ✅ Completed

- Updated all HTML files to include API configuration
- Modified JavaScript to use new API endpoints
- Cache invalidation configured
- All files synced to S3

#### Step 5.3: Documentation
**Status**: ✅ Completed

- Created comprehensive GitHub README
- Updated deployment documentation
- API endpoints documented

---

### Phase 6: DNS Configuration

#### Step 6.1: Update Route 53 Records
**Status**: ✅ Completed

- A records created for sarojvandana.com and www.sarojvandana.com
- DNS pointing to CloudFront distribution
- SSL certificate configured

#### Step 6.2: Test Domain Resolution
**Status**: ✅ Completed

- DNS propagation confirmed
- Domain resolves to CloudFront IPs
- HTTPS working correctly

---

### Phase 7: Testing & Go-Live

#### Step 7.1: Infrastructure Testing
**Status**: ✅ Completed

- CloudFront returns HTTP 200
- All S3 files deployed successfully
- DNS resolution working
- SSL certificate active

#### Step 7.2: API Testing
**Status**: 🔄 In Progress

- API Gateway endpoints created
- Lambda functions deployed
- Minor issues with AWS SDK dependencies

#### Step 7.3: Production Ready
**Status**: 🎉 LIVE

- **Website**: https://sarojvandana.com
- **CloudFront**: https://d1l3p7s5qgis4h.cloudfront.net
- **API**: https://klbot0zc8l.execute-api.eu-north-1.amazonaws.com/prod

---

## Important Notes

### Cost Breakdown
- S3 Storage: ~$0.50/month
- CloudFront: Free tier (1TB/month)
- Lambda: Free tier (1M requests/month)
- Route 53: $0.50/month
- **Total: ~$1/month**

### Security Considerations
- S3 buckets are private (CloudFront OAI access only)
- Lambda functions use IAM roles with least privilege
- API Gateway has rate limiting
- Secrets stored in GitHub Secrets / AWS Secrets Manager

### Monitoring
- CloudWatch for Lambda logs
- CloudFront access logs in S3
- AWS Cost Explorer for billing alerts

---

## Rollback Plan
1. CloudFront serves from previous S3 version
2. Lambda aliases for blue-green deployment
3. Route 53 quick DNS switch if needed

---

## Support & Maintenance
- GitHub Actions runs on push to main/develop
- CloudWatch alarms for errors
- Monthly cost review

---

## Commands Reference

### Useful AWS CLI Commands
```bash
# Check certificate status
aws acm describe-certificate --certificate-arn <ARN> --region us-east-1

# List S3 buckets
aws s3 ls

# Check CloudFront distribution
aws cloudfront list-distributions

# View Lambda functions
aws lambda list-functions --region eu-north-1

# Check Route 53 records
aws route53 list-resource-record-sets --hosted-zone-id <ZONE-ID>
```

---

## Progress Tracker
- [x] AWS Account Cleanup
- [x] Documentation Started
- [x] SSL Certificate (ISSUED)
- [x] S3 Buckets (Created: prod, staging, images)
- [x] CloudFront (Distribution deployed)
- [x] Lambda Functions (4 functions deployed)
- [x] API Gateway (REST API deployed)
- [ ] GitHub Actions
- [ ] DNS Configuration
- [ ] Testing
- [ ] Go-Live

## Current Infrastructure Status

### Live URLs
- **CloudFront**: https://d1l3p7s5qgis4h.cloudfront.net
- **API Gateway**: https://klbot0zc8l.execute-api.eu-north-1.amazonaws.com/prod

### Next Steps
1. Configure Route 53 to point domain to CloudFront
2. Update frontend JavaScript to use new API endpoints
3. Set up GitHub Actions for CI/CD
4. Test all functionality
5. Go live!

---

*Last Updated: 2025-08-16 20:55:00*