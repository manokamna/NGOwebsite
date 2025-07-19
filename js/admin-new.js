// New Admin Panel JavaScript - Backend API Version

// Configuration and state management
let adminState = {
    isAuthenticated: false,
    images: []
};

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

function initializeAdmin() {
    // Check if already authenticated
    if (adminAPI.isAuthenticated()) {
        showAdminPanel();
    } else {
        showLoginModal();
    }

    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Test connection button
    document.getElementById('testConnectionBtn').addEventListener('click', testS3Connection);
    
    // Upload button
    document.getElementById('uploadBtn').addEventListener('click', handleImageUpload);
    
    // Gallery controls
    document.getElementById('refreshGalleryBtn').addEventListener('click', loadImageGallery);
    document.getElementById('filterCategory').addEventListener('change', filterImages);
    
    // File input change
    document.getElementById('imageFile').addEventListener('change', handleFileSelection);
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('loginError');
    
    try {
        const response = await adminAPI.login(username, password);
        
        if (response.success) {
            adminState.isAuthenticated = true;
            showAdminPanel();
            errorElement.style.display = 'none';
        }
    } catch (error) {
        errorElement.textContent = error.message;
        errorElement.style.display = 'block';
    }
}

async function handleLogout() {
    try {
        await adminAPI.logout();
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    adminState.isAuthenticated = false;
    showLoginModal();
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    checkServerStatus();
    loadImageGallery();
}

// Server status functions
async function checkServerStatus() {
    const serverStatusElement = document.getElementById('serverStatus');
    
    try {
        // Test if we can reach the API
        serverStatusElement.textContent = 'Connected';
        serverStatusElement.className = 'status-indicator success';
    } catch (error) {
        serverStatusElement.textContent = 'Disconnected';
        serverStatusElement.className = 'status-indicator error';
    }
}

async function testS3Connection() {
    const s3StatusElement = document.getElementById('s3Status');
    const testBtn = document.getElementById('testConnectionBtn');
    
    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';
    s3StatusElement.textContent = 'Testing...';
    s3StatusElement.className = 'status-indicator';
    
    try {
        const response = await adminAPI.testS3Connection();
        
        if (response.success) {
            s3StatusElement.textContent = 'Connected';
            s3StatusElement.className = 'status-indicator success';
            showStatus('configStatus', 'S3 connection successful!', 'success');
        }
    } catch (error) {
        s3StatusElement.textContent = 'Failed';
        s3StatusElement.className = 'status-indicator error';
        showStatus('configStatus', error.message, 'error');
    } finally {
        testBtn.disabled = false;
        testBtn.textContent = 'Test S3 Connection';
    }
}

// File handling functions
function handleFileSelection(e) {
    const files = e.target.files;
    const status = document.getElementById('uploadStatus');
    
    if (files.length > 0) {
        let totalSize = 0;
        let invalidFiles = [];
        
        for (let file of files) {
            totalSize += file.size;
            
            // Check file type
            if (!file.type.startsWith('image/')) {
                invalidFiles.push(file.name + ' (not an image)');
            }
            
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                invalidFiles.push(file.name + ' (too large)');
            }
        }
        
        if (invalidFiles.length > 0) {
            showStatus('uploadStatus', 'Invalid files: ' + invalidFiles.join(', '), 'error');
            return;
        }
        
        showStatus('uploadStatus', `${files.length} file(s) selected (${formatFileSize(totalSize)})`, 'info');
    }
}

// Image upload functions
async function handleImageUpload() {
    const category = document.getElementById('imageCategory').value;
    const files = document.getElementById('imageFile').files;
    const description = document.getElementById('imageDescription').value;
    
    if (!category) {
        showStatus('uploadStatus', 'Please select an image category.', 'error');
        return;
    }
    
    if (files.length === 0) {
        showStatus('uploadStatus', 'Please select at least one image file.', 'error');
        return;
    }
    
    await uploadFilesToServer(files, category, description);
}

