/**
 * APA DO ENCANTADO - Water Effects
 * WebGL-inspired water droplet effects using Canvas 2D
 * Triggers on scroll to create immersive nature experience
 */

class WaterEffects {
  constructor() {
    this.canvas = document.getElementById('water-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.droplets = [];
    this.ripples = [];
    this.lastScrollY = 0;
    this.scrollVelocity = 0;
    this.isScrolling = false;
    this.scrollTimeout = null;
    this.animationFrame = null;
    this.isRunning = false;
    
    // Configuration
    this.config = {
      maxDroplets: 50,
      dropletSpawnRate: 0.3, // Probability per frame while scrolling
      minDropletSize: 3,
      maxDropletSize: 12,
      gravity: 0.15,
      friction: 0.99,
      rippleMaxRadius: 60,
      rippleSpeed: 2,
      colors: {
        droplet: [
          'rgba(93, 173, 226, 0.7)',
          'rgba(133, 193, 233, 0.6)',
          'rgba(174, 214, 241, 0.5)',
          'rgba(107, 179, 120, 0.5)'
        ],
        ripple: 'rgba(93, 173, 226, 0.3)'
      }
    };
    
    this.init();
  }
  
  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    
    // Start animation loop
    this.isRunning = true;
    this.animate();
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  handleScroll() {
    const currentScrollY = window.scrollY;
    this.scrollVelocity = Math.abs(currentScrollY - this.lastScrollY);
    this.lastScrollY = currentScrollY;
    this.isScrolling = true;
    
    // Spawn droplets based on scroll velocity
    if (this.scrollVelocity > 5) {
      const spawnCount = Math.min(Math.floor(this.scrollVelocity / 10), 5);
      for (let i = 0; i < spawnCount; i++) {
        if (Math.random() < this.config.dropletSpawnRate) {
          this.spawnDroplet();
        }
      }
    }
    
    // Reset scrolling flag after delay
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
    }, 150);
  }
  
  spawnDroplet() {
    if (this.droplets.length >= this.config.maxDroplets) return;
    
    const size = this.config.minDropletSize + 
                 Math.random() * (this.config.maxDropletSize - this.config.minDropletSize);
    
    // Spawn from top of viewport with random x position
    const droplet = {
      x: Math.random() * this.canvas.width,
      y: -20,
      size: size,
      velocityX: (Math.random() - 0.5) * 2,
      velocityY: Math.random() * 2 + 1,
      opacity: 0.6 + Math.random() * 0.4,
      color: this.config.colors.droplet[
        Math.floor(Math.random() * this.config.colors.droplet.length)
      ],
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.05 + Math.random() * 0.05
    };
    
    this.droplets.push(droplet);
  }
  
  spawnRipple(x, y) {
    const ripple = {
      x: x,
      y: y,
      radius: 5,
      maxRadius: this.config.rippleMaxRadius * (0.5 + Math.random() * 0.5),
      opacity: 0.5,
      speed: this.config.rippleSpeed
    };
    
    this.ripples.push(ripple);
  }
  
  updateDroplets() {
    for (let i = this.droplets.length - 1; i >= 0; i--) {
      const droplet = this.droplets[i];
      
      // Apply gravity
      droplet.velocityY += this.config.gravity;
      
      // Apply wobble
      droplet.wobble += droplet.wobbleSpeed;
      droplet.velocityX += Math.sin(droplet.wobble) * 0.1;
      
      // Apply friction
      droplet.velocityX *= this.config.friction;
      
      // Update position
      droplet.x += droplet.velocityX;
      droplet.y += droplet.velocityY;
      
      // Check if droplet hits bottom or goes off screen
      if (droplet.y > this.canvas.height + 20) {
        // Create ripple effect at impact point
        if (droplet.y <= this.canvas.height + 50) {
          this.spawnRipple(droplet.x, this.canvas.height - 10);
        }
        this.droplets.splice(i, 1);
      }
      
      // Remove if off screen horizontally
      if (droplet.x < -50 || droplet.x > this.canvas.width + 50) {
        this.droplets.splice(i, 1);
      }
    }
  }
  
  updateRipples() {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const ripple = this.ripples[i];
      
      ripple.radius += ripple.speed;
      ripple.opacity -= 0.015;
      
      if (ripple.opacity <= 0 || ripple.radius >= ripple.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }
  }
  
  drawDroplet(droplet) {
    const { x, y, size, color, opacity } = droplet;
    
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    
    // Draw water droplet shape
    this.ctx.beginPath();
    
    // Teardrop shape
    this.ctx.moveTo(x, y - size * 1.5);
    this.ctx.bezierCurveTo(
      x + size, y - size * 0.5,
      x + size, y + size * 0.5,
      x, y + size
    );
    this.ctx.bezierCurveTo(
      x - size, y + size * 0.5,
      x - size, y - size * 0.5,
      x, y - size * 1.5
    );
    
    // Gradient fill
    const gradient = this.ctx.createRadialGradient(
      x - size * 0.3, y - size * 0.3, 0,
      x, y, size * 1.5
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.3, color);
    gradient.addColorStop(1, 'rgba(93, 173, 226, 0.2)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // Highlight
    this.ctx.beginPath();
    this.ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.25, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fill();
    
    this.ctx.restore();
  }
  
  drawRipple(ripple) {
    const { x, y, radius, opacity } = ripple;
    
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    
    // Draw concentric circles
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = this.config.colors.ripple;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Inner ripple
    if (radius > 10) {
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
      this.ctx.globalAlpha = opacity * 0.5;
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }
  
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw ripples first (behind droplets)
    for (const ripple of this.ripples) {
      this.drawRipple(ripple);
    }
    
    // Draw droplets
    for (const droplet of this.droplets) {
      this.drawDroplet(droplet);
    }
  }
  
  animate() {
    if (!this.isRunning) return;
    
    this.updateDroplets();
    this.updateRipples();
    this.render();
    
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }
  
  // Spawn droplets on specific elements (for hover effects)
  spawnOnElement(element) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + Math.random() * rect.width;
    const y = rect.top;
    
    const droplet = {
      x: x,
      y: y,
      size: 6 + Math.random() * 4,
      velocityX: (Math.random() - 0.5) * 1,
      velocityY: 2 + Math.random() * 2,
      opacity: 0.7,
      color: this.config.colors.droplet[0],
      wobble: 0,
      wobbleSpeed: 0.08
    };
    
    this.droplets.push(droplet);
  }
  
  destroy() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('scroll', this.handleScroll);
  }
}

// Initialize water effects when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.waterEffects = new WaterEffects();
  
  // Add hover effects to elements with data-water-drop attribute
  const waterDropElements = document.querySelectorAll('[data-water-drop]');
  waterDropElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
      // Spawn a few droplets when hovering
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          window.waterEffects.spawnOnElement(element);
        }, i * 100);
      }
    });
  });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WaterEffects;
}
