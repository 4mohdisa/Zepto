// Sentry Integration Helpers
// Safe wrappers for Sentry functionality with fallback to debug logger

import { captureException as sentryCaptureException, captureMessage as sentryCaptureMessage, setUser as sentrySetUser, addBreadcrumb as sentryAddBreadcrumb, getCurrentScope } from '@sentry/nextjs'
import { debugLogger } from '@/lib/utils/debug-logger'

/**
 * Check if Sentry is initialized and available
 */
export function isSentryEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_SENTRY_DSN || !!process.env.SENTRY_DSN
}

/**
 * Capture an exception safely
 * Falls back to debug logger if Sentry is not available
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (isSentryEnabled()) {
    sentryCaptureException(error, {
      extra: context,
    })
  }
  
  // Always log to debug logger as well
  debugLogger.error('app', error.message, { ...context, errorName: error.name })
}

/**
 * Capture a message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (isSentryEnabled()) {
    sentryCaptureMessage(message, level)
  }
  
  debugLogger.info('app', message)
}

/**
 * Set user context for Sentry
 * Only sets non-sensitive user ID
 */
export function setUser(userId: string | null): void {
  if (isSentryEnabled()) {
    if (userId) {
      sentrySetUser({ id: userId })
    } else {
      sentrySetUser(null)
    }
  }
}

/**
 * Add breadcrumb for debugging trail
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  if (isSentryEnabled()) {
    sentryAddBreadcrumb({
      message,
      category,
      level,
    })
  }
}

/**
 * Wrap a function with Sentry error tracking
 * Falls back to normal execution if Sentry fails
 */
export function withErrorTracking<T extends (...args: any[]) => any>(
  fn: T,
  context?: { name?: string; tags?: Record<string, string> }
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof Error) {
        captureException(error, {
          functionName: context?.name || fn.name,
          tags: context?.tags,
          args: '[ARGS_REDACTED]', // Don't log actual args
        })
      }
      throw error
    }
  }) as T
}

/**
 * Configure scope with tags for the current context
 * Uses getCurrentScope() API from Sentry v8
 */
export function configureScope(tags: Record<string, string>): void {
  if (isSentryEnabled()) {
    const scope = getCurrentScope()
    Object.entries(tags).forEach(([key, value]) => {
      scope.setTag(key, value)
    })
  }
}
