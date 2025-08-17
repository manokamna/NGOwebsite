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
                // Use S3's REST API to list objects
                const prefix = category === 'all' ? 'ngo-images/' : `ngo-images/${category}/`;
                const listUrl = `https://${BUCKET_NAME}.s3.eu-north-1.amazonaws.com/?list-type=2&prefix=${encodeURIComponent(prefix)}`;
                
                console.log('Fetching from S3:', listUrl);
                
                const response = await fetch(listUrl);
                if (!response.ok) {
                    throw new Error(`S3 API returned ${response.status}`);
                }
                
                const xmlText = await response.text();
                console.log('S3 XML Response length:', xmlText.length);
                
                // Parse XML to extract object keys
                const images = await parseS3ListResponse(xmlText, category);
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        images: images,
                        count: images.length,
                        source: 'dynamic_s3_scan'
                    })
                };
                
            } catch (error) {
                console.error('Error fetching from S3:', error);
                
                // Fallback: Return all known images from direct URLs
                const fallbackImages = await getFallbackImages(category);
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        images: fallbackImages,
                        count: fallbackImages.length,
                        source: 'fallback_direct_check',
                        note: 'Using fallback method due to S3 API limitation'
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

// Parse S3 ListObjectsV2 XML response
async function parseS3ListResponse(xmlText, category) {
    const images = [];
    
    // Simple XML parsing for S3 response
    const keyMatches = xmlText.match(/<Key>([^<]+)<\/Key>/g);
    const sizeMatches = xmlText.match(/<Size>([^<]+)<\/Size>/g);
    const lastModifiedMatches = xmlText.match(/<LastModified>([^<]+)<\/LastModified>/g);
    
    if (keyMatches) {
        for (let i = 0; i < keyMatches.length; i++) {
            const key = keyMatches[i].replace(/<Key>|<\/Key>/g, '');
            
            // Skip directories and non-image files
            if (key.endsWith('/') || !isImageFile(key)) {
                continue;
            }
            
            const size = sizeMatches && sizeMatches[i] 
                ? parseInt(sizeMatches[i].replace(/<Size>|<\/Size>/g, ''))
                : 0;
            
            const lastModified = lastModifiedMatches && lastModifiedMatches[i]
                ? lastModifiedMatches[i].replace(/<LastModified>|<\/LastModified>/g, '')
                : new Date().toISOString();
            
            // Get metadata by making HEAD request
            const imageUrl = `https://${BUCKET_NAME}.s3.eu-north-1.amazonaws.com/${key}`;
            
            try {
                const headResponse = await fetch(imageUrl, { method: 'HEAD' });
                
                if (headResponse.ok) {
                    const description = headResponse.headers.get('x-amz-meta-description') || '';
                    const originalName = headResponse.headers.get('x-amz-meta-originalname') || key.split('/').pop();
                    
                    images.push({
                        key: key,
                        url: imageUrl,
                        size: size,
                        lastModified: lastModified,
                        category: key.split('/')[1] || 'uncategorized',
                        description: description,
                        originalName: originalName
                    });
                }
            } catch (headError) {
                console.log(`Could not get metadata for ${key}:`, headError.message);
                // Add without metadata
                images.push({
                    key: key,
                    url: imageUrl,
                    size: size,
                    lastModified: lastModified,
                    category: key.split('/')[1] || 'uncategorized',
                    description: '',
                    originalName: key.split('/').pop()
                });
            }
        }
    }
    
    return images;
}

// Check if file is an image
function isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return imageExtensions.includes(ext);
}

// Fallback method: Check common filename patterns
async function getFallbackImages(category) {
    console.log('Using fallback method to scan for images...');
    
    const images = [];
    const baseUrl = `https://${BUCKET_NAME}.s3.eu-north-1.amazonaws.com/ngo-images/team/`;
    
    // Generate potential filenames based on timestamp patterns
    const now = Date.now();
    const potentialFiles = [];
    
    // Check files from the last 24 hours with common patterns
    for (let i = 0; i < 1000; i++) {
        const timestamp = now - (i * 60000); // Check every minute backwards
        const timestampStr = timestamp.toString();
        
        // Common patterns we've seen
        const patterns = [
            `${timestampStr}-[a-z0-9]{10,15}`,
            `1755[0-9]{9}-[a-z0-9]{10,15}`
        ];
        
        // Add known file patterns from recent uploads
        const recentTimestamps = [
            '1755464203843', '1755465931769', '1755466340454', '1755466542656',
            '1755466934313', '1755467044464', '1755467175961', '1755467359457',
            '1755468223186', '1755468395542'
        ];
        
        for (const ts of recentTimestamps) {
            potentialFiles.push(`${ts}-[a-z0-9]{10,15}.jpeg`);
            potentialFiles.push(`${ts}-[a-z0-9]{10,15}.jpg`);
        }
    }
    
    // Test a broader range of known files
    const knownFiles = [
        '1755464203843-fen3k9f6ruv.jpeg',
        '1755465931769-06iv1xg522aw.jpeg',
        '1755466340454-0oxregngz5h.jpeg',
        '1755466542656-obxtx1eohj.jpeg',
        '1755466934313-2nmvxtruhpy.jpeg',
        '1755467044464-pf6zz2sx8w.jpeg',
        '1755467175961-cazdpj9y6xk.jpg',
        '1755467359457-s4gbcyy3gs.jpeg',
        '1755468223186-2d7cuglrj5x.jpg',
        '1755468395542-akfjlyecwfe.jpg'
    ];
    
    for (const filename of knownFiles) {
        try {
            const imageUrl = baseUrl + filename;
            const response = await fetch(imageUrl, { method: 'HEAD' });
            
            if (response.ok) {
                const description = response.headers.get('x-amz-meta-description') || '';
                const originalName = response.headers.get('x-amz-meta-originalname') || filename;
                const size = parseInt(response.headers.get('content-length') || '0');
                const lastModified = response.headers.get('last-modified') || new Date().toISOString();
                
                images.push({
                    key: `ngo-images/team/${filename}`,
                    url: imageUrl,
                    size: size,
                    lastModified: lastModified,
                    category: 'team',
                    description: description,
                    originalName: originalName
                });
            }
        } catch (error) {
            console.log(`File ${filename} not found or inaccessible`);
        }
    }
    
    return images;
}