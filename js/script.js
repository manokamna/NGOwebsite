// Language Translation System
let currentLanguage = 'en';

// Organization name animation system
function initOrgNameAnimations() {
    const orgNames = document.querySelectorAll('.org-name, .org-name-footer, .org-name-copyright');
    
    orgNames.forEach((element, index) => {
        // Alternate between left-to-right and right-to-left animations
        if (index % 2 === 0) {
            element.style.animation = 'slideLeftRight 8s ease-in-out infinite';
        } else {
            element.style.animation = 'slideRightLeft 8s ease-in-out infinite';
        }
        
        // Add slight delay for staggered effect
        element.style.animationDelay = `${index * 0.5}s`;
    });
}


// Translation functionality
function translatePage(language) {
    currentLanguage = language;
    const elementsToTranslate = document.querySelectorAll('[data-en][data-hi]');
    
    elementsToTranslate.forEach(element => {
        if (language === 'hi') {
            element.innerHTML = element.getAttribute('data-hi');
        } else {
            element.innerHTML = element.getAttribute('data-en');
        }
    });
    
    // Update language toggle button
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.textContent = language === 'en' ? 'हिं' : 'EN';
    }
    
    // Store language preference
    localStorage.setItem('preferredLanguage', language);
    
    // Update HTML lang attribute
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
}

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    // Initialize organization name animations
    initOrgNameAnimations();
    
    // Language Toggle Setup
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        // Load saved language preference
        const savedLanguage = localStorage.getItem('preferredLanguage') || 'en';
        if (savedLanguage === 'hi') {
            translatePage('hi');
        }
        
        langToggle.addEventListener('click', function() {
            const newLanguage = currentLanguage === 'en' ? 'hi' : 'en';
            translatePage(newLanguage);
        });
    }

    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Contact Form Handling
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');

    if (contactForm && formMessage) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');

            // Basic validation
            if (!name || !email || !subject || !message) {
                showMessage('Please fill in all required fields.', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showMessage('Please enter a valid email address.', 'error');
                return;
            }

            // Show loading state
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;

            try {
                // Send form data to server
                const response = await fetch('https://klbot0zc8l.execute-api.eu-north-1.amazonaws.com/prod/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        subject: subject,
                        message: message
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    showMessage(result.message || 'Thank you for your message! We will get back to you soon.', 'success');
                    contactForm.reset();
                } else {
                    showMessage(result.error || 'Failed to send message. Please try again.', 'error');
                }

            } catch (error) {
                console.error('Contact form error:', error);
                showMessage('Failed to send message. Please check your connection and try again.', 'error');
            } finally {
                // Reset button state
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
            }
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add scroll effect to navbar
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                navbar.style.backdropFilter = 'blur(10px)';
            } else {
                navbar.style.backgroundColor = '#fff';
                navbar.style.backdropFilter = 'none';
            }
        });
    }

    // Animate statistics on scroll
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };

    const animateStats = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statElements = entry.target.querySelectorAll('.stat h3, .stat h4');
                statElements.forEach(stat => {
                    const finalValue = stat.textContent;
                    const numericValue = parseInt(finalValue.replace(/[^\d]/g, ''));
                    
                    if (numericValue && !stat.classList.contains('animated')) {
                        stat.classList.add('animated');
                        animateNumber(stat, 0, numericValue, finalValue);
                    }
                });
                observer.unobserve(entry.target);
            }
        });
    };

    const statsObserver = new IntersectionObserver(animateStats, observerOptions);
    
    // Observe all stats sections
    document.querySelectorAll('.impact-stats, .program-stats').forEach(section => {
        statsObserver.observe(section);
    });

    // Add fade-in animation for cards
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Apply fade-in to various card elements
    document.querySelectorAll('.program-card, .value-card, .team-member, .option').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        cardObserver.observe(card);
    });

    // Add typing effect to hero title (only on homepage)
    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle && window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        const originalText = heroTitle.textContent;
        heroTitle.textContent = '';
        typeWriter(heroTitle, originalText, 50);
    }

    // S3 Image Integration
    async function loadS3Images() {
        try {
            const response = await fetch('https://klbot0zc8l.execute-api.eu-north-1.amazonaws.com/prod/images');
            const data = await response.json();
            
            if (data.success && data.images.length > 0) {
                // Update hero carousel with random images from all folders
                updateHeroCarouselWithRandomImages(data.images);
                
                // Update gallery with S3 images
                updateGalleryImages(data.images.filter(img => img.category === 'gallery'));
                
                // Update team images
                updateTeamImages(data.images.filter(img => img.category === 'team'));
                
                // Update program images
                updateProgramImages(data.images.filter(img => img.category === 'programs'));
                
                // Update program-specific galleries
                loadProgramGalleries(data.images);
                
                // Update about page image
                updateAboutImage(data.images.filter(img => img.category === 'about'));
            }
        } catch (error) {
            console.log('S3 images not available, using static images');
            // Load fallback images for flashy carousel
            loadFallbackImages();
        }
    }

    function updateHeroCarouselWithRandomImages(allImages) {
        if (allImages.length === 0) return;
        
        const carousel = document.querySelector('.carousel-flashy') || document.querySelector('.carousel');
        if (!carousel) return;
        
        // Remove loading message
        const loadingElement = carousel.querySelector('.carousel-loading-flashy') || carousel.querySelector('.carousel-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
        
        // Shuffle all images randomly
        const shuffledImages = [...allImages].sort(() => Math.random() - 0.5);
        
        // Take first 8-12 random images for variety
        const numberOfImages = Math.min(Math.max(8, Math.floor(Math.random() * 5) + 8), shuffledImages.length);
        const selectedImages = shuffledImages.slice(0, numberOfImages);
        
        // Clear existing carousel content
        carousel.innerHTML = '';
        
        // Add selected random images
        selectedImages.forEach((image, index) => {
            const imgElement = document.createElement('img');
            imgElement.src = image.url;
            imgElement.alt = image.description || `NGO Activity ${index + 1}`;
            imgElement.className = 'carousel-image';
            imgElement.style.cssText = `
                display: ${index === 0 ? 'block' : 'none'};
                width: 100%;
                height: 450px;
                object-fit: cover;
                border-radius: 25px;
                transition: opacity 0.5s ease;
                position: absolute;
                top: 0;
                left: 0;
            `;
            imgElement.loading = 'lazy';
            
            // Add error handling
            imgElement.onerror = function() {
                this.src = 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80';
            };
            
            carousel.appendChild(imgElement);
        });
        
        // Create dots for navigation
        const dotsContainer = document.querySelector('.carousel-dots-flashy') || document.createElement('div');
        if (!document.querySelector('.carousel-dots-flashy')) {
            dotsContainer.className = 'carousel-dots';
            dotsContainer.style.cssText = `
                display: flex;
                justify-content: center;
                gap: 0.5rem;
                margin-top: 1rem;
            `;
            carousel.appendChild(dotsContainer);
        }
        
        dotsContainer.innerHTML = '';
        selectedImages.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
            dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
            dot.style.cssText = `
                width: 15px;
                height: 15px;
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.6);
                background: ${index === 0 ? 'rgba(255,255,255,0.9)' : 'transparent'};
                cursor: pointer;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            `;
            dotsContainer.appendChild(dot);
        });
        
        // Initialize carousel functionality
        initCarousel();
    }
    
    function loadFallbackImages() {
        const fallbackImages = [
            {
                url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80',
                description: 'Women empowerment program'
            },
            {
                url: 'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=800&q=80',
                description: 'Children education program'
            },
            {
                url: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=800&q=80',
                description: 'Skill development training'
            },
            {
                url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
                description: 'Community activities'
            },
            {
                url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
                description: 'Health and wellness'
            }
        ];
        
        updateHeroCarouselWithRandomImages(fallbackImages);
    }


    function updateGalleryImages(galleryImages) {
        if (galleryImages.length === 0) return;
        
        const galleryContainer = document.querySelector('.image-gallery');
        if (!galleryContainer) return;
        
        // Clear existing images
        galleryContainer.innerHTML = '';
        
        // Add S3 images
        galleryImages.forEach(image => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.innerHTML = `
                <img src="${image.url}" alt="${image.description || 'Gallery image'}" loading="lazy">
                <div class="gallery-overlay">
                    <h4>${image.description || 'Gallery Image'}</h4>
                </div>
            `;
            galleryContainer.appendChild(galleryItem);
        });
    }

    function updateTeamImages(teamImages) {
        if (teamImages.length === 0) return;
        
        const teamMembers = document.querySelectorAll('.team-member img');
        teamImages.forEach((image, index) => {
            if (teamMembers[index]) {
                teamMembers[index].src = image.url;
                teamMembers[index].alt = image.description || `Team member ${index + 1}`;
            }
        });
    }

    function updateProgramImages(programImages) {
        if (programImages.length === 0) return;
        
        const programCards = document.querySelectorAll('.program-card img');
        programImages.forEach((image, index) => {
            if (programCards[index]) {
                programCards[index].src = image.url;
                programCards[index].alt = image.description || `Program ${index + 1}`;
            }
        });
    }

    function loadProgramGalleries(allImages) {
        const programCategories = ['classical-dance', 'classical-music', 'yoga', 'robotics', 'hand-embroidery', 'aerobics'];
        
        programCategories.forEach(category => {
            const galleryContainer = document.getElementById(`${category}-gallery`);
            if (!galleryContainer) return;
            
            const categoryImages = allImages.filter(img => img.category === category);
            
            if (categoryImages.length === 0) {
                galleryContainer.innerHTML = '<div class="gallery-loading">No images available for this program yet.</div>';
                return;
            }
            
            // Clear loading message
            galleryContainer.innerHTML = '';
            
            // Special handling for yoga category - automatic image rotation
            if (category === 'yoga' && categoryImages.length > 1) {
                setupYogaImageRotation(galleryContainer, categoryImages);
            } else {
                // Regular gallery display for other categories
                categoryImages.forEach(image => {
                    const galleryItem = document.createElement('div');
                    galleryItem.className = 'gallery-item';
                    galleryItem.innerHTML = `
                        <img src="${image.url}" alt="${image.description || 'Program image'}" loading="lazy">
                        <div class="gallery-item-caption">${image.description || 'Program activity'}</div>
                    `;
                    galleryContainer.appendChild(galleryItem);
                });
            }
        });
    }

    function setupYogaImageRotation(container, images) {
        // Determine number of slots based on image count and screen space
        const numberOfSlots = Math.min(images.length, 3); // Max 3 slots, but can be fewer if less images
        
        // Set up container for side-by-side images
        container.style.cssText = `
            display: flex; 
            gap: 1.5rem; 
            justify-content: center; 
            width: 100%; 
            flex-wrap: wrap;
        `;

        // Create image slots that will cycle through all images
        const slots = [];
        for (let i = 0; i < numberOfSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'yoga-slot';
            slot.style.cssText = `
                flex: 1; 
                min-width: 280px; 
                max-width: 350px; 
                position: relative; 
                overflow: hidden;
            `;
            
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item yoga-rotating-item';
            galleryItem.style.cssText = `
                transition: opacity 0.8s ease-in-out, transform 0.8s ease-in-out;
                transform: translateY(0);
            `;
            
            // Start with first images available
            const imageIndex = i % images.length;
            const image = images[imageIndex];
            galleryItem.innerHTML = `
                <img src="${image.url}" alt="${image.description || 'Yoga practice'}" loading="lazy">
                <div class="gallery-item-caption">${image.description || 'Yoga practice'}</div>
            `;
            
            slot.appendChild(galleryItem);
            container.appendChild(slot);
            slots.push(slot);
        }

        // Start automatic rotation for all slots
        startYogaMultiSlotRotation(slots, images);
    }

    let yogaRotationInterval;
    let currentYogaIndices = [0, 1, 2]; // Track current image index for each slot

    function updateYogaSlot(slot, image) {
        const galleryItem = slot.querySelector('.yoga-rotating-item');
        
        // Fade out with slide up
        galleryItem.style.opacity = '0';
        galleryItem.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            // Update content
            galleryItem.innerHTML = `
                <img src="${image.url}" alt="${image.description || 'Yoga practice'}" loading="lazy">
                <div class="gallery-item-caption">${image.description || 'Yoga practice'}</div>
            `;
            
            // Fade in with slide down
            galleryItem.style.transform = 'translateY(20px)';
            setTimeout(() => {
                galleryItem.style.opacity = '1';
                galleryItem.style.transform = 'translateY(0)';
            }, 50);
        }, 400);
    }

    function startYogaMultiSlotRotation(slots, images) {
        // Clear any existing interval
        if (yogaRotationInterval) {
            clearInterval(yogaRotationInterval);
        }
        
        // Initialize indices to show first images
        currentYogaIndices = [];
        for (let i = 0; i < slots.length; i++) {
            currentYogaIndices[i] = i % images.length;
        }
        
        let currentSlotToUpdate = 0; // Track which slot to update next
        
        // Start sequential rotation every 2 seconds
        yogaRotationInterval = setInterval(() => {
            // Update only one slot at a time (sequential)
            const slot = slots[currentSlotToUpdate];
            currentYogaIndices[currentSlotToUpdate] = (currentYogaIndices[currentSlotToUpdate] + slots.length) % images.length;
            const nextImage = images[currentYogaIndices[currentSlotToUpdate]];
            updateYogaSlot(slot, nextImage);
            
            // Move to next slot for next update
            currentSlotToUpdate = (currentSlotToUpdate + 1) % slots.length;
        }, 2000);
        
        // Pause rotation on hover over container
        const container = slots[0].parentElement;
        container.addEventListener('mouseenter', () => {
            if (yogaRotationInterval) {
                clearInterval(yogaRotationInterval);
            }
        });
        
        // Resume rotation when mouse leaves
        container.addEventListener('mouseleave', () => {
            startYogaMultiSlotRotation(slots, images);
        });
    }

    function updateAboutImage(aboutImages) {
        if (aboutImages.length === 0) return;
        
        const aboutImageElement = document.getElementById('about-main-image');
        const aboutCaptionElement = document.getElementById('about-image-caption');
        
        if (!aboutImageElement || !aboutCaptionElement) return;
        
        // Use the first image from the about category
        const firstImage = aboutImages[0];
        aboutImageElement.src = firstImage.url;
        aboutImageElement.alt = firstImage.description || 'About our organization';
        aboutCaptionElement.textContent = firstImage.description || 'Our team working in the community';
    }

    // Carousel Functionality
    function initCarousel() {
        const images = document.querySelectorAll('.carousel-image');
        const dots = document.querySelectorAll('.carousel-dot');
        let current = 0;
        let interval;

        if (images.length === 0) return;

        function showImage(index) {
            images.forEach((img, i) => {
                img.style.display = i === index ? 'block' : 'none';
                img.style.opacity = i === index ? '1' : '0';
            });
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
            current = index;
        }

        function nextImage() {
            let next = (current + 1) % images.length;
            showImage(next);
        }

        function startCarousel() {
            interval = setInterval(nextImage, 3000);
        }

        function stopCarousel() {
            clearInterval(interval);
        }

        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                showImage(i);
                stopCarousel();
                startCarousel();
            });
        });

        showImage(0);
        startCarousel();

        // Pause on hover
        const carousel = document.querySelector('.carousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', stopCarousel);
            carousel.addEventListener('mouseleave', startCarousel);
        }
    }

    // Load S3 images on page load
    loadS3Images().then(() => {
        // Initialize carousels after S3 images are loaded
        if (document.querySelector('.carousel')) {
            initCarousel();
        }
    });

    // Donation Modal Logic
    const donationModal = document.getElementById('donationModal');
    const donationModalClose = document.getElementById('donationModalClose');
    // Find all donate modal trigger buttons
    const donateButtons = document.querySelectorAll('.donate-modal-trigger');
    donateButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Only open modal for visible donate buttons
            if (btn.offsetParent !== null) {
                e.preventDefault();
                donationModal.style.display = 'flex';
            }
        });
    });
    if (donationModalClose) {
        donationModalClose.addEventListener('click', function() {
            donationModal.style.display = 'none';
        });
    }
    // Close modal when clicking outside content
    if (donationModal) {
        donationModal.addEventListener('click', function(e) {
            if (e.target === donationModal) {
                donationModal.style.display = 'none';
            }
        });
    }
});

