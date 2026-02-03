/**
 * APA DO ENCANTADO - Main JavaScript
 * Handles navigation, scroll animations, and interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  initNavigation();
  initScrollAnimations();
  initVideoHandler();
  initRippleEffect();
  initSmoothScroll();
  initCounterAnimation();
});

/**
 * Navigation handling
 */
function initNavigation() {
  const header = document.querySelector('.header');
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  const navLinksItems = document.querySelectorAll('.nav-links a');
  
  // Header scroll effect
  let lastScrollY = 0;
  let ticking = false;
  
  function updateHeader() {
    const scrollY = window.scrollY;
    
    if (scrollY > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScrollY = scrollY;
    ticking = false;
  }
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });
  
  // Mobile menu toggle
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuBtn.classList.toggle('active');
      navLinks.classList.toggle('active');
      document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });
  }
  
  // Close mobile menu on link click
  navLinksItems.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenuBtn.classList.remove('active');
      navLinks.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

/**
 * Intersection Observer for scroll animations
 */
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -100px 0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        
        // Trigger parent container reveal for grid items
        const parent = entry.target.parentElement;
        if (parent && (
          parent.classList.contains('attractions-grid') ||
          parent.classList.contains('activities-grid') ||
          parent.classList.contains('fauna-grid') ||
          parent.classList.contains('about-stats')
        )) {
          parent.classList.add('revealed');
        }
      }
    });
  }, observerOptions);
  
  // Observe all animatable elements
  const animatableElements = document.querySelectorAll(
    '.organic-box, .stat-card, .attraction-card, .activity-card, .fauna-card, ' +
    '.section-header, .fade-in, .slide-up, .slide-left, .slide-right, .scale-in'
  );
  
  animatableElements.forEach(el => observer.observe(el));
  
  // Also observe grid containers
  const gridContainers = document.querySelectorAll(
    '.attractions-grid, .activities-grid, .fauna-grid, .about-stats'
  );
  gridContainers.forEach(el => observer.observe(el));
}

/**
 * Video loading handler
 */
function initVideoHandler() {
  const video = document.getElementById('hero-video');
  if (!video) return;
  
  // Check connection speed and disable video on slow connections
  if (navigator.connection) {
    const connection = navigator.connection.effectiveType;
    if (connection === '2g' || connection === 'slow-2g') {
      video.style.display = 'none';
      console.log('Video disabled due to slow connection');
      return;
    }
  }
  
  // Handle video load events
  video.addEventListener('loadeddata', () => {
    video.classList.add('loaded');
  });
  
  video.addEventListener('error', (e) => {
    console.warn('Video failed to load:', e);
    // Fallback to poster image is automatic
  });
  
  // Pause video when not visible (performance optimization)
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.25 });
  
  videoObserver.observe(video);
}

/**
 * Button ripple effect
 */
function initRippleEffect() {
  const buttons = document.querySelectorAll('.btn');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

/**
 * Smooth scroll for anchor links
 */
function initSmoothScroll() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  
  anchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      const target = document.querySelector(href);
      if (!target) return;
      
      e.preventDefault();
      
      const headerHeight = document.querySelector('.header').offsetHeight;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  });
}

/**
 * Counter animation for statistics
 */
function initCounterAnimation() {
  const stats = document.querySelectorAll('.stat-number');
  
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        animateCounter(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  stats.forEach(stat => counterObserver.observe(stat));
}

function animateCounter(element) {
  const text = element.textContent;
  const match = text.match(/[\d,.]+/);
  if (!match) return;
  
  const targetNumber = parseFloat(match[0].replace(/,/g, ''));
  const suffix = text.replace(match[0], '');
  const duration = 2000;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(targetNumber * easeOut);
    
    element.textContent = current.toLocaleString('pt-BR') + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = text; // Restore original text with formatting
    }
  }
  
  requestAnimationFrame(update);
}

/**
 * Parallax effect for hero section
 */
function initParallax() {
  const hero = document.querySelector('.hero');
  const heroContent = document.querySelector('.hero-content');
  
  if (!hero || !heroContent) return;
  
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroHeight = hero.offsetHeight;
    
    if (scrollY < heroHeight) {
      const parallaxValue = scrollY * 0.4;
      heroContent.style.transform = `translateY(${parallaxValue}px)`;
    }
  }, { passive: true });
}

// Initialize parallax
initParallax();

/**
 * Water drop trigger on card hover
 */
document.querySelectorAll('[data-water-drop]').forEach(element => {
  element.addEventListener('mouseenter', () => {
    element.classList.add('dripping');
  });
  
  element.addEventListener('animationend', () => {
    element.classList.remove('dripping');
  });
});

/**
 * Console welcome message
 */
console.log(
  '%c🌿 APA do Encantado',
  'color: #4a9960; font-size: 24px; font-weight: bold;'
);
console.log(
  '%cÁrea de Proteção Ambiental do Encantado\nGoiás, Brasil',
  'color: #666; font-size: 14px;'
);
