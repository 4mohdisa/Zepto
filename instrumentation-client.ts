// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://eeeead3fb792d9070340d52b81d4f303@o4511013379309568.ingest.de.sentry.io/4511013382979664",

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration({
      // Mask all text input fields by default
      maskAllText: true,
      // Mask all input fields
      maskAllInputs: true,
      // Don't capture request/response bodies
      networkCaptureBodies: false,
    }),
  ],

  // Define how likely traces are sampled. Adjust this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Define how likely Replay events are sampled
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // Data Scrubbing - Critical for financial data protection
  beforeSend(event, _hint) {
    return scrubSensitiveData(event);
  },
  
  beforeSendTransaction(event) {
    return scrubTransactionData(event);
  },

  // Configure which URLs to capture errors from
  allowUrls: [
    /https?:\/\/([^/]*\.)?zepto\.app/,
    /https?:\/\/localhost/,
  ],
  
  // Deny URLs that are known to cause noise
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
    /^safari-extension:\/\//i,
  ],
  
  // Ignore common non-actionable errors
  ignoreErrors: [
    'Network Error',
    'Failed to fetch',
    'Network request failed',
    'chrome-extension',
    'moz-extension',
    'safari-extension',
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Cannot update component while rendering',
  ],
  
  // Initial scope
  initialScope: {
    tags: {
      runtime: 'browser',
    },
  },
  
  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

/**
 * Scrub sensitive data from error events
 * Removes financial data, auth tokens, and personal information
 */
function scrubSensitiveData(event: any): any {
  if (!event) return event;
  
  const sanitized = { ...event };
  
  // Scrub request data
  if (sanitized.request) {
    if (sanitized.request.headers) {
      const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
      sensitiveHeaders.forEach(header => {
        if (sanitized.request.headers[header]) {
          sanitized.request.headers[header] = '[REDACTED]';
        }
      });
    }
    
    if (sanitized.request.data) {
      sanitized.request.data = scrubPayload(sanitized.request.data);
    }
  }
  
  // Scrub user data - only keep non-sensitive identifiers
  if (sanitized.user) {
    sanitized.user = {
      id: sanitized.user.id,
    };
  }
  
  // Scrub breadcrumbs
  if (sanitized.breadcrumbs) {
    sanitized.breadcrumbs = sanitized.breadcrumbs.map((crumb: any) => {
      if (crumb.data) {
        crumb.data = scrubPayload(crumb.data);
      }
      if (crumb.message && typeof crumb.message === 'string') {
        crumb.message = scrubString(crumb.message);
      }
      return crumb;
    });
  }
  
  // Scrub exception values
  if (sanitized.exception?.values) {
    sanitized.exception.values = sanitized.exception.values.map((value: any) => {
      if (value.stacktrace?.frames) {
        value.stacktrace.frames = value.stacktrace.frames.map((frame: any) => {
          if (frame.vars) {
            frame.vars = scrubPayload(frame.vars);
          }
          return frame;
        });
      }
      return value;
    });
  }
  
  // Scrub extra context
  if (sanitized.extra) {
    sanitized.extra = scrubPayload(sanitized.extra);
  }
  
  return sanitized;
}

/**
 * Scrub sensitive data from transaction events (performance)
 */
function scrubTransactionData(event: any): any {
  if (!event) return event;
  
  const sanitized = { ...event };
  
  if (sanitized.transaction) {
    sanitized.transaction = scrubString(sanitized.transaction);
  }
  
  if (sanitized.spans) {
    sanitized.spans = sanitized.spans.map((span: any) => {
      if (span.description) {
        span.description = scrubString(span.description);
      }
      if (span.data) {
        span.data = scrubPayload(span.data);
      }
      return span;
    });
  }
  
  if (sanitized.request?.data) {
    sanitized.request.data = scrubPayload(sanitized.request.data);
  }
  
  return sanitized;
}

/**
 * Recursively scrub payload data
 */
function scrubPayload(data: any): any {
  if (!data || typeof data !== 'object') {
    if (typeof data === 'string') {
      return scrubString(data);
    }
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.slice(0, 50).map(item => scrubPayload(item));
  }
  
  const scrubbed: Record<string, any> = {};
  const sensitiveKeys = [
    'amount', 'balance', 'price', 'total', 'value', 'currency', 'income', 'expense',
    'csv', 'rawData', 'fileContent', 'upload',
    'password', 'token', 'secret', 'apiKey', 'api_key', 'auth', 'credential',
    'email', 'phone', 'address', 'ssn', 'credit_card', 'creditcard',
    'description', 'note', 'notes',
  ];
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk));
    
    if (isSensitive) {
      if (typeof value === 'number') {
        scrubbed[key] = '[NUMBER_REDACTED]';
      } else if (typeof value === 'string') {
        scrubbed[key] = '[REDACTED]';
      } else {
        scrubbed[key] = '[DATA_REDACTED]';
      }
    } else {
      scrubbed[key] = scrubPayload(value);
    }
  }
  
  return scrubbed;
}

/**
 * Scrub sensitive patterns from strings
 */
function scrubString(str: string): string {
  if (!str || typeof str !== 'string') return str;
  if (str.length < 10) return str;
  
  if (str.includes(',') && (str.includes('$') || /\d{4}-\d{2}-\d{2}/.test(str))) {
    return '[CSV_DATA_REDACTED]';
  }
  
  if ((str.startsWith('{') || str.startsWith('[')) && str.length > 200) {
    return '[JSON_PAYLOAD_REDACTED]';
  }
  
  return str;
}
