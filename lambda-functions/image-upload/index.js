const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const crypto = require('crypto');

const BUCKET_NAME = 'sarojvandana-images';

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Session-Id',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Verify authentication
        const sessionId = event.headers['x-session-id'] || event.headers['X-Session-Id'];
        if (!sessionId) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

        if (event.httpMethod === 'POST') {
            // Generate presigned URL for upload
            const body = JSON.parse(event.body);
            const { fileName, fileType, category, description } = body;

            if (!fileName || !fileType || !category) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing required fields' })
                };
            }

            // Generate unique file name
            const timestamp = Date.now();
            const random = crypto.randomBytes(8).toString('hex');
            const extension = fileName.split('.').pop();
            const key = `ngo-images/${category}/${timestamp}-${random}.${extension}`;

            // Generate presigned URL for upload
            const uploadURL = await s3.getSignedUrlPromise('putObject', {
                Bucket: BUCKET_NAME,
                Key: key,
                ContentType: fileType,
                Expires: 300, // 5 minutes
                Metadata: {
                    category: category,
                    description: description || '',
                    originalName: fileName,
                    uploadDate: new Date().toISOString()
                }
            });

            // Generate public URL
            const publicURL = `https://${BUCKET_NAME}.s3.eu-north-1.amazonaws.com/${key}`;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    uploadURL,
                    publicURL,
                    key,
                    expiresIn: 300
                })
            };
        } else if (event.httpMethod === 'GET') {
            // List images
            const category = event.queryStringParameters?.category;
            
            const params = {
                Bucket: BUCKET_NAME,
                Prefix: category ? `ngo-images/${category}/` : 'ngo-images/'
            };

            const data = await s3.listObjectsV2(params).promise();
            
            // Get metadata for each image
            const images = await Promise.all(
                data.Contents
                    .filter(obj => obj.Size > 0 && /\.(jpg|jpeg|png|gif|webp)$/i.test(obj.Key))
                    .map(async (obj) => {
                        try {
                            const metadata = await s3.headObject({
                                Bucket: BUCKET_NAME,
                                Key: obj.Key
                            }).promise();

                            return {
                                key: obj.Key,
                                url: `https://${BUCKET_NAME}.s3.eu-north-1.amazonaws.com/${obj.Key}`,
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
                    })
            );

            const filteredImages = images.filter(img => img !== null);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    images: filteredImages
                })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Image upload error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};