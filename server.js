const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const compression = require('compression');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable gzip compression
app.use(compression());

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:", "https:", "*.s3.amazonaws.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? [
        'https://sarojvandana.com',
        'https://www.sarojvandana.com',
        'http://sarojvandana.com',
        'http://www.sarojvandana.com',
        'ngo-website-app.eu-north-1.elasticbeanstalk.com'
    ] : true,
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files with caching
app.use(express.static(path.join(__dirname), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true,
    lastModified: true
}));

// Configure AWS S3
console.log('=== AWS Configuration ===');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set (' + process.env.AWS_ACCESS_KEY_ID.substring(0, 10) + '...)' : 'Not set');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set (length: ' + process.env.AWS_SECRET_ACCESS_KEY.length + ')' : 'Not set');
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME);

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'eu-north-1',
    httpOptions: {
        timeout: 10000, // 10 second timeout
        connectTimeout: 5000 // 5 second connection timeout
    }
});

const s3 = new AWS.S3({
    httpOptions: {
        timeout: 10000,
        connectTimeout: 5000
    }
});
const bucketName = process.env.S3_BUCKET_NAME || 'sarojvandana';

console.log('AWS SDK Version:', AWS.VERSION);
console.log('S3 Service Endpoint:', s3.endpoint.href);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Simple session management (replace with proper session store in production)
const sessions = new Map();

// Authentication middleware
const authenticate = (req, res, next) => {
    const sessionId = req.headers['x-session-id'];
    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = sessions.get(sessionId);
    next();
};