async function uploadFilesToServer(files, category, description) {
    const uploadBtn = document.getElementById('uploadBtn');
    const progressBar = document.getElementById('uploadProgress');
    const progressFill = progressBar.querySelector('.progress-fill');
    
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    
    try {
        // Create FormData object
        const formData = new FormData();
        formData.append('category', category);
        formData.append('description', description);
        
        // Add all files
        Array.from(files).forEach(file => {
            formData.append('images', file);
        });
        
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress <= 90) {
                progressFill.style.width = progress + '%';
            }
        }, 200);
        
        // Upload to server
        const response = await adminAPI.uploadImages(formData);
        
        clearInterval(progressInterval);
        progressFill.style.width = '100%';
        
        if (response.success) {
            showStatus('uploadStatus', `Successfully uploaded ${response.files.length} image(s)!`, 'success');
            clearUploadForm();
            loadImageGallery();
        }
        
    } catch (error) {
        showStatus('uploadStatus', error.message, 'error');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload Images';
        setTimeout(() => {
            progressBar.style.display = 'none';
        }, 1000);
    }
}

function clearUploadForm() {
    document.getElementById('imageCategory').value = '';
    document.getElementById('imageFile').value = '';
    document.getElementById('imageDescription').value = '';
}

// Gallery management functions
async function loadImageGallery() {
    const gallery = document.getElementById('imageGallery');
    gallery.innerHTML = '<div class="loading">Loading images...</div>';
    
    try {
        const response = await adminAPI.getImages();
        
        if (response.success) {
            adminState.images = response.images;
            displayGalleryImages(response.images);
        }
    } catch (error) {
        gallery.innerHTML = `<div class="empty-state"><h4>Error loading images</h4><p>${error.message}</p></div>`;
    }
}

function displayGalleryImages(images) {
    const gallery = document.getElementById('imageGallery');
    const filterCategory = document.getElementById('filterCategory').value;
    
    let filteredImages = images;
    if (filterCategory) {
        filteredImages = images.filter(img => img.category === filterCategory);
    }
    
    if (filteredImages.length === 0) {
        gallery.innerHTML = '<div class="empty-state"><h4>No images found</h4><p>Upload some images to get started.</p></div>';
        return;
    }
    
    const galleryHTML = filteredImages.map(image => createImageCard(image)).join('');
    gallery.innerHTML = galleryHTML;
    
    // Add event listeners to action buttons
    addGalleryEventListeners();
}

function createImageCard(image) {
    const uploadDate = new Date(image.uploadDate).toLocaleDateString();
    return `
        <div class="gallery-item" data-category="${image.category}">
            <img src="${image.url}" alt="${image.description}" loading="lazy">
            <div class="gallery-item-info">
                <div class="gallery-item-title">${image.originalName}</div>
                <div class="gallery-item-meta">
                    Category: ${image.category} | Size: ${formatFileSize(image.size)} | Date: ${uploadDate}
                </div>
                <div class="gallery-item-description">${image.description}</div>
                <div class="gallery-item-actions">
                    <button class="btn btn-small btn-copy" data-url="${image.url}" title="Copy URL">Copy URL</button>
                    <button class="btn btn-small btn-danger" data-key="${image.key}" title="Delete Image">Delete</button>
                </div>
            </div>
        </div>
    `;
}

function addGalleryEventListeners() {
    // Copy URL buttons
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            navigator.clipboard.writeText(url).then(() => {
                this.textContent = 'Copied!';
                setTimeout(() => {
                    this.textContent = 'Copy URL';
                }, 2000);
            });
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', async function() {
            const key = this.getAttribute('data-key');
            if (confirm('Are you sure you want to delete this image?')) {
                await deleteImage(key);
            }
        });
    });
}

async function deleteImage(key) {
    try {
        const response = await adminAPI.deleteImage(key);
        
        if (response.success) {
            showStatus('configStatus', 'Image deleted successfully', 'success');
            loadImageGallery(); // Refresh gallery
        }
    } catch (error) {
        showStatus('configStatus', error.message, 'error');
    }
}

function filterImages() {
    displayGalleryImages(adminState.images);
}

// Utility functions
function showStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.style.display = 'block';
    
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}