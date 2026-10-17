import { useEffect, useRef } from 'react';

const VantaDots = ({ enabled = true }) => {
  const containerRef = useRef(null);
  const vantaEffectRef = useRef(null);
  const mouseMoveTimeoutRef = useRef(null);
  const handleMouseMoveRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    // Check if scripts are already loaded (they should be from index.html)
    const waitForVanta = () => {
      return new Promise((resolve, reject) => {
        // Check if scripts are already loaded
        if (window.THREE && window.VANTA && window.VANTA.DOTS) {
          resolve();
          return;
        }

        // Wait for scripts to load (they're in index.html)
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.THREE && window.VANTA && window.VANTA.DOTS) {
            clearInterval(checkInterval);
            resolve();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            reject(new Error('Vanta.js scripts failed to load. Make sure scripts are in index.html'));
          }
        }, 100);
      });
    };

    // Mouse move handler
    const handleMouseMove = () => {
      if (!containerRef.current) return;

      // Clear existing timeout
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }

      // Show effect when mouse moves
      containerRef.current.style.opacity = '1';
      containerRef.current.style.transition = 'opacity 0.3s ease-in';

      // Hide effect when mouse stops (after 0.8 seconds)
      mouseMoveTimeoutRef.current = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.opacity = '0';
          containerRef.current.style.transition = 'opacity 0.8s ease-out';
        }
      }, 800);
    };

    handleMouseMoveRef.current = handleMouseMove;

    // Initialize Vanta effect
    const initVanta = async () => {
      try {
        // Wait for container to be available
        if (!containerRef.current) {
          setTimeout(initVanta, 100);
          return;
        }

        await waitForVanta();
        
        if (!containerRef.current || !window.VANTA || !window.VANTA.DOTS) {
          console.error('Vanta DOTS not available');
          return;
        }

        // Clean up existing effect
        if (vantaEffectRef.current) {
          try {
            vantaEffectRef.current.destroy();
          } catch (e) {
            console.warn('Error destroying previous effect:', e);
          }
        }

        // Create Vanta DOTS effect - Antigravity Editor style
        vantaEffectRef.current = window.VANTA.DOTS({
          el: containerRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: 0x4c8df5, // Soft blue color matching Antigravity
          color2: 0x4c8df5,
          backgroundColor: 0x000000, // Black background
          backgroundAlpha: 0, // Fully transparent (no background tint)
          size: 1.00, // Small dots (1px)
          spacing: 30.00, // Clean spacing between dots (30px)
          showLines: false, // No connecting lines - clean minimal look
          quantity: 4.00, // Moderate quantity for clean spacing
        });

        // Initial state: hidden
        containerRef.current.style.opacity = '0';

        // Add mouse move listener
        window.addEventListener('mousemove', handleMouseMove);
      } catch (error) {
        console.error('Failed to initialize Vanta DOTS:', error);
      }
    };

    // Start initialization
    initVanta();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveRef.current);
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }
      if (vantaEffectRef.current) {
        try {
          vantaEffectRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying Vanta effect:', e);
        }
        vantaEffectRef.current = null;
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        minWidth: '100vw',
        minHeight: '100vh',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0,
        transition: 'opacity 0.3s ease-in',
      }}
    />
  );
};

export default VantaDots;

