// Admin Panel API Client
// Handles all API communication with the backend server

class AdminAPI {
    constructor() {
        this.baseURL = window.location.origin;
        this.sessionId = sessionStorage.getItem('adminSessionId');
    }

    // Helper method to make API requests
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}/api${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.sessionId) {
            headers['X-Session-ID'] = this.sessionId;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                // Handle unauthorized errors (session expired)
                if (response.status === 401 && data.error === 'Unauthorized') {
                    console.log('Session expired, clearing local session');
                    this.clearSession();
                    // Trigger a page reload to show login modal
                    window.location.reload();
                    return;
                }
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    // Authentication methods
    async login(username, password) {
        try {
            const data = await this.makeRequest('/admin/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            if (data.success) {
                this.sessionId = data.sessionId;
                sessionStorage.setItem('adminSessionId', this.sessionId);
            }

            return data;
        } catch (error) {
            throw new Error('Login failed: ' + error.message);
        }
    }

    async logout() {
        try {
            await this.makeRequest('/admin/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.sessionId = null;
            sessionStorage.removeItem('adminSessionId');
        }
    }

    // Server status methods
    async testS3Connection() {
        try {
            const data = await this.makeRequest('/s3/test');
            return data;
        } catch (error) {
            throw new Error('S3 connection test failed: ' + error.message);
        }
    }

    // Image management methods
    async uploadImages(formData) {
        try {
            const url = `${this.baseURL}/api/images/upload`;
            const headers = {};

            if (this.sessionId) {
                headers['X-Session-ID'] = this.sessionId;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData // Don't set Content-Type for FormData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            throw new Error('Upload failed: ' + error.message);
        }
    }

    async getImages(category = '') {
        try {
            const endpoint = category ? `/images?category=${encodeURIComponent(category)}` : '/images';
            const data = await this.makeRequest(endpoint);
            return data;
        } catch (error) {
            throw new Error('Failed to load images: ' + error.message);
        }
    }

    async updateImageMetadata(imageKey, description) {
        try {
            const encodedKey = encodeURIComponent(imageKey);
            const data = await this.makeRequest(`/images/${encodedKey}/metadata`, {
                method: 'PUT',
                body: JSON.stringify({ description })
            });
            return data;
        } catch (error) {
            throw new Error('Failed to update image description: ' + error.message);
        }
    }

    async deleteImage(imageKey) {
        try {
            const encodedKey = encodeURIComponent(imageKey);
            const data = await this.makeRequest(`/images/${encodedKey}`, {
                method: 'DELETE'
            });
            return data;
        } catch (error) {
            throw new Error('Failed to delete image: ' + error.message);
        }
    }

    // Utility methods
    isAuthenticated() {
        return !!this.sessionId;
    }

    clearSession() {
        this.sessionId = null;
        sessionStorage.removeItem('adminSessionId');
    }
}

// Initialize API client
window.adminAPI = new AdminAPI();