// Generate session ID
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// API Routes

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ngo2024';
    
    if (username === adminUsername && password === adminPassword) {
        const sessionId = generateSessionId();
        sessions.set(sessionId, { username, loginTime: new Date() });
        
        // Clean up old sessions (simple cleanup)
        const oneHour = 60 * 60 * 1000;
        for (const [id, session] of sessions) {
            if (Date.now() - session.loginTime > oneHour) {
                sessions.delete(id);
            }
        }
        
        res.json({ success: true, sessionId });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Admin logout
app.post('/api/admin/logout', authenticate, (req, res) => {
    const sessionId = req.headers['x-session-id'];
    sessions.delete(sessionId);
    res.json({ success: true });
});

// Test S3 connection (temporary - no auth for debugging)
app.get('/api/s3/test-debug', async (req, res) => {
    try {
        console.log('=== DEBUG: Testing S3 connection without auth ===');
        const result = await s3.headBucket({ Bucket: bucketName }).promise();
        console.log('S3 headBucket successful:', result);
        res.json({ success: true, message: 'S3 connection working!' });
    } catch (error) {
        console.error('=== DEBUG: S3 Error Details ===');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error statusCode:', error.statusCode);
        console.error('Full error:', error);
        res.status(500).json({ error: error.code, message: error.message });
    }
});

// Test S3 connection
app.get('/api/s3/test', authenticate, async (req, res) => {
    try {
        console.log('Testing S3 connection...');
        console.log('Bucket:', bucketName);
        console.log('Region:', process.env.AWS_REGION);
        console.log('Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 10) + '...' : 'Not set');
        
        // First, try to check if bucket exists
        const headParams = {
            Bucket: bucketName
        };
        
        try {
            await s3.headBucket(headParams).promise();
            console.log('Bucket exists and is accessible');
        } catch (headError) {
            console.error('Bucket head error:', headError.code, headError.message);
            if (headError.code === 'NotFound') {
                return res.status(500).json({ 
                    error: 'Bucket not found', 
                    details: `Bucket '${bucketName}' does not exist or is not accessible`,
                    suggestion: 'Check bucket name and ensure it exists in the specified region'
                });
            }
            if (headError.code === 'Forbidden') {
                return res.status(500).json({ 
                    error: 'Access denied to bucket', 
                    details: 'AWS credentials do not have permission to access this bucket',
                    suggestion: 'Check IAM permissions for S3 access'
                });
            }
        }
        
        // Then try to list objects
        const listParams = {
            Bucket: bucketName,
            MaxKeys: 1
        };
        
        const result = await s3.listObjects(listParams).promise();
        console.log('S3 list objects successful');
        
        res.json({ 
            success: true, 
            message: 'S3 connection successful',
            bucket: bucketName,
            region: process.env.AWS_REGION,
            objectCount: result.Contents ? result.Contents.length : 0
        });
    } catch (error) {
        console.error('S3 connection error:', error);
        
        let errorMessage = 'Failed to connect to S3';
        let suggestion = 'Check AWS credentials and configuration';
        
        if (error.code === 'InvalidAccessKeyId') {
            errorMessage = 'Invalid AWS Access Key ID';
            suggestion = 'Check your AWS_ACCESS_KEY_ID in .env file';
        } else if (error.code === 'SignatureDoesNotMatch') {
            errorMessage = 'Invalid AWS Secret Access Key';
            suggestion = 'Check your AWS_SECRET_ACCESS_KEY in .env file';
        } else if (error.code === 'TokenRefreshRequired') {
            errorMessage = 'AWS credentials have expired';
            suggestion = 'Generate new AWS credentials';
        } else if (error.code === 'NoSuchBucket') {
            errorMessage = 'Bucket does not exist';
            suggestion = `Create bucket '${bucketName}' in region '${process.env.AWS_REGION}'`;
        }
        
        res.status(500).json({ 
            error: errorMessage,
            details: error.message,
            code: error.code,
            suggestion: suggestion
        });
    }
});

// Upload images to S3
app.post('/api/images/upload', authenticate, upload.array('images', 10), async (req, res) => {
    try {
        const { category, description } = req.body;
        const files = req.files;

        if (!category) {
            return res.status(400).json({ error: 'Category is required' });
        }

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const uploadPromises = files.map(async (file) => {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 15);
            const extension = path.extname(file.originalname);
            const fileName = `ngo-images/${category}/${timestamp}-${random}${extension}`;

            const params = {
                Bucket: bucketName,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read',
                Metadata: {
                    'category': category,
                    'description': description || '',
                    'uploadDate': new Date().toISOString(),
                    'originalName': file.originalname
                }
            };

            const result = await s3.upload(params).promise();
            return {
                key: fileName,
                url: result.Location,
                originalName: file.originalname,
                category: category,
                description: description || ''
            };
        });

        const uploadedFiles = await Promise.all(uploadPromises);
        res.json({ success: true, files: uploadedFiles });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed', details: error.message });
    }
});

// List images from S3
app.get('/api/images', async (req, res) => {
    try {
        const { category } = req.query;
        
        const params = {
            Bucket: bucketName,
            Prefix: 'ngo-images/'
        };

        const data = await s3.listObjects(params).promise();
        
        // Filter out folders and get only image files
        const imageObjects = data.Contents.filter(obj => 
            obj.Key.includes('.') && 
            obj.Size > 0 &&
            /\.(jpg|jpeg|png|gif|webp)$/i.test(obj.Key)
        );

        // Get metadata for each image
        const imagePromises = imageObjects.map(async (obj) => {
            try {
                const metadata = await s3.headObject({
                    Bucket: bucketName,
                    Key: obj.Key
                }).promise();

                const imageUrl = `https://${bucketName}.s3.amazonaws.com/${obj.Key}`;
                return {
                    key: obj.Key,
                    url: imageUrl,
                    category: metadata.Metadata.category || 'uncategorized',
                    description: metadata.Metadata.description || '',
                    uploadDate: metadata.Metadata.uploaddate || obj.LastModified,
                    originalName: metadata.Metadata.originalname || obj.Key.split('/').pop(),
                    size: obj.Size
                };
            } catch (error) {
                console.error(`Error getting metadata for ${obj.Key}:`, error);
                return null;
            }
        });

        let images = await Promise.all(imagePromises);
        images = images.filter(img => img !== null);

        // Filter by category if specified
        if (category) {
            images = images.filter(img => img.category === category);
        }

        res.json({ success: true, images });

    } catch (error) {
        console.error('List images error:', error);
        res.status(500).json({ error: 'Failed to list images', details: error.message });
    }
});

// Update image metadata (description) in S3
app.put('/api/images/:key/metadata', authenticate, async (req, res) => {
    try {
        const key = decodeURIComponent(req.params.key);
        const { description } = req.body;
        
        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        // First, get the current object to preserve other metadata
        const currentObject = await s3.headObject({
            Bucket: bucketName,
            Key: key
        }).promise();

        // Sanitize description for S3 metadata (remove invalid characters)
        const sanitizedDescription = description
            .replace(/[\r\n\t]/g, ' ')  // Replace newlines and tabs with spaces
            .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII characters
            .trim();

        // Copy the object with updated metadata
        const copyParams = {
            Bucket: bucketName,
            CopySource: `${bucketName}/${key}`,
            Key: key,
            Metadata: {
                ...currentObject.Metadata,
                'description': sanitizedDescription,
                'lastModified': new Date().toISOString()
            },
            MetadataDirective: 'REPLACE'
        };

        await s3.copyObject(copyParams).promise();
        
        res.json({ 
            success: true, 
            message: 'Image description updated successfully',
            newDescription: description
        });

    } catch (error) {
        console.error('Update metadata error:', error);
        res.status(500).json({ error: 'Failed to update image description', details: error.message });
    }
});

// Delete image from S3
app.delete('/api/images/:key', authenticate, async (req, res) => {
    try {
        const key = decodeURIComponent(req.params.key);
        
        const params = {
            Bucket: bucketName,
            Key: key
        };

        await s3.deleteObject(params).promise();
        res.json({ success: true, message: 'Image deleted successfully' });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete image', details: error.message });
    }
});

// Email configuration
const createEmailTransporter = () => {
    // For Gmail, you would need to set up an App Password
    // For production, consider using services like SendGrid, AWS SES, or Mailgun
    return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'sarojvandana2022@gmail.com',
            pass: process.env.EMAIL_PASS || 'your-app-password-here' // Use App Password for Gmail
        }
    });
};

