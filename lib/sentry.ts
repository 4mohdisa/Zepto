// Sentry utility functions
// Wrapper around Sentry SDK for consistent error reporting

import * as Sentry from '@sentry/nextjs'

/**
 * Check if Sentry is initialized
 */
export function isSentryInitialized(): boolean {
  // Check if Sentry was initialized (has a current hub)
  try {
    const client = Sentry.getClient();
    return !!client;
  } catch {
    return false;
  }
}

/**
 * Capture an exception with additional context
 * Safe to call even if Sentry is not initialized
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, any>
): string | null {
  if (!isSentryInitialized()) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Sentry] Would capture exception:', error, context)
    }
    return null
  }

  return Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
): string | null {
  if (!isSentryInitialized()) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Sentry] Would capture message (${level}):`, message)
    }
    return null
  }

  return Sentry.captureMessage(message, level)
}

/**
 * Set user context for Sentry
 */
export function setUser(user: { id: string; email?: string } | null): void {
  if (!isSentryInitialized()) return

  if (user) {
    // Only set ID by default for privacy
    Sentry.setUser({ id: user.id })
  } else {
    Sentry.setUser(null)
  }
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
): void {
  if (!isSentryInitialized()) return

  Sentry.addBreadcrumb({
    message,
    category,
    level,
  })
}

/**
 * Get the Sentry SDK (for advanced usage)
 */
export function getSentry() {
  return isSentryInitialized() ? Sentry : null
}

export { Sentry }
