'use client'

/**
 * Custom hook for tracking page views
 * Prevents duplicate tracking in React Strict Mode
 */

import { useEffect, useRef } from 'react'
import { trackPageView } from '@/lib/analytics'

/**
 * Track a page view once per actual navigation
 * 
 * @param pageName - The page identifier for analytics
 * @param properties - Additional safe properties to track
 */
export function usePageView(
  pageName: string,
  properties?: Record<string, any>
): void {
  const trackedRef = useRef(false)

  useEffect(() => {
    // Prevent double-tracking in Strict Mode
    if (trackedRef.current) return
    
    trackedRef.current = true
    trackPageView(pageName, properties)

    // Reset tracking on unmount for actual navigation
    return () => {
      // Small delay to differentiate between Strict Mode remount and real unmount
      setTimeout(() => {
        trackedRef.current = false
      }, 100)
    }
  }, [pageName]) // Only re-track if pageName changes
}

/**
 * Hook for tracking when a specific action is performed
 * Only tracks once per mount cycle
 */
export function useTrackAction(
  action: () => void,
  deps: React.DependencyList = []
): void {
  const trackedRef = useRef(false)

  useEffect(() => {
    if (trackedRef.current) return
    
    trackedRef.current = true
    action()
  }, deps)
}
