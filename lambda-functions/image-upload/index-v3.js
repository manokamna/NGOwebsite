const crypto = require('crypto');
const { S3Client, ListObjectsV2Command, HeadObjectCommand } = require('@aws-sdk/client-s3');

const BUCKET_NAME = 'sarojvandana-images';
const s3Client = new S3Client({ region: 'eu-north-1' });

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
        const sessionId = event.headers['x-session-id'] || event.headers['X-Session-Id'];
        console.log('Session ID:', sessionId);

        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body);
            const { fileName, fileType, category, description } = body;

            if (!fileName || !fileType || !category) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing required fields' })
                };
            }

            // Generate mock presigned URL for testing
            const timestamp = Date.now();
            const random = crypto.randomBytes(8).toString('hex');
            const extension = fileName.split('.').pop();
            const key = `ngo-images/${category}/${timestamp}-${random}.${extension}`;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    uploadURL: `https://mock-upload-url.com/${key}`,
                    publicURL: `https://${BUCKET_NAME}.s3.eu-north-1.amazonaws.com/${key}`,
                    key,
                    expiresIn: 300,
                    message: 'Mock response for testing'
                })
            };
        } else if (event.httpMethod === 'GET') {
            // Get category from query parameters
            const category = event.queryStringParameters?.category || 'all';
            
            try {
                // List objects from S3
                const listParams = {
                    Bucket: BUCKET_NAME,
                    Prefix: category === 'all' ? 'ngo-images/' : `ngo-images/${category}/`
                };
                
                const listCommand = new ListObjectsV2Command(listParams);
                const listResponse = await s3Client.send(listCommand);
                
                // Filter out directories and process each image
                const imageObjects = (listResponse.Contents || []).filter(item => !item.Key.endsWith('/'));
                
                const images = await Promise.all(
                    imageObjects.map(async (item) => {
                        try {
                            // Get object metadata
                            const headCommand = new HeadObjectCommand({
                                Bucket: BUCKET_NAME,
                                Key: item.Key
                            });
                            const headResponse = await s3Client.send(headCommand);
                            
                            return {
                                key: item.Key,
                                url: `https://${BUCKET_NAME}.s3.eu-north-1.amazonaws.com/${item.Key}`,
                                size: item.Size,
                                lastModified: item.LastModified,
                                category: item.Key.split('/')[1] || 'uncategorized',
                                description: headResponse.Metadata?.description || '',
                                originalName: headResponse.Metadata?.originalname || item.Key.split('/').pop()
                            };
                        } catch (error) {
                            console.error(`Error getting metadata for ${item.Key}:`, error);
                            return {
                                key: item.Key,
                                url: `https://${BUCKET_NAME}.s3.eu-north-1.amazonaws.com/${item.Key}`,
                                size: item.Size,
                                lastModified: item.LastModified,
                                category: item.Key.split('/')[1] || 'uncategorized',
                                description: '',
                                originalName: item.Key.split('/').pop()
                            };
                        }
                    })
                );
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        images: images,
                        count: images.length
                    })
                };
                
            } catch (error) {
                console.error('Error fetching from S3:', error);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ 
                        error: 'Failed to fetch images from S3',
                        details: error.message 
                    })
                };
            }
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', details: error.message })
        };
    }
};