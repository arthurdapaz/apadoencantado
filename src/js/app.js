/**
 * APA DO ENCANTADO - Main Script
 * Navigation, animations, and interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollAnimations();
  initVideoHandler();
  initFaunaVideoHandler();
  initRippleEffect();
  initSmoothScroll();
  initCounterAnimation();
  initWaterDrop();
});

// ============================================
// NAVIGATION
// ============================================

function initNavigation() {
  const header = document.querySelector('.header');
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  // Header scroll effect (throttled)
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('scrolled', window.scrollY > 100);
      ticking = false;
    });
  }, { passive: true });

  // Mobile menu
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('active');
      menuBtn.classList.toggle('active');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuBtn.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
}

// ============================================
// SCROLL ANIMATIONS
// ============================================

function initScrollAnimations() {
  const options = { rootMargin: '0px 0px -50px 0px', threshold: 0.1 };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        entry.target.parentElement?.classList.add('revealed');
      }
    });
  }, options);

  // Observe all animatable elements
  const selectors = [
    '.organic-box', '.stat-card', '.attraction-card', '.activity-card',
    '.fauna-card', '.fauna-card-image', '.section-header', '.fade-in', '.slide-up',
    '.slide-left', '.slide-right', '.scale-in', '.water-reveal-image',
    '.gallery-item', '.featured-attraction', '.featured-image', '.featured-content',
    '.attractions-grid', '.activities-grid', '.fauna-grid', '.fauna-grid-images', 
    '.about-stats', '.gallery-grid'
  ];

  document.querySelectorAll(selectors.join(', ')).forEach(el => observer.observe(el));
}

// ============================================
// VIDEO HANDLER
// ============================================

function initVideoHandler() {
  const video = document.getElementById('hero-video');
  if (!video) return;

  // Disable on slow connections
  if (navigator.connection?.effectiveType?.includes('2g')) {
    video.style.display = 'none';
    return;
  }

  video.addEventListener('loadeddata', () => video.classList.add('loaded'));

  // Pause when not visible
  new IntersectionObserver(entries => {
    entries[0].isIntersecting ? video.play().catch(() => {}) : video.pause();
  }, { threshold: 0.25 }).observe(video);
}

// ============================================
// FAUNA VIDEO HANDLER
// ============================================

function initFaunaVideoHandler() {
  const faunaVideos = document.querySelectorAll('.fauna-video video');
  
  faunaVideos.forEach(video => {
    // Click to fullscreen with sound
    video.addEventListener('click', async (e) => {
      e.preventDefault();
      
      try {
        // Request fullscreen
        if (video.requestFullscreen) {
          await video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) {
          await video.webkitRequestFullscreen();
        } else if (video.webkitEnterFullscreen) {
          // iOS Safari
          video.webkitEnterFullscreen();
        }
        
        // Enable sound when fullscreen
        video.muted = false;
        video.play();
      } catch (err) {
        // Fallback: just unmute and play
        video.muted = false;
        video.play();
      }
    });
    
    // Mute when exiting fullscreen
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        video.muted = true;
      }
    });
    
    document.addEventListener('webkitfullscreenchange', () => {
      if (!document.webkitFullscreenElement) {
        video.muted = true;
      }
    });
    
    // Pause when not visible (performance)
    new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.25 }).observe(video);
  });
}

// ============================================
// BUTTON RIPPLE EFFECT
// ============================================

function initRippleEffect() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top = (e.clientY - rect.top) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

// ============================================
// SMOOTH SCROLL
// ============================================

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const headerHeight = document.querySelector('.header')?.offsetHeight || 0;

      window.scrollTo({
        top: target.offsetTop - headerHeight,
        behavior: 'smooth'
      });
    });
  });
}

// ============================================
// COUNTER ANIMATION
// ============================================

function initCounterAnimation() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        animateNumber(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-number').forEach(el => observer.observe(el));
}

function animateNumber(el) {
  const original = el.textContent;
  const match = original.match(/[\d.,]+/);
  if (!match) return;

  // No Brasil: ponto é milhar, vírgula é decimal
  // Remove pontos (separador de milhar) e converte vírgula para ponto (decimal)
  const numStr = match[0].replace(/\./g, '').replace(',', '.');
  const target = parseFloat(numStr);
  const suffix = original.replace(match[0], '');
  const start = performance.now();
  const duration = 2000;

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(target * eased).toLocaleString('pt-BR') + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = original;
    }
  }

  requestAnimationFrame(update);
}

// ============================================
// WATER DROP HOVER
// ============================================

function initWaterDrop() {
  document.querySelectorAll('[data-water-drop]').forEach(el => {
    el.addEventListener('mouseenter', () => el.classList.add('dripping'));
    el.addEventListener('animationend', () => el.classList.remove('dripping'));
  });
}

// Console welcome
console.log('%c🌿 APA do Encantado', 'color:#4a9960;font-size:24px;font-weight:bold');
console.log('%cÁrea de Proteção Ambiental • Goiás, Brasil', 'color:#666;font-size:14px');