// Helper Functions
function showMessage(text, type) {
    const formMessage = document.getElementById('formMessage');
    if (formMessage) {
        formMessage.textContent = text;
        formMessage.className = `form-message ${type}`;
        
        // Style the message based on type
        if (type === 'success') {
            formMessage.style.cssText = `
                display: block;
                padding: 1rem;
                margin-top: 1rem;
                background-color: rgba(34, 197, 94, 0.2);
                color: rgba(255, 255, 255, 0.95);
                border: 1px solid rgba(34, 197, 94, 0.4);
                border-radius: 10px;
                font-weight: 500;
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 12px rgba(34, 197, 94, 0.1);
            `;
        } else if (type === 'error') {
            formMessage.style.cssText = `
                display: block;
                padding: 1rem;
                margin-top: 1rem;
                background-color: rgba(239, 68, 68, 0.2);
                color: rgba(255, 255, 255, 0.95);
                border: 1px solid rgba(239, 68, 68, 0.4);
                border-radius: 10px;
                font-weight: 500;
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
            `;
        }
        
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function animateNumber(element, start, end, finalText) {
    const duration = 2000; // 2 seconds
    const increment = (end - start) / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            element.textContent = finalText;
            clearInterval(timer);
        } else {
            const currentInt = Math.floor(current);
            if (finalText.includes('+')) {
                element.textContent = currentInt.toLocaleString() + '+';
            } else if (finalText.includes('K')) {
                element.textContent = '$' + currentInt + 'K+';
            } else {
                element.textContent = currentInt.toLocaleString();
            }
        }
    }, 16);
}

