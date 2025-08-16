# Saroj Vandana NGO Website

## 🌟 Overview
Official website for SAROJ VANDANA WOMEN & CHILDREN EMPOWERMENT SOCIETY, a non-profit organization dedicated to empowering women and children through education, skill development, and community support.

## 🚀 Live Website
- **Production**: [https://sarojvandana.com](https://sarojvandana.com)
- **CloudFront CDN**: [https://d1l3p7s5qgis4h.cloudfront.net](https://d1l3p7s5qgis4h.cloudfront.net)

## 🏗️ Architecture

### Frontend
- **Hosting**: AWS S3 + CloudFront CDN
- **SSL**: AWS Certificate Manager
- **DNS**: Route 53
- **Technologies**: HTML5, CSS3, JavaScript (Vanilla)

### Backend
- **API**: AWS API Gateway + Lambda Functions
- **Runtime**: Node.js 18.x
- **Image Storage**: S3
- **Email**: AWS SES (to be configured)

### CI/CD
- **Pipeline**: GitHub Actions
- **Environments**: Staging (develop branch) & Production (main branch)
- **Deployment**: Automatic on push

## 📁 Project Structure
```
├── .github/workflows/   # GitHub Actions CI/CD
├── css/                 # Stylesheets
├── js/                  # JavaScript files
├── lambda-functions/    # AWS Lambda function code
│   ├── contact-form/
│   ├── admin-auth/
│   ├── image-upload/
│   └── image-management/
├── *.html              # HTML pages
└── deployment.md       # Deployment documentation
```

## 🔧 Setup & Development

### Prerequisites
- Node.js 18+
- AWS CLI configured
- GitHub account

### Local Development
```bash
# Install dependencies
npm install

# Run local server (for testing)
npm start

# Deploy to AWS
./deploy-lambda.sh  # Deploy Lambda functions
./setup-api-gateway.sh  # Configure API Gateway
```

### Environment Variables
Create a `.env` file:
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=eu-north-1
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
```

## 🚢 Deployment

### Automatic Deployment
- **Staging**: Push to `develop` branch
- **Production**: Push to `main` branch

### Manual Deployment
```bash
# Deploy to production S3
aws s3 sync . s3://sarojvandana-prod/ --exclude ".*" --exclude "node_modules/*"

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id EPRN3DUQ04QBN --paths "/*"
```

## 📊 Infrastructure Details

### AWS Resources
- **S3 Buckets**: 
  - `sarojvandana-prod` (Production)
  - `sarojvandana-staging` (Staging)
  - `sarojvandana-images` (User uploads)
- **CloudFront Distribution**: EPRN3DUQ04QBN
- **API Gateway**: klbot0zc8l
- **Lambda Functions**: 4 functions for backend logic
- **Route 53 Hosted Zone**: sarojvandana.com

### API Endpoints
```
POST   /contact          # Contact form submission
POST   /admin-login      # Admin authentication
POST   /admin-logout     # Admin logout
GET    /admin-verify     # Verify admin session
GET    /images           # List images
POST   /images           # Upload image
PUT    /images/{key}     # Update image metadata
DELETE /images/{key}     # Delete image
```

## 💰 Cost Optimization
- **Monthly Cost**: ~$1
- **Free Tier Usage**:
  - CloudFront: 1TB/month transfer
  - Lambda: 1M requests/month
  - S3: 5GB storage

## 🔐 Security
- Private S3 buckets with CloudFront OAI
- HTTPS enforced via CloudFront
- API rate limiting
- Session-based admin authentication
- Environment variables for secrets

## 📝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact
- **Organization**: SAROJ VANDANA WOMEN & CHILDREN EMPOWERMENT SOCIETY
- **Email**: sarojvandana2022@gmail.com
- **Website**: [https://sarojvandana.com](https://sarojvandana.com)

## 📄 License
© 2025 SAROJ VANDANA NGO. All rights reserved.

---

**Deployed with ❤️ using AWS Cloud Infrastructure**