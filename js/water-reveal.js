/**
 * APA DO ENCANTADO - Simple Lightbox Gallery
 * Clean lightbox without effects that break images
 * Supports all content images on the page (excludes icons, logos, symbols)
 */

class GalleryLightbox {
  constructor() {
    this.lightbox = null;
    this.currentIndex = 0;
    this.galleryImages = [];
    this.imageElements = [];
    this.init();
  }

  init() {
    this.collectAllImages();
    this.createLightbox();
    this.bindEvents();
  }

  /**
   * Determines if an image should be excluded from the lightbox
   * Excludes: icons, logos, symbols, very small images, decorative images
   */
  shouldExcludeImage(img) {
    // Exclude images inside header/logo
    if (img.closest('.header') || img.closest('.logo') || img.closest('.nav')) {
      return true;
    }

    // Exclude images with specific classes that indicate icons/symbols
    const excludeClasses = ['icon', 'logo', 'symbol', 'emoji', 'avatar', 'badge'];
    if (excludeClasses.some(cls => img.classList.contains(cls) || img.closest(`.${cls}`))) {
      return true;
    }

    // Exclude very small images (likely icons) - check natural or display size
    const width = img.naturalWidth || img.width || img.offsetWidth;
    const height = img.naturalHeight || img.height || img.offsetHeight;
    if (width > 0 && height > 0 && (width < 100 || height < 100)) {
      return true;
    }

    // Exclude SVGs (usually icons)
    if (img.src && (img.src.endsWith('.svg') || img.src.includes('data:image/svg'))) {
      return true;
    }

    // Exclude images with aria-hidden or role="presentation"
    if (img.getAttribute('aria-hidden') === 'true' || img.getAttribute('role') === 'presentation') {
      return true;
    }

    // Exclude images marked with data-no-lightbox
    if (img.hasAttribute('data-no-lightbox')) {
      return true;
    }

    return false;
  }

  /**
   * Gets caption info from an image based on its context
   */
  getCaptionInfo(img) {
    let title = '';
    let desc = '';

    // Check for gallery-caption
    const galleryCaption = img.closest('.gallery-item')?.querySelector('.gallery-caption');
    if (galleryCaption) {
      title = galleryCaption.querySelector('h4')?.textContent || '';
      desc = galleryCaption.querySelector('p')?.textContent || '';
    }

    // Check for attraction-content
    const attractionContent = img.closest('.attraction-card')?.querySelector('.attraction-content');
    if (attractionContent && !title) {
      title = attractionContent.querySelector('h3')?.textContent || '';
      desc = attractionContent.querySelector('p')?.textContent || '';
    }

    // Check for featured-content
    const featuredContent = img.closest('.featured-attraction')?.querySelector('.featured-content');
    if (featuredContent && !title) {
      title = featuredContent.querySelector('h3')?.textContent || '';
      desc = featuredContent.querySelector('p')?.textContent || '';
    }

    // Check for activity-content
    const activityContent = img.closest('.activity-card')?.querySelector('.activity-content');
    if (activityContent && !title) {
      title = activityContent.querySelector('h3')?.textContent || '';
      desc = activityContent.querySelector('p')?.textContent || '';
    }

    // Check for image-break-content (blockquote)
    const breakContent = img.closest('.image-break')?.querySelector('.image-break-content blockquote');
    if (breakContent && !title) {
      title = breakContent.textContent?.trim() || '';
    }

    // Fallback to alt text
    if (!title && img.alt) {
      title = img.alt;
    }

    return { title, desc };
  }

  collectAllImages() {
    // Get all images on the page
    const allImages = document.querySelectorAll('img');

    allImages.forEach((img) => {
      // Skip excluded images
      if (this.shouldExcludeImage(img)) {
        return;
      }

      const captionInfo = this.getCaptionInfo(img);

      this.galleryImages.push({
        src: img.src,
        alt: img.alt,
        title: captionInfo.title,
        desc: captionInfo.desc
      });

      this.imageElements.push(img);
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
      <div class="lightbox-caption">
        <h3></h3>
        <p></p>
      </div>
      <div class="lightbox-content">
        <img src="" alt="" />
      </div>
    `;
    document.body.appendChild(this.lightbox);
  }

  bindEvents() {
    // Make all collected images clickable
    this.imageElements.forEach((img, index) => {
      // Add cursor and visual hint
      img.style.cursor = 'zoom-in';
      
      // Find the clickable wrapper (gallery-item, water-reveal-image, etc.) or use image itself
      const clickTarget = img.closest('.gallery-item') || 
                          img.closest('.water-reveal-image') || 
                          img.closest('.attraction-image') ||
                          img.closest('.activity-image') ||
                          img.closest('.featured-image') ||
                          img.closest('.about-image') ||
                          img.closest('.image-break-wrapper') ||
                          img;

      clickTarget.style.cursor = 'zoom-in';
      
      clickTarget.addEventListener('click', (e) => {
        // Prevent if clicking on a link inside the container
        if (e.target.closest('a:not([href^="#"])')) return;
        
        e.preventDefault();
        e.stopPropagation();
        this.open(index);
      });
    });

    // Close button
    this.lightbox.querySelector('.lightbox-close').addEventListener('click', () => {
      this.close();
    });

    // Navigation
    this.lightbox.querySelector('.lightbox-nav.prev').addEventListener('click', (e) => {
      e.stopPropagation();
      this.prev();
    });

    this.lightbox.querySelector('.lightbox-nav.next').addEventListener('click', (e) => {
      e.stopPropagation();
      this.next();
    });

    // Close on backdrop click
    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox) {
        this.close();
      }
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (!this.lightbox.classList.contains('active')) return;

      switch(e.key) {
        case 'Escape': this.close(); break;
        case 'ArrowLeft': this.prev(); break;
        case 'ArrowRight': this.next(); break;
      }
    });

    // Touch swipe
    let touchStartX = 0;
    this.lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.lightbox.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? this.next() : this.prev();
      }
    }, { passive: true });
  }

  open(index) {
    this.currentIndex = index;
    this.showImage();
    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  showImage() {
    const item = this.galleryImages[this.currentIndex];
    if (!item) return;

    const img = this.lightbox.querySelector('.lightbox-content img');
    const caption = this.lightbox.querySelector('.lightbox-caption');
    const counter = this.lightbox.querySelector('.lightbox-counter');

    img.src = item.src;
    img.alt = item.alt;

    // Update counter
    counter.textContent = `${this.currentIndex + 1}/${this.galleryImages.length}`;

    caption.querySelector('h3').textContent = item.title;
    caption.querySelector('p').textContent = item.desc;
    caption.style.display = (item.title || item.desc) ? 'block' : 'none';
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
    this.showImage();
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.galleryImages.length;
    this.showImage();
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new GalleryLightbox();
});