// Contact form submission endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Basic validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }
        
        console.log('📧 Contact Form Submission:');
        console.log(`From: ${name} (${email})`);
        console.log(`Subject: ${subject}`);
        console.log(`Message: ${message}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        
        // Try to send email if email credentials are configured
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                const transporter = createEmailTransporter();
                
                // Email to organization
                const organizationEmailOptions = {
                    from: `"NGO Contact Form" <${process.env.EMAIL_USER}>`,
                    to: 'sarojvandana2022@gmail.com',
                    subject: `New Contact Form Message: ${subject}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                                New Contact Form Submission
                            </h2>
                            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
                                <p><strong>From:</strong> ${name}</p>
                                <p><strong>Email:</strong> ${email}</p>
                                <p><strong>Subject:</strong> ${subject}</p>
                                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                            </div>
                            <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
                                <h3 style="color: #333; margin-top: 0;">Message:</h3>
                                <p style="line-height: 1.6; color: #555;">${message.replace(/\n/g, '<br>')}</p>
                            </div>
                            <div style="text-align: center; margin-top: 30px; padding: 20px; background: #667eea; color: white; border-radius: 10px;">
                                <p>This message was sent from the SAROJ VANDANA NGO website contact form.</p>
                                <p>Please reply directly to: ${email}</p>
                            </div>
                        </div>
                    `
                };
                
                // Confirmation email to sender
                const confirmationEmailOptions = {
                    from: `"SAROJ VANDANA NGO" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: 'Thank you for contacting SAROJ VANDANA NGO',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #11998e; border-bottom: 2px solid #11998e; padding-bottom: 10px;">
                                Thank You for Your Message
                            </h2>
                            <p>Dear ${name},</p>
                            <p>Thank you for reaching out to SAROJ VANDANA WOMEN & CHILDREN EMPOWERMENT SOCIETY. We have received your message and will get back to you as soon as possible.</p>
                            
                            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
                                <h3 style="color: #333; margin-top: 0;">Your Message Summary:</h3>
                                <p><strong>Subject:</strong> ${subject}</p>
                                <p><strong>Message:</strong> ${message}</p>
                                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                            </div>
                            
                            <div style="background: linear-gradient(135deg, #11998e, #38ef7d); padding: 20px; border-radius: 10px; color: white; text-align: center;">
                                <h3 style="margin-top: 0;">Contact Information</h3>
                                <p><strong>Email:</strong> sarojvandana2022@gmail.com</p>
                                <p><strong>Phone:</strong> +91 87410 61834</p>
                                <p><strong>Address:</strong> Village Main Road, Rural District, State 123456, India</p>
                            </div>
                            
                            <p style="margin-top: 20px;">
                                Best regards,<br>
                                <strong>SAROJ VANDANA WOMEN & CHILDREN EMPOWERMENT SOCIETY</strong>
                            </p>
                        </div>
                    `
                };
                
                // Send both emails
                await Promise.all([
                    transporter.sendMail(organizationEmailOptions),
                    transporter.sendMail(confirmationEmailOptions)
                ]);
                
                console.log('✅ Emails sent successfully to both organization and sender');
                
            } catch (emailError) {
                console.error('❌ Email sending failed:', emailError.message);
                // Don't fail the request if email fails - still log the contact
            }
        } else {
            console.log('⚠️ Email credentials not configured - contact form logged only');
        }
        
        res.json({ 
            success: true, 
            message: 'Thank you for your message! We will get back to you soon.' 
        });
        
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ error: 'Failed to send message. Please try again.' });
    }
});

// Serve admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve main website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files. Maximum is 10 files per upload.' });
        }
    }
    
    if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({ error: 'Only image files are allowed!' });
    }
    
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Admin panel: http://localhost:${PORT}/admin`);
    console.log(`🌐 Main website: http://localhost:${PORT}`);
    
    // Validate environment variables
    const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'S3_BUCKET_NAME'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
        console.warn('⚠️  Missing environment variables:', missingEnvVars.join(', '));
        console.warn('⚠️  Please create a .env file based on .env.example');
    } else {
        console.log('✅ All environment variables configured');
    }
});

module.exports = app;