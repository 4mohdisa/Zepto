/**
 * Server-side PostHog Analytics
 * For tracking events in API routes
 */

import { PostHog } from 'posthog-node'

let posthogServer: PostHog | null = null

function getServerPostHog(): PostHog | null {
  if (posthogServer) return posthogServer
  
  const apiKey = process.env.POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
  
  if (!apiKey) {
    return null
  }
  
  posthogServer = new PostHog(apiKey, {
    host,
    flushAt: 1, // Flush immediately for serverless
    flushInterval: 0,
  })
  
  return posthogServer
}

/**
 * Track an event server-side
 */
export async function trackServerEvent(
  event: string,
  userId: string,
  properties?: Record<string, any>
): Promise<void> {
  const posthog = getServerPostHog()
  if (!posthog) return
  
  posthog.capture({
    distinctId: userId,
    event,
    properties: sanitizeProperties(properties),
  })
  
  // Flush immediately for serverless environments
  await posthog.flush()
}

/**
 * Sanitize properties server-side
 */
function sanitizeProperties(props?: Record<string, any>): Record<string, any> | undefined {
  if (!props) return undefined
  
  const sensitiveKeys = [
    'amount', 'balance', 'price', 'total', 'value', 'currency',
    'income', 'expense', 'description', 'note', 'notes',
    'csv', 'rawData', 'fileContent',
    'password', 'token', 'secret', 'apiKey', 'api_key', 'auth', 'credential',
    'email', 'phone', 'address', 'ssn', 'credit_card', 'creditcard',
    'diagnostics',
  ]
  
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(props)) {
    const lowerKey = key.toLowerCase()
    const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk))
    
    if (isSensitive) continue
    
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

// Re-export constants
export * from './constants'
