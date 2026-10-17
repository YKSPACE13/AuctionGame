import { useEffect, useRef } from 'react';

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 1; // Fixed 1px size
    this.alpha = 0.25 + Math.random() * 0.05; // 20-30% opacity (0.2-0.3)
    this.vx = (Math.random() - 0.5) * 0.08; // Very subtle drift (almost still)
    this.vy = (Math.random() - 0.5) * 0.08;
    // Fast fade: 0.5-1s at 60fps = 30-60 frames, so fadeSpeed = 1/30 to 1/60
    this.fadeSpeed = (1 / (30 + Math.random() * 30)); // 0.5-1s fade
    this.maxAlpha = this.alpha;
  }

  update() {
    // Very subtle drift movement
    this.x += this.vx;
    this.y += this.vy;
    
    // Fade out
    this.alpha -= this.fadeSpeed;
    
    // Return true if particle is still visible
    return this.alpha > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = '#4c8df5';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const ParticleCursor = ({ enabled = true, debug = false }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const mouseMoveTimeoutRef = useRef(null);
  const isMouseMovingRef = useRef(false);

  // Check minimum distance from existing particles
  const checkMinDistance = (x, y, minDistance = 30) => {
    for (const particle of particlesRef.current) {
      const dx = particle.x - x;
      const dy = particle.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < minDistance) {
        return false; // Too close to existing particle
      }
    }
    return true; // Safe to spawn
  };

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    // Mouse move handler - sparse, scattered dots
    const handleMouseMove = (e) => {
      // Clear existing timeout
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }
      
      // Mark as moving
      isMouseMovingRef.current = true;
      
      // Generate 2-4 sparse particles per movement (very sparse)
      const particleCount = Math.floor(Math.random() * 3) + 2; // 2-4 particles
      
      let attempts = 0;
      let spawned = 0;
      const maxAttempts = 20; // Limit attempts to prevent infinite loop
      
      while (spawned < particleCount && attempts < maxAttempts) {
        attempts++;
        // Random scattering - wider range, not grouped
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 60 + 20; // 20-80px from cursor (sparse)
        const x = e.clientX + Math.cos(angle) * distance;
        const y = e.clientY + Math.sin(angle) * distance;
        
        // Check minimum distance before spawning (30px minimum)
        if (checkMinDistance(x, y, 30)) {
          particlesRef.current.push(new Particle(x, y));
          spawned++;
        }
      }
      
      // Set timeout to detect when mouse stops
      mouseMoveTimeoutRef.current = setTimeout(() => {
        isMouseMovingRef.current = false;
      }, 50);
    };

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Debug: Show particle count
      if (debug) {
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.fillText(`Particles: ${particlesRef.current.length}`, 10, 20);
      }
      
      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        const isAlive = particle.update();
        if (isAlive) {
          particle.draw(ctx);
        }
        return isAlive;
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resizeCanvas);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};

export default ParticleCursor;

