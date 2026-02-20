/**
 * APA DO ENCANTADO - Lightbox Gallery
 * Simple, clean lightbox for content images
 */

class Lightbox {
  constructor() {
    this.images = [];
    this.elements = [];
    this.currentIndex = 0;
    this.lightbox = null;
    this.init();
  }

  init() {
    this.collectImages();
    this.createLightbox();
    this.bindEvents();
  }

  isExcluded(img) {
    // Exclude header, logo, nav images
    if (img.closest('.header, .logo, .nav')) return true;

    // Exclude small images (icons)
    const size = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
    if (size > 0 && size < 100) return true;

    // Exclude SVGs and marked images
    if (img.src?.includes('.svg') || img.hasAttribute('data-no-lightbox')) return true;

    return false;
  }

  getCaption(img) {
    const container = img.closest('.gallery-item, .attraction-card, .featured-attraction, .activity-card, .image-break');
    if (!container) return { title: img.alt || '', desc: '' };

    const h = container.querySelector('h3, h4');
    const p = container.querySelector('p, blockquote');

    return {
      title: h?.textContent || img.alt || '',
      desc: p?.textContent || ''
    };
  }

  collectImages() {
    document.querySelectorAll('img').forEach(img => {
      if (this.isExcluded(img)) return;

      const caption = this.getCaption(img);
      this.images.push({ src: img.src, alt: img.alt, ...caption });
      this.elements.push(img);
    });
  }

  createLightbox() {
    this.lightbox = document.createElement('div');
    this.lightbox.className = 'lightbox';
    this.lightbox.innerHTML = `
      <button class="lightbox-close" aria-label="Fechar"></button>
      <span class="lightbox-counter">1/1</span>
      <button class="lightbox-nav prev" aria-label="Anterior">‹</button>
      <button class="lightbox-nav next" aria-label="Próxima">›</button>
      <div class="lightbox-caption"><h3></h3><p></p></div>
      <div class="lightbox-content">
        <img src="" alt="" class="lightbox-img">
        <div class="lightbox-loading" aria-hidden="true" role="status">
          <div class="lightbox-spinner" aria-hidden="true"></div>
          <img src="assets/images/logo-apa-do-encantado.svg" alt="Logo APA do Encantado" class="lightbox-loading-logo" aria-hidden="true">
        </div>
      </div>
    `;
    document.body.appendChild(this.lightbox);
  }

  bindEvents() {
    // Click on images
    this.elements.forEach((img, i) => {
      const target = img.closest('.gallery-item, .water-reveal-image, .attraction-image, .activity-image, .featured-image, .about-image, .image-break-wrapper') || img;
      target.style.cursor = 'zoom-in';
      target.addEventListener('click', e => {
        if (e.target.closest('a:not([href^="#"])')) return;
        e.preventDefault();
        this.open(i);
      });
    });

    // Controls
    this.lightbox.querySelector('.lightbox-close').onclick = () => this.close();
    this.lightbox.querySelector('.prev').onclick = e => { e.stopPropagation(); this.navigate(-1); };
    this.lightbox.querySelector('.next').onclick = e => { e.stopPropagation(); this.navigate(1); };
    this.lightbox.onclick = e => { if (e.target === this.lightbox) this.close(); };

    // Keyboard
    document.addEventListener('keydown', e => {
      if (!this.lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.navigate(-1);
      if (e.key === 'ArrowRight') this.navigate(1);
    });

    // Touch handling - swipe navigation that doesn't interfere with pinch-to-zoom
    this.setupTouchNavigation();
  }

  setupTouchNavigation() {
    const content = this.lightbox.querySelector('.lightbox-content');
    let startX = 0;
    let startY = 0;
    let isPinching = false;
    let touchCount = 0;
    let hasMoved = false;

    // Detect if device supports touch (mobile)
    const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    content.addEventListener('touchstart', e => {
      touchCount = e.touches.length;
      isPinching = touchCount >= 2;
      hasMoved = false;

      if (touchCount === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    }, { passive: true });

    content.addEventListener('touchmove', e => {
      // If more than 1 finger, it's a pinch gesture
      if (e.touches.length >= 2) {
        isPinching = true;
      }
      hasMoved = true;
    }, { passive: true });

    content.addEventListener('touchend', e => {
      // Don't navigate if user was pinching (zooming)
      if (isPinching) {
        isPinching = false;
        touchCount = 0;
        return;
      }

      // Only process single-finger swipes
      if (touchCount !== 1) {
        touchCount = 0;
        return;
      }

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;

      // Require horizontal movement to be greater than vertical (intentional swipe)
      // and minimum threshold of 60px to avoid accidental triggers
      if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        this.navigate(diffX > 0 ? 1 : -1);
      }

      touchCount = 0;
    }, { passive: true });

    // Tap zones for mobile navigation (left/right edges)
    content.addEventListener('click', e => {
      if (!isTouchDevice()) return;

      // Don't navigate if user moved (was swiping or zooming)
      if (hasMoved) return;

      const rect = content.getBoundingClientRect();
      const tapX = e.clientX - rect.left;
      const tapZoneWidth = 60; // ~width of a thumb

      // Tap on left edge - go to previous
      if (tapX <= tapZoneWidth) {
        e.stopPropagation();
        this.navigate(-1);
        return;
      }

      // Tap on right edge - go to next
      if (tapX >= rect.width - tapZoneWidth) {
        e.stopPropagation();
        this.navigate(1);
        return;
      }
    });
  }

  open(index) {
    this.currentIndex = index;
    this.show();
    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  navigate(dir) {
    this.currentIndex = (this.currentIndex + dir + this.images.length) % this.images.length;
    this.show();
  }

  show() {
    const item = this.images[this.currentIndex];
    const imgEl = this.lightbox.querySelector('.lightbox-img');
    const caption = this.lightbox.querySelector('.lightbox-caption');
    const counter = this.lightbox.querySelector('.lightbox-counter');
    const loading = this.lightbox.querySelector('.lightbox-loading');

    // update counter immediately
    counter.textContent = `${this.currentIndex + 1}/${this.images.length}`;

    // hide caption while we load the new image to avoid showing stale title
    caption.style.display = 'none';
    loading.style.display = 'flex';
    imgEl.classList.add('hidden');

    // Cancel any previous loader
    if (this.currentLoader) {
      this.currentLoader.onload = null;
      this.currentLoader.onerror = null;
      this.currentLoader = null;
    }

    // Use a load id to ignore stale loads when navigating quickly
    const loadId = (this._loadId = (this._loadId || 0) + 1);

    const loader = new Image();
    this.currentLoader = loader;

    loader.onload = () => {
      // ignore if another load started
      if (loadId !== this._loadId) return;
      imgEl.src = item.src;
      imgEl.alt = item.alt || '';

      caption.querySelector('h3').textContent = item.title || '';
      caption.querySelector('p').textContent = item.desc || '';
      caption.style.display = item.title || item.desc ? 'block' : 'none';

      loading.style.display = 'none';
      imgEl.classList.remove('hidden');
      this.currentLoader = null;
    };

    loader.onerror = () => {
      if (loadId !== this._loadId) return;
      loading.style.display = 'none';
      caption.querySelector('h3').textContent = 'Erro ao carregar a imagem';
      caption.querySelector('p').textContent = '';
      caption.style.display = 'block';
      imgEl.classList.remove('hidden');
      imgEl.src = '';
      this.currentLoader = null;
    };

    // Start loading after handlers are set
    loader.src = item.src;
  }
}

document.addEventListener('DOMContentLoaded', () => new Lightbox());
