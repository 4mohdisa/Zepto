'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current viewport is mobile-sized
 * @param breakpoint - The width in pixels below which is considered mobile (default: 768px)
 * @returns boolean indicating if the current viewport is mobile-sized
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Function to check if current window width is below the breakpoint
    const checkMobile = (): void => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Check on mount
    checkMobile();

    // Set up event listener for resize events
    window.addEventListener('resize', checkMobile);

    // Clean up event listener
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [breakpoint]);

  return isMobile;
}
