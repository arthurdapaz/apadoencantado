/**
 * APA DO ENCANTADO - Main Script
 * Navigation, animations, and interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollAnimations();
  initVideoHandler();
  initProgressiveVideo();
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
  const options = { rootMargin: '0px 0px -100px 0px', threshold: 0.1 };

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
    '.slide-left', '.slide-right', '.scale-in',
    '.attractions-grid', '.activities-grid', '.fauna-grid', '.fauna-grid-images', '.about-stats'
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
// PROGRESSIVE VIDEO LOADING (4K Upgrade with Crossfade)
// ============================================

function initProgressiveVideo() {
  const video = document.getElementById('hero-video');
  if (!video) return;

  // Check for data attributes with HQ sources
  const hqWebm = video.dataset.hqWebm;
  const hqMp4 = video.dataset.hqMp4;
  
  if (!hqWebm && !hqMp4) return;

  // Don't upgrade on slow connections
  if (navigator.connection?.effectiveType?.includes('2g') || 
      navigator.connection?.effectiveType?.includes('3g')) {
    console.log('🎬 Progressive video: Skipping 4K on slow connection');
    return;
  }

  // Don't upgrade on mobile (save data)
  if (window.innerWidth < 769) {
    console.log('🎬 Progressive video: Skipping 4K on mobile');
    return;
  }

  // Start preload immediately (no delay for fast connections)
  const startPreload = () => {
    console.log('🎬 Progressive video: Starting 4K preload...');
    
    // Detect WebM support
    const supportsWebM = video.canPlayType('video/webm; codecs="vp9"') !== '';
    const hqSrc = supportsWebM && hqWebm ? hqWebm : hqMp4;
    
    if (!hqSrc) return;

    // Find the overlay (to insert 4K video before it)
    const wrapper = video.parentElement;
    const overlay = wrapper.querySelector('.hero-overlay');

    // Create 4K video element - will be placed between LQ and overlay
    const hqVideo = document.createElement('video');
    hqVideo.id = 'hero-video-4k';
    hqVideo.className = 'hero-video-hq';
    hqVideo.preload = 'auto';
    hqVideo.muted = true;
    hqVideo.playsInline = true;
    hqVideo.loop = true;
    hqVideo.setAttribute('playsinline', '');
    hqVideo.setAttribute('webkit-playsinline', '');
    
    // Style: ON TOP of LQ video, invisible initially
    Object.assign(hqVideo.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: '0',
      zIndex: '1',
      pointerEvents: 'none'
    });
    
    hqVideo.src = hqSrc;
    
    // Insert 4K video AFTER LQ but BEFORE overlay (inside wrapper)
    if (overlay) {
      wrapper.insertBefore(hqVideo, overlay);
    } else {
      // No overlay (like /historia page) - just append to wrapper
      wrapper.appendChild(hqVideo);
    }
    
    // Function to perform the crossfade
    const performCrossfade = () => {
      console.log('🎬 Progressive video: 4K ready, starting crossfade...');
      
      // Sync playback position precisely
      hqVideo.currentTime = video.currentTime;
      
      // Quick but smooth transition (800ms)
      hqVideo.style.transition = 'opacity 0.8s ease-out';
      
      // Fade IN the 4K only - LQ stays at opacity 1 underneath
      requestAnimationFrame(() => {
        hqVideo.style.opacity = '1';
      });
      
      // After transition completes, cleanup
      setTimeout(() => {
        // Now safe to remove LQ video (HQ is fully opaque on top)
        video.remove();
        
        // Update HQ video to take over
        hqVideo.id = 'hero-video';
        hqVideo.classList.remove('hero-video-hq');
        hqVideo.classList.add('loaded', 'hd-loaded');
        hqVideo.dataset.quality = '4k';
        hqVideo.style.zIndex = '0';
        hqVideo.style.transition = '';
        hqVideo.style.pointerEvents = '';
        
        console.log('🎬 Progressive video: ✅ Upgraded to 4K!');
      }, 1000); // 800ms transition + 200ms buffer
    };
    
    // Wait for 4K to be ready to play
    hqVideo.addEventListener('canplaythrough', () => {
      console.log('🎬 Progressive video: 4K canplaythrough');
      hqVideo.play().then(() => {
        // Sync time and crossfade immediately
        performCrossfade();
      }).catch(() => {});
    }, { once: true });
    
    // Start loading
    hqVideo.load();
  };

  // Start preloading as soon as LQ video starts playing
  if (video.readyState >= 3) {
    // Video already playing, start immediately
    startPreload();
  } else {
    video.addEventListener('playing', startPreload, { once: true });
  }
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
  const match = original.match(/[\d,.]+/);
  if (!match) return;

  const target = parseFloat(match[0].replace(/,/g, ''));
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
