const crypto = require('crypto');

// Simple in-memory session store (use DynamoDB in production)
const sessions = new Map();

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Session-Id',
        'Access-Control-Allow-Methods': 'OPTIONS,POST'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    const path = event.path;
    
    try {
        // Get admin credentials from environment or Secrets Manager
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'ngo2024';

        if (path.includes('/login')) {
            const body = JSON.parse(event.body);
            const { username, password } = body;

            if (username === adminUsername && password === adminPassword) {
                const sessionId = crypto.randomBytes(32).toString('hex');
                const sessionData = {
                    username,
                    loginTime: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour
                };
                
                // Store session (in production, use DynamoDB)
                sessions.set(sessionId, sessionData);
                
                // Clean up expired sessions
                for (const [id, session] of sessions) {
                    if (new Date(session.expiresAt) < new Date()) {
                        sessions.delete(id);
                    }
                }

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        success: true, 
                        sessionId,
                        expiresIn: 3600 
                    })
                };
            } else {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Invalid credentials' })
                };
            }
        } else if (path.includes('/logout')) {
            const sessionId = event.headers['x-session-id'] || event.headers['X-Session-Id'];
            
            if (sessionId && sessions.has(sessionId)) {
                sessions.delete(sessionId);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true })
                };
            } else {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Invalid session' })
                };
            }
        } else if (path.includes('/verify')) {
            const sessionId = event.headers['x-session-id'] || event.headers['X-Session-Id'];
            
            if (sessionId && sessions.has(sessionId)) {
                const session = sessions.get(sessionId);
                if (new Date(session.expiresAt) > new Date()) {
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({ 
                            success: true,
                            username: session.username 
                        })
                    };
                }
            }
            
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid or expired session' })
            };
        }

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Not found' })
        };

    } catch (error) {
        console.error('Auth error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};