// Lightweight, reusable slow constellation background
(() => {
  const canvas = document.getElementById('bg-net');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Ensure canvas fixed full-screen behind content
  const style = canvas.style;
  style.position = 'fixed';
  style.inset = '0';
  style.width = '100%';
  style.height = '100%';
  style.zIndex = '-1';
  style.pointerEvents = 'none';
  style.background = 'transparent';

  let devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.floor(width * devicePixelRatio);
    canvas.height = Math.floor(height * devicePixelRatio);
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Theme-aware colors (fallbacks)
  const getComputed = () => getComputedStyle(document.documentElement);
  function pickColor(varName, fallback) {
    const val = getComputed().getPropertyValue(varName).trim();
    return val || fallback;
  }

  const DOT_COLOR = pickColor('--bg-dot-color', 'rgba(255,255,255,0.6)');
  const LINE_COLOR = pickColor('--bg-line-color', 'rgba(255,255,255,0.15)');
  const BACKDROP_FADE = pickColor('--bg-fade', 'rgba(0,0,0,0)');

  // Density scales gently with screen size
  const BASE_DENSITY = 0.00008; // fewer dots
  function targetCount() {
    return Math.max(40, Math.floor(width * height * BASE_DENSITY));
  }

  const particles = [];
  function initParticles() {
    particles.length = 0;
    const count = targetCount();
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15, // slow
        vy: (Math.random() - 0.5) * 0.15,
        r: 1 + Math.random() * 1.2
      });
    }
  }
  initParticles();

  // Soft mouse influence for modern touch
  const mouse = { x: null, y: null };
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  function step() {
    ctx.clearRect(0, 0, width, height);
    if (BACKDROP_FADE) {
      ctx.fillStyle = BACKDROP_FADE;
      ctx.fillRect(0, 0, width, height);
    }

    // Draw lines first for layering under dots
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = 1;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Gentle drift
      p.x += p.vx;
      p.y += p.vy;

      // Boundaries: wrap for seamless motion
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;
    }

    // Connection logic with short radius for cleanliness
    const MAX_DIST = Math.min(140, Math.max(80, Math.hypot(width, height) * 0.06));
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < MAX_DIST * MAX_DIST) {
          const t = 1 - Math.sqrt(d2) / MAX_DIST;
          ctx.globalAlpha = t * 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    // Dots on top
    ctx.fillStyle = DOT_COLOR;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Soft attraction to mouse for a modern interactive feel
      if (mouse.x !== null) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy) || 1;
        const influence = Math.max(0, 1 - dist / 180) * 0.02;
        p.vx += (dx / dist) * influence;
        p.vy += (dy / dist) * influence;
        // Dampen velocity to keep motion slow and clean
        p.vx *= 0.985;
        p.vy *= 0.985;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(step);
  }

  // Reinitialize on resize to maintain density
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      initParticles();
    }, 150);
  });

  requestAnimationFrame(step);
})();


