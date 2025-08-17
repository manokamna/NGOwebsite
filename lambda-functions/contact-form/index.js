// Simple contact form handler (email logging for now)

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
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

    try {
        const body = JSON.parse(event.body);
        const { name, email, subject, message } = body;

        // Validation
        if (!name || !email || !subject || !message) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'All fields are required' })
            };
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid email address' })
            };
        }

        // Email parameters for organization
        const orgEmailParams = {
            Source: 'sarojvandana2022@gmail.com',
            Destination: {
                ToAddresses: ['sarojvandana2022@gmail.com']
            },
            Message: {
                Subject: {
                    Data: `New Contact Form Message: ${subject}`
                },
                Body: {
                    Html: {
                        Data: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                                <h2 style="color: #667eea;">New Contact Form Submission</h2>
                                <div style="background: #f8fafc; padding: 20px; border-radius: 10px;">
                                    <p><strong>From:</strong> ${name}</p>
                                    <p><strong>Email:</strong> ${email}</p>
                                    <p><strong>Subject:</strong> ${subject}</p>
                                    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                                </div>
                                <div style="background: white; padding: 20px; margin-top: 20px;">
                                    <h3>Message:</h3>
                                    <p>${message.replace(/\n/g, '<br>')}</p>
                                </div>
                            </div>
                        `
                    }
                }
            }
        };

        // Email parameters for sender confirmation
        const confirmationEmailParams = {
            Source: 'sarojvandana2022@gmail.com',
            Destination: {
                ToAddresses: [email]
            },
            Message: {
                Subject: {
                    Data: 'Thank you for contacting SAROJ VANDANA NGO'
                },
                Body: {
                    Html: {
                        Data: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                                <h2 style="color: #11998e;">Thank You for Your Message</h2>
                                <p>Dear ${name},</p>
                                <p>Thank you for reaching out to SAROJ VANDANA WOMEN & CHILDREN EMPOWERMENT SOCIETY. 
                                We have received your message and will get back to you soon.</p>
                                <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
                                    <h3>Your Message Summary:</h3>
                                    <p><strong>Subject:</strong> ${subject}</p>
                                    <p><strong>Message:</strong> ${message}</p>
                                </div>
                                <p>Best regards,<br>
                                <strong>SAROJ VANDANA NGO</strong></p>
                            </div>
                        `
                    }
                }
            }
        };

        // Log contact form submission (SES can be configured later)
        console.log('📧 Contact Form Submission:');
        console.log(`From: ${name} (${email})`);
        console.log(`Subject: ${subject}`);
        console.log(`Message: ${message}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Thank you for your message! We will get back to you soon.' 
            })
        };

    } catch (error) {
        console.error('Contact form error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to send message. Please try again.' 
            })
        };
    }
};