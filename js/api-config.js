// API Configuration
const API_CONFIG = {
    // Production API endpoint
    baseURL: 'https://klbot0zc8l.execute-api.eu-north-1.amazonaws.com/prod',
    
    // Individual endpoints
    endpoints: {
        contact: '/contact',
        adminLogin: '/admin-login',
        adminLogout: '/admin-logout',
        adminVerify: '/admin-verify',
        images: '/images',
        imageManagement: '/images'
    },
    
    // Helper function to get full URL
    getURL: function(endpoint) {
        return this.baseURL + this.endpoints[endpoint];
    }
};

// For local development, you can override with local server
if (window.location.hostname === 'localhost') {
    // Keep local development server for testing
    // API_CONFIG.baseURL = 'http://localhost:3000/api';
}

// Export for use in other scripts
window.API_CONFIG = API_CONFIG;