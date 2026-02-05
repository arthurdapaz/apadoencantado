/**
 * APA DO ENCANTADO - Water Droplets Effect
 * Canvas-based water drops on scroll
 */

class WaterDroplets {
  constructor(canvasId = 'water-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    this.droplets = [];
    this.ripples = [];
    this.lastScrollY = 0;
    this.isScrolling = false;
    
    this.colors = [
      'rgba(93, 173, 226, 0.7)',
      'rgba(133, 193, 233, 0.6)',
      'rgba(174, 214, 241, 0.5)',
      'rgba(107, 179, 120, 0.5)'
    ];
    
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  onScroll() {
    const velocity = Math.abs(window.scrollY - this.lastScrollY);
    this.lastScrollY = window.scrollY;
    
    if (velocity > 5) {
      const count = Math.min(Math.floor(velocity / 10), 5);
      for (let i = 0; i < count; i++) {
        if (Math.random() < 0.3) this.spawnDroplet();
      }
    }
  }

  spawnDroplet() {
    if (this.droplets.length >= 50) return;
    
    const size = 3 + Math.random() * 9;
    this.droplets.push({
      x: Math.random() * this.canvas.width,
      y: -20,
      size,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 2 + 1,
      opacity: 0.6 + Math.random() * 0.4,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      wobble: Math.random() * Math.PI * 2
    });
  }

  spawnRipple(x, y) {
    this.ripples.push({
      x, y,
      radius: 5,
      maxRadius: 30 + Math.random() * 30,
      opacity: 0.5
    });
  }

  update() {
    // Update droplets
    for (let i = this.droplets.length - 1; i >= 0; i--) {
      const d = this.droplets[i];
      
      d.vy += 0.15; // gravity
      d.wobble += 0.06;
      d.vx += Math.sin(d.wobble) * 0.1;
      d.vx *= 0.99; // friction
      
      d.x += d.vx;
      d.y += d.vy;
      
      // Hit bottom
      if (d.y > this.canvas.height + 20) {
        if (d.y <= this.canvas.height + 50) {
          this.spawnRipple(d.x, this.canvas.height - 10);
        }
        this.droplets.splice(i, 1);
      } else if (d.x < -50 || d.x > this.canvas.width + 50) {
        this.droplets.splice(i, 1);
      }
    }

    // Update ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += 2;
      r.opacity -= 0.015;
      
      if (r.opacity <= 0 || r.radius >= r.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }
  }

  drawDroplet(d) {
    this.ctx.save();
    this.ctx.globalAlpha = d.opacity;
    
    // Teardrop shape
    this.ctx.beginPath();
    this.ctx.moveTo(d.x, d.y - d.size * 1.5);
    this.ctx.bezierCurveTo(
      d.x + d.size, d.y - d.size * 0.5,
      d.x + d.size, d.y + d.size * 0.5,
      d.x, d.y + d.size
    );
    this.ctx.bezierCurveTo(
      d.x - d.size, d.y + d.size * 0.5,
      d.x - d.size, d.y - d.size * 0.5,
      d.x, d.y - d.size * 1.5
    );
    
    const grad = this.ctx.createRadialGradient(
      d.x - d.size * 0.3, d.y - d.size * 0.3, 0,
      d.x, d.y, d.size * 1.5
    );
    grad.addColorStop(0, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.3, d.color);
    grad.addColorStop(1, 'rgba(93,173,226,0.2)');
    
    this.ctx.fillStyle = grad;
    this.ctx.fill();
    
    // Highlight
    this.ctx.beginPath();
    this.ctx.arc(d.x - d.size * 0.3, d.y - d.size * 0.3, d.size * 0.25, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
    this.ctx.fill();
    
    this.ctx.restore();
  }

  drawRipple(r) {
    this.ctx.save();
    this.ctx.globalAlpha = r.opacity;
    this.ctx.strokeStyle = 'rgba(93,173,226,0.3)';
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    if (r.radius > 10) {
      this.ctx.globalAlpha = r.opacity * 0.5;
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius * 0.6, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ripples.forEach(r => this.drawRipple(r));
    this.droplets.forEach(d => this.drawDroplet(d));
  }

  animate() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.animate());
  }
}

document.addEventListener('DOMContentLoaded', () => new WaterDroplets());
