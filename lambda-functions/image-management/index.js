const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const BUCKET_NAME = 'sarojvandana-images';

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Session-Id',
        'Access-Control-Allow-Methods': 'OPTIONS,PUT,DELETE'
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

        const imageKey = event.pathParameters?.key;
        if (!imageKey) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Image key is required' })
            };
        }

        if (event.httpMethod === 'PUT') {
            // Update image metadata
            const body = JSON.parse(event.body);
            const { description } = body;

            if (!description) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Description is required' })
                };
            }

            // Get current object metadata
            const currentObject = await s3.headObject({
                Bucket: BUCKET_NAME,
                Key: decodeURIComponent(imageKey)
            }).promise();

            // Copy object with updated metadata
            const copyParams = {
                Bucket: BUCKET_NAME,
                CopySource: `${BUCKET_NAME}/${decodeURIComponent(imageKey)}`,
                Key: decodeURIComponent(imageKey),
                Metadata: {
                    ...currentObject.Metadata,
                    description: description.replace(/[\r\n\t]/g, ' ').trim(),
                    lastModified: new Date().toISOString()
                },
                MetadataDirective: 'REPLACE',
                ContentType: currentObject.ContentType
            };

            await s3.copyObject(copyParams).promise();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Image description updated successfully',
                    newDescription: description
                })
            };

        } else if (event.httpMethod === 'DELETE') {
            // Delete image
            await s3.deleteObject({
                Bucket: BUCKET_NAME,
                Key: decodeURIComponent(imageKey)
            }).promise();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Image deleted successfully'
                })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Image management error:', error);
        
        if (error.code === 'NoSuchKey') {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Image not found' })
            };
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};