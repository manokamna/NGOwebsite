// Language Translation System
let currentLanguage = 'en';

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