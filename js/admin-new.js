// New Admin Panel JavaScript - Backend API Version

// Configuration and state management
let adminState = {
    isAuthenticated: false,
    images: [],
    cropper: null,
    croppedFiles: new Map()
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
    setupEditBioEventListeners();
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
    
    // Category change - update description requirements
    document.getElementById('imageCategory').addEventListener('change', updateDescriptionRequirement);
    
    // Note: Crop modal controls will be setup when modal opens
}

function updateDescriptionRequirement() {
    const category = document.getElementById('imageCategory').value;
    const descriptionLabel = document.getElementById('descriptionLabel');
    const descriptionField = document.getElementById('imageDescription');
    const descriptionHint = document.getElementById('descriptionHint');
    
    if (category === 'team') {
        // Make description required for team category
        descriptionLabel.innerHTML = 'Image Description <span style="color: red;">*</span> (Required for Team):';
        descriptionField.setAttribute('required', 'required');
        descriptionField.placeholder = 'Required: "Designation - Name" or "Designation - Name || Bio"';
        
        // Update hint to emphasize requirement
        descriptionHint.innerHTML = `
            <strong style="color: #d32f2f;">⚠️ REQUIRED for Team Members:</strong><br>
            • Basic: "Designation - Name" (e.g., "President - Saroj")<br>
            • With Bio: "Designation - Name || Bio text here"<br>
            • Example: "Vice President - Nirmala Devi || Expert in community development with 10+ years experience."
        `;
    } else {
        // Make description optional for other categories
        descriptionLabel.innerHTML = 'Image Description (Optional):';
        descriptionField.removeAttribute('required');
        descriptionField.placeholder = 'Enter description (optional for this category)';
        
        // Update hint for optional
        descriptionHint.innerHTML = `
            <strong>Description is optional for this category.</strong><br>
            You can provide a brief description of the image if desired.
        `;
    }
}

function setupCropEventListeners() {
    // Remove existing listeners to prevent duplicates
    const elements = [
        'closeCropModal', 'cancelCropBtn', 'applyCropBtn', 
        'rotateLeftBtn', 'rotateRightBtn', 'flipHBtn', 'flipVBtn', 'resetCropBtn'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
        }
    });
    
    // Crop modal controls
    document.getElementById('closeCropModal').addEventListener('click', closeCropModal);
    document.getElementById('cancelCropBtn').addEventListener('click', closeCropModal);
    document.getElementById('applyCropBtn').addEventListener('click', applyCrop);
    document.getElementById('rotateLeftBtn').addEventListener('click', () => {
        console.log('Rotate left clicked');
        rotateCrop(-90);
    });
    document.getElementById('rotateRightBtn').addEventListener('click', () => {
        console.log('Rotate right clicked');
        rotateCrop(90);
    });
    document.getElementById('flipHBtn').addEventListener('click', () => {
        console.log('Flip horizontal clicked');
        flipCrop('horizontal');
    });
    document.getElementById('flipVBtn').addEventListener('click', () => {
        console.log('Flip vertical clicked');
        flipCrop('vertical');
    });
    document.getElementById('resetCropBtn').addEventListener('click', () => {
        console.log('Reset clicked');
        resetCrop();
    });
    
    // Zoom slider
    const zoomSlider = document.getElementById('zoomSlider');
    const newZoomSlider = zoomSlider.cloneNode(true);
    zoomSlider.parentNode.replaceChild(newZoomSlider, zoomSlider);
    
    document.getElementById('zoomSlider').addEventListener('input', function(e) {
        console.log('Zoom slider changed to:', e.target.value);
        const zoomValue = e.target.value / 100;
        zoomCrop(zoomValue);
        document.getElementById('zoomValue').textContent = e.target.value + '%';
    });
    
    // Aspect ratio buttons
    document.querySelectorAll('.aspect-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            console.log('Aspect ratio clicked:', this.getAttribute('data-ratio'));
            const ratio = parseFloat(this.getAttribute('data-ratio'));
            setAspectRatio(ratio, e);
        });
    });
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
        let largeFiles = [];
        
        // Clear previous cropped files
        adminState.croppedFiles.clear();
        
        for (let file of files) {
            totalSize += file.size;
            
            // Check file type
            if (!file.type.startsWith('image/')) {
                invalidFiles.push(file.name + ' (not an image)');
            }
            
            // Check for extremely large files (50MB limit - we'll resize automatically)
            if (file.size > 50 * 1024 * 1024) {
                invalidFiles.push(file.name + ' (file too large - max 50MB)');
            } else if (file.size > 5 * 1024 * 1024) {
                // Files over 5MB will be automatically resized
                largeFiles.push(file.name);
            }
        }
        
        if (invalidFiles.length > 0) {
            showStatus('uploadStatus', 'Invalid files: ' + invalidFiles.join(', '), 'error');
            return;
        }
        
        let message = `${files.length} file(s) selected (${formatFileSize(totalSize)}).`;
        if (largeFiles.length > 0) {
            message += ` Large files will be automatically resized: ${largeFiles.join(', ')}.`;
        }
        message += ' Click upload to crop and upload.';
        
        showStatus('uploadStatus', message, 'info');
    }
}

