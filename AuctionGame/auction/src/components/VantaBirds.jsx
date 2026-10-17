import { useEffect, useRef } from 'react';

const VantaBirds = ({ enabled = true }) => {
  const containerRef = useRef(null);
  const vantaEffectRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const checkIntervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const setVanta = () => {
      if (!containerRef.current) {
        // Retry after a short delay if container not ready
        retryTimeoutRef.current = setTimeout(setVanta, 100);
        return;
      }

      // Clean up existing effect
      if (vantaEffectRef.current) {
        try {
          vantaEffectRef.current.destroy();
        } catch (e) {
          // Silently fail - don't block rendering
        }
        vantaEffectRef.current = null;
      }

      // Wait for VANTA to be available
      if (window.VANTA && window.VANTA.BIRDS) {
        try {
          vantaEffectRef.current = window.VANTA.BIRDS({
            el: containerRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            backgroundColor: 0x000000,
            backgroundAlpha: 0, // Transparent background
          });
        } catch (e) {
          // Silently fail - don't block rendering
        }
      }
    };

    // Wait for scripts to load, then initialize
    const initVanta = () => {
      if (window.THREE && window.VANTA && window.VANTA.BIRDS) {
        setVanta();
      } else {
        // Check every 100ms for up to 5 seconds
        let attempts = 0;
        const maxAttempts = 50;
        checkIntervalRef.current = setInterval(() => {
          attempts++;
          if (window.THREE && window.VANTA && window.VANTA.BIRDS) {
            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
              checkIntervalRef.current = null;
            }
            setVanta();
          } else if (attempts >= maxAttempts) {
            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
              checkIntervalRef.current = null;
            }
            // Silently fail - don't block rendering
          }
        }, 100);
      }
    };

    // Start initialization after a small delay to ensure DOM is ready
    const initTimeout = setTimeout(initVanta, 100);

    // Cleanup on unmount
    return () => {
      if (initTimeout) clearTimeout(initTimeout);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      if (vantaEffectRef.current) {
        try {
          vantaEffectRef.current.destroy();
        } catch (e) {
          // Silently fail
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
        zIndex: 0,
        backgroundColor: 'transparent',
      }}
    />
  );
};

export default VantaBirds;