function typeWriter(element, text, speed) {
    let i = 0;
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

// Add loading screen (optional)
window.addEventListener('load', function() {
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }
});

// Add scroll-to-top button
function addScrollToTopButton() {
    const scrollButton = document.createElement('button');
    scrollButton.innerHTML = '↑';
    scrollButton.className = 'scroll-to-top';
    scrollButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #2563eb;
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 20px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(scrollButton);
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollButton.style.opacity = '1';
        } else {
            scrollButton.style.opacity = '0';
        }
    });
    
    scrollButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize scroll-to-top button
document.addEventListener('DOMContentLoaded', addScrollToTopButton);

// Add parallax effect to hero section (optional)
window.addEventListener('scroll', function() {
    const hero = document.querySelector('.hero');
    if (hero) {
        const scrolled = window.pageYOffset;
        const parallax = scrolled * 0.5;
        hero.style.transform = `translateY(${parallax}px)`;
    }
});

// Form validation with real-time feedback
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
});

function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    
    // Remove existing error styling
    clearFieldError(field);
    
    // Validation rules
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    if (fieldName === 'email' && value) {
        if (!isValidEmail(value)) {
            showFieldError(field, 'Please enter a valid email address');
            return false;
        }
    }
    
    if (fieldName === 'message' && value.length < 10) {
        showFieldError(field, 'Message must be at least 10 characters long');
        return false;
    }
    
    return true;
}

function showFieldError(field, message) {
    field.style.borderColor = '#dc2626';
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'color: #dc2626; font-size: 0.875rem; margin-top: 0.25rem;';
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.style.borderColor = '#d1d5db';
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Mobile Menu Functionality
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Update hamburger icon
            if (navMenu.classList.contains('active')) {
                mobileToggle.innerHTML = '✕';
                mobileToggle.setAttribute('aria-expanded', 'true');
            } else {
                mobileToggle.innerHTML = '☰';
                mobileToggle.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggle.innerHTML = '☰';
                mobileToggle.setAttribute('aria-expanded', 'false');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!navMenu.contains(event.target) && !mobileToggle.contains(event.target)) {
                navMenu.classList.remove('active');
                mobileToggle.innerHTML = '☰';
                mobileToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
}

// Initialize mobile menu when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
});