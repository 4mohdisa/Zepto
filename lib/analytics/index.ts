/**
 * PostHog Analytics Utilities
 * Clean, type-safe analytics tracking
 */

import { posthog } from 'posthog-js'
import type { AnalyticsEvent } from './constants'

/**
 * Check if PostHog is available and initialized
 */
export function isAnalyticsAvailable(): boolean {
  return typeof window !== 'undefined' && 
         !!process.env.NEXT_PUBLIC_POSTHOG_KEY &&
         posthog.__loaded
}

/**
 * Track a product analytics event
 * 
 * @param event - The event name (use constants from ./constants)
 * @param properties - Safe properties to include (no sensitive data)
 */
export function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, any>
): void {
  if (!isAnalyticsAvailable()) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Analytics] ${event}`, properties)
    }
    return
  }

  // Sanitize properties to ensure no sensitive data
  const safeProperties = sanitizeProperties(properties)
  
  posthog.capture(event, safeProperties)
}

/**
 * Track a page view
 * 
 * @param pageName - The page identifier (e.g., 'dashboard', 'transactions')
 * @param properties - Additional safe properties
 */
export function trackPageView(
  pageName: string,
  properties?: Record<string, any>
): void {
  if (!isAnalyticsAvailable()) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Analytics] Page view: ${pageName}`, properties)
    }
    return
  }

  posthog.capture('$pageview', {
    page: pageName,
    route: window.location.pathname,
    ...sanitizeProperties(properties),
  })
}

/**
 * Track an action with timing information
 * 
 * @param event - The event name
 * @param durationMs - Duration in milliseconds
 * @param properties - Additional properties
 */
export function trackTimedAction(
  event: AnalyticsEvent,
  durationMs: number,
  properties?: Record<string, any>
): void {
  trackEvent(event, {
    ...properties,
    duration_ms: durationMs,
  })
}

/**
 * Track success/failure of an operation
 * 
 * @param event - Base event name
 * @param success - Whether the operation succeeded
 * @param properties - Additional properties
 */
export function trackResult(
  event: AnalyticsEvent,
  success: boolean,
  properties?: Record<string, any>
): void {
  trackEvent(event, {
    ...properties,
    success,
  })
}

/**
 * Sanitize properties to remove any potentially sensitive data
 */
function sanitizeProperties(props?: Record<string, any>): Record<string, any> | undefined {
  if (!props) return undefined

  const sensitiveKeys = [
    'amount',
    'balance',
    'price',
    'total',
    'value',
    'currency',
    'income',
    'expense',
    'description',
    'note',
    'notes',
    'csv',
    'rawData',
    'fileContent',
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'auth',
    'credential',
    'email',
    'phone',
    'address',
    'ssn',
    'credit_card',
    'creditcard',
    'diagnostics',
  ]

  const sanitized: Record<string, any> = {}

  for (const [key, value] of Object.entries(props)) {
    const lowerKey = key.toLowerCase()
    const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk))

    if (isSensitive) {
      // Skip sensitive properties entirely
      continue
    }

    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = sanitizeProperties(value)
      if (nested && Object.keys(nested).length > 0) {
        sanitized[key] = nested
      }
    } else {
      sanitized[key] = value
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined
}

// Re-export constants for convenience
export * from './constants'
