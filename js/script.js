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

// Circular Hero Carousel
function initCircleCarousel() {
    const images = document.querySelectorAll('.circle-carousel-image');
    const dots = document.querySelectorAll('.circle-carousel-dot');
    let current = 0;
    let interval;

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
    const carousel = document.querySelector('.circle-carousel');
    if (carousel) {
        carousel.addEventListener('mouseenter', stopCarousel);
        carousel.addEventListener('mouseleave', startCarousel);
    }
}

// Translation functionality
function translatePage(language) {
    currentLanguage = language;
    const elementsToTranslate = document.querySelectorAll('[data-en][data-hi]');
    
    elementsToTranslate.forEach(element => {
        if (language === 'hi') {
            element.textContent = element.getAttribute('data-hi');
        } else {
            element.textContent = element.getAttribute('data-en');
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
    // Initialize circular hero carousel
    if (document.querySelector('.circle-carousel')) {
        initCircleCarousel();
    }
    
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
        contactForm.addEventListener('submit', function(e) {
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

            // Simulate form submission (replace with actual backend integration)
            showMessage('Thank you for your message! We will get back to you soon.', 'success');
            contactForm.reset();
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
            const response = await fetch('/api/images');
            const data = await response.json();
            
            if (data.success && data.images.length > 0) {
                // Update hero carousel with S3 images
                updateHeroCarousel(data.images.filter(img => img.category === 'hero'));
                
                // Update circle carousel with S3 images
                updateCircleCarousel(data.images.filter(img => img.category === 'circle'));
                
                // Update gallery with S3 images
                updateGalleryImages(data.images.filter(img => img.category === 'gallery'));
                
                // Update team images
                updateTeamImages(data.images.filter(img => img.category === 'team'));
                
                // Update program images
                updateProgramImages(data.images.filter(img => img.category === 'programs'));
            }
        } catch (error) {
            console.log('S3 images not available, using static images');
        }
    }

    function updateHeroCarousel(heroImages) {
        if (heroImages.length === 0) return;
        
        const carouselContainer = document.querySelector('.carousel-container');
        if (!carouselContainer) return;
        
        // Clear existing images
        carouselContainer.innerHTML = '';
        
        // Add S3 images
        heroImages.forEach((image, index) => {
            const imgElement = document.createElement('img');
            imgElement.src = image.url;
            imgElement.alt = image.description || `Hero image ${index + 1}`;
            imgElement.className = 'carousel-image';
            imgElement.style.display = index === 0 ? 'block' : 'none';
            carouselContainer.appendChild(imgElement);
        });
        
        // Update dots
        const dotsContainer = document.querySelector('.carousel-dots');
        if (dotsContainer) {
            dotsContainer.innerHTML = '';
            heroImages.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
                dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
                dotsContainer.appendChild(dot);
            });
        }
        
        // Reinitialize carousel
        initCarousel();
    }

    function updateCircleCarousel(circleImages) {
        if (circleImages.length === 0) return;
        
        const circleContainer = document.querySelector('.circle-carousel-container');
        if (!circleContainer) return;
        
        // Clear existing images
        circleContainer.innerHTML = '';
        
        // Add S3 images
        circleImages.forEach((image, index) => {
            const imgElement = document.createElement('img');
            imgElement.src = image.url;
            imgElement.alt = image.description || `Circle image ${index + 1}`;
            imgElement.className = 'circle-carousel-image';
            imgElement.style.display = index === 0 ? 'block' : 'none';
            circleContainer.appendChild(imgElement);
        });
        
        // Update dots
        const circleDotsContainer = document.querySelector('.circle-carousel-dots');
        if (circleDotsContainer) {
            circleDotsContainer.innerHTML = '';
            circleImages.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.className = `circle-carousel-dot ${index === 0 ? 'active' : ''}`;
                dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
                circleDotsContainer.appendChild(dot);
            });
        }
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
    donationModal.addEventListener('click', function(e) {
        if (e.target === donationModal) {
            donationModal.style.display = 'none';
        }
    });
});

// Helper Functions
function showMessage(text, type) {
    const formMessage = document.getElementById('formMessage');
    if (formMessage) {
        formMessage.textContent = text;
        formMessage.className = `form-message ${type}`;
        formMessage.style.display = 'block';
        
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