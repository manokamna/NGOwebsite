const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const compression = require('compression');
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
            styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
            fontSrc: ["'self'", "fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "*.s3.amazonaws.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"]
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
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'eu-north-1'
});

const s3 = new AWS.S3();
const bucketName = process.env.S3_BUCKET_NAME || 'sarojvandana';

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

// Test S3 connection
app.get('/api/s3/test', authenticate, async (req, res) => {
    try {
        const params = {
            Bucket: bucketName,
            MaxKeys: 1
        };
        
        await s3.listObjects(params).promise();
        res.json({ success: true, message: 'S3 connection successful' });
    } catch (error) {
        console.error('S3 connection error:', error);
        res.status(500).json({ error: 'Failed to connect to S3', details: error.message });
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