/**
 * APA DO ENCANTADO - Simple Lightbox Gallery
 * Clean lightbox without effects that break images
 */

class GalleryLightbox {
  constructor() {
    this.lightbox = null;
    this.currentIndex = 0;
    this.galleryImages = [];
    this.init();
  }

  init() {
    this.collectGalleryImages();
    this.createLightbox();
    this.bindEvents();
  }

  collectGalleryImages() {
    document.querySelectorAll('.gallery-item').forEach((item, index) => {
      const img = item.querySelector('img');
      const caption = item.querySelector('.gallery-caption');

      if (img) {
        this.galleryImages.push({
          src: img.src,
          alt: img.alt,
          title: caption?.querySelector('h4')?.textContent || '',
          desc: caption?.querySelector('p')?.textContent || ''
        });
      }
    });
  }

  createLightbox() {
    this.lightbox = document.createElement('div');
    this.lightbox.className = 'lightbox';
    this.lightbox.innerHTML = `
      <button class="lightbox-close" aria-label="Fechar"></button>
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
    // Gallery clicks
    document.querySelectorAll('.gallery-item').forEach((item, index) => {
      item.style.cursor = 'pointer';
      item.addEventListener('click', (e) => {
        e.preventDefault();
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

    img.src = item.src;
    img.alt = item.alt;

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