// Image upload functions
async function handleImageUpload() {
    const category = document.getElementById('imageCategory').value;
    const files = document.getElementById('imageFile').files;
    const description = document.getElementById('imageDescription').value.trim();
    
    if (!category) {
        showStatus('uploadStatus', 'Please select an image category.', 'error');
        return;
    }
    
    if (files.length === 0) {
        showStatus('uploadStatus', 'Please select at least one image file.', 'error');
        return;
    }
    
    // Make description mandatory only for team category
    if (category === 'team' && !description) {
        showStatus('uploadStatus', 'Description is required for team members. Use format: "Designation - Name" or "Designation - Name || Bio" (e.g., "President - Saroj || Experienced leader with 15 years in social work.").', 'error');
        return;
    }
    
    // Process images with cropper
    adminState.currentFileIndex = 0;
    adminState.filesToProcess = Array.from(files);
    adminState.currentCategory = category;
    adminState.currentDescription = description;
    
    processNextImage();
}

async function processNextImage() {
    if (adminState.currentFileIndex >= adminState.filesToProcess.length) {
        // All images processed, now upload
        await uploadCroppedImages();
        return;
    }
    
    const file = adminState.filesToProcess[adminState.currentFileIndex];
    openCropModal(file);
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
    
    // Add Edit Bio button for team category images
    const editBioButton = image.category === 'team' ? 
        `<button class="btn btn-small btn-edit-bio" data-key="${image.key}" data-url="${image.url}" data-description="${image.description.replace(/"/g, '&quot;')}" title="Edit Bio">Edit Bio</button>` : '';
    
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
                    ${editBioButton}
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
    
    // Edit Bio buttons
    document.querySelectorAll('.btn-edit-bio').forEach(btn => {
        btn.addEventListener('click', function() {
            const key = this.getAttribute('data-key');
            const url = this.getAttribute('data-url');
            const description = this.getAttribute('data-description');
            openEditBioModal(key, url, description);
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

// Edit Bio Modal Functions
let currentEditingImageKey = null;

function setupEditBioEventListeners() {
    document.getElementById('closeEditBioModal').addEventListener('click', closeEditBioModal);
    document.getElementById('cancelEditBio').addEventListener('click', closeEditBioModal);
    document.getElementById('saveEditBio').addEventListener('click', saveEditBio);
}

function openEditBioModal(imageKey, imageUrl, currentDescription) {
    currentEditingImageKey = imageKey;
    
    // Set image preview
    document.getElementById('editImagePreview').src = imageUrl;
    
    // Set current description (decode HTML entities)
    document.getElementById('editBioDescription').value = currentDescription.replace(/&quot;/g, '"');
    
    // Show modal
    document.getElementById('editBioModal').style.display = 'flex';
}

function closeEditBioModal() {
    document.getElementById('editBioModal').style.display = 'none';
    currentEditingImageKey = null;
}

async function saveEditBio() {
    const newDescription = document.getElementById('editBioDescription').value.trim();
    
    if (!newDescription) {
        alert('Please provide a description.');
        return;
    }
    
    const saveBtn = document.getElementById('saveEditBio');
    const originalText = saveBtn.textContent;
    
    try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        const response = await adminAPI.updateImageMetadata(currentEditingImageKey, newDescription);
        
        if (response.success) {
            closeEditBioModal();
            showStatus('configStatus', 'Team member info updated successfully! Refresh the website to see changes.', 'success');
            loadImageGallery(); // Refresh gallery to show updated description
        }
        
    } catch (error) {
        showStatus('configStatus', error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// Cropping functions
function openCropModal(file) {
    // First resize the image if it's too large
    resizeImageIfNeeded(file).then(resizedFile => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const cropImage = document.getElementById('cropImage');
            const cropModal = document.getElementById('cropModal');
            
            // Reset zoom slider
            document.getElementById('zoomSlider').value = 100;
            document.getElementById('zoomValue').textContent = '100%';
            
            // Show modal first
            cropModal.style.display = 'flex';
            
            // Setup event listeners for crop modal
            setupCropEventListeners();
            
            // Set image source
            cropImage.src = e.target.result;
            
            // Wait for image to load before initializing cropper
            cropImage.onload = function() {
                // Destroy previous cropper if exists
                if (adminState.cropper) {
                    adminState.cropper.destroy();
                    adminState.cropper = null;
                }
                
                // Initialize new cropper with proper settings
                setTimeout(() => {
                    adminState.cropper = new Cropper(cropImage, {
                        aspectRatio: NaN, // Free aspect ratio by default
                        viewMode: 1, // Restrict crop box to not exceed the canvas
                        dragMode: 'crop', // Create new crop box
                        initialAspectRatio: NaN,
                        autoCropArea: 0.8,
                        responsive: true,
                        restore: false,
                        guides: true,
                        center: true,
                        highlight: true,
                        cropBoxMovable: true,
                        cropBoxResizable: true,
                        toggleDragModeOnDblclick: true,
                        background: true,
                        modal: true,
                        zoomable: true,
                        zoomOnWheel: true,
                        zoomOnTouch: true,
                        wheelZoomRatio: 0.1,
                        ready: function() {
                            console.log('Cropper initialized successfully');
                            // Reset aspect ratio buttons
                            document.querySelectorAll('.aspect-btn').forEach(btn => {
                                btn.classList.remove('active');
                            });
                            const freeBtn = document.querySelector('.aspect-btn[data-ratio="0"]');
                            if (freeBtn) freeBtn.classList.add('active');
                        }
                    });
                }, 100);
            };
            
            adminState.currentFile = resizedFile;
        };
        reader.readAsDataURL(resizedFile);
    });
}

// Function to resize image if it's too large
function resizeImageIfNeeded(file) {
    return new Promise((resolve) => {
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;
        const MAX_SIZE = 2 * 1024 * 1024; // 2MB
        
        // If file is already small enough, return as is
        if (file.size <= MAX_SIZE) {
            resolve(file);
            return;
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            let { width, height } = img;
            
            // Calculate new dimensions
            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                width *= ratio;
                height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw resized image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to blob
            canvas.toBlob((blob) => {
                const resizedFile = new File([blob], file.name, {
                    type: file.type,
                    lastModified: Date.now()
                });
                
                console.log(`Image resized from ${formatFileSize(file.size)} to ${formatFileSize(resizedFile.size)}`);
                resolve(resizedFile);
            }, file.type, 0.8); // 80% quality
        };
        
        img.src = URL.createObjectURL(file);
    });
}

function closeCropModal() {
    document.getElementById('cropModal').style.display = 'none';
    if (adminState.cropper) {
        adminState.cropper.destroy();
        adminState.cropper = null;
    }
    
    // Reset file input if user cancels
    if (adminState.croppedFiles.size === 0) {
        document.getElementById('imageFile').value = '';
        showStatus('uploadStatus', 'Upload cancelled', 'info');
    }
}

function rotateCrop(degrees) {
    if (adminState.cropper) {
        adminState.cropper.rotate(degrees);
    }
}

function flipCrop(direction) {
    if (adminState.cropper) {
        console.log('Flipping', direction);
        const imageData = adminState.cropper.getImageData();
        if (direction === 'horizontal') {
            const currentScaleX = imageData.scaleX || 1;
            adminState.cropper.scaleX(-currentScaleX);
        } else {
            const currentScaleY = imageData.scaleY || 1;
            adminState.cropper.scaleY(-currentScaleY);
        }
    }
}

function zoomCrop(ratio) {
    if (adminState.cropper) {
        console.log('Zooming to', ratio);
        adminState.cropper.zoomTo(ratio);
    }
}

function resetCrop() {
    if (adminState.cropper) {
        console.log('Resetting crop');
        adminState.cropper.reset();
        document.getElementById('zoomSlider').value = 100;
        document.getElementById('zoomValue').textContent = '100%';
        
        // Reset aspect ratio buttons
        document.querySelectorAll('.aspect-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const freeBtn = document.querySelector('.aspect-btn[data-ratio="0"]');
        if (freeBtn) freeBtn.classList.add('active');
    }
}

function setAspectRatio(ratio, event) {
    if (adminState.cropper) {
        console.log('Setting aspect ratio to', ratio);
        adminState.cropper.setAspectRatio(ratio === 0 ? NaN : ratio);
    }
    
    // Update button styles
    document.querySelectorAll('.aspect-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

function applyCrop() {
    if (!adminState.cropper) return;
    
    // Get cropped canvas
    adminState.cropper.getCroppedCanvas({
        maxWidth: 1920,
        maxHeight: 1920,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
    }).toBlob(function(blob) {
        // Create a new file from the blob
        const fileName = adminState.currentFile.name;
        const croppedFile = new File([blob], fileName, {
            type: blob.type || 'image/jpeg'
        });
        
        // Store the cropped file
        adminState.croppedFiles.set(fileName, croppedFile);
        
        // Close modal
        document.getElementById('cropModal').style.display = 'none';
        if (adminState.cropper) {
            adminState.cropper.destroy();
            adminState.cropper = null;
        }
        
        // Process next image
        adminState.currentFileIndex++;
        processNextImage();
    }, 'image/jpeg', 0.9);
}

async function uploadCroppedImages() {
    if (adminState.croppedFiles.size === 0) {
        showStatus('uploadStatus', 'No images to upload', 'error');
        return;
    }
    
    const files = Array.from(adminState.croppedFiles.values());
    await uploadFilesToServer(files, adminState.currentCategory, adminState.currentDescription);
    
    // Clear the cropped files after upload
    adminState.croppedFiles.clear();
}