/**
 * Comprehensive Debug Logger for Zepto
 * Captures events, errors, API calls, Supabase queries, and performance metrics
 * Provides AI-ready diagnostics export
 */

// Global flag to prevent double-patching across HMR
let fetchPatched = false

// Known intentional test endpoints/patterns that should be logged differently
export const INTENTIONAL_TEST_PATTERNS = [
  'TestClientError',
  'TestApiError',
  'Test React rendering error',
]

export type DebugEventType = 
  | 'NAVIGATION'
  | 'API_REQUEST'
  | 'API_RESPONSE'
  | 'API_ERROR'
  | 'SUPABASE_QUERY'
  | 'SUPABASE_ERROR'
  | 'AUTH_CHANGE'
  | 'UI_ERROR'
  | 'UNHANDLED_REJECTION'
  | 'PERF_MARK'
  | 'CACHE_HIT'
  | 'CACHE_MISS'
  | 'CACHE_INVALIDATE'
  | 'MUTATION'
  | 'INFO'
  | 'TEST_EVENT'

export interface DebugEvent {
  id: string
  ts: number
  type: DebugEventType
  scope: string
  name: string
  status?: 'success' | 'error' | 'pending'
  durationMs?: number
  userId?: string
  route?: string
  method?: string
  queryKey?: string
  supabaseTable?: string
  supabaseOp?: string
  errorCode?: string
  errorMessage?: string
  errorDetails?: any
  stack?: string
  meta?: Record<string, any>
}

export interface SystemHealth {
  isHealthy: boolean
  checks: {
    name: string
    status: 'pass' | 'fail' | 'unknown'
    message?: string
    duration?: number
  }[]
  summary: string
}

export interface AIDiagnosticsBundle {
  app: {
    version: string
    env: string
    route: string
    timestamp: string
    userAgent: string
  }
  auth: {
    provider: string
    userIdPresent: boolean
    userId?: string
  }
  supabase: {
    url: string
    urlReachable: boolean | null
    lastErrorCode?: string
    lastErrorMessage?: string
    tablesChecked: Record<string, boolean>
  }
  api: {
    checkedRoutes: Record<string, { status: number; ok: boolean; duration?: number }>
    failures: string[]
  }
  recentEvents: DebugEvent[]
  recentErrors: DebugEvent[]
  performance: {
    navTimings: Record<string, number>
    slowRequests: DebugEvent[]
  }
  health: SystemHealth
}

class DebugLogger {
  private events: DebugEvent[] = []
  private maxEvents: number = 500
  private listeners: Set<(events: DebugEvent[]) => void> = new Set()
  private originalFetch: typeof fetch | null = null
  private isInitialized: boolean = false

  constructor() {
    if (typeof window !== 'undefined' && !fetchPatched) {
      this.init()
    }
  }

  private init() {
    if (this.isInitialized) return
    this.isInitialized = true

    this.setupErrorHandlers()
    this.instrumentFetch()
    
    this.log({
      type: 'NAVIGATION',
      scope: 'app',
      name: 'initial_load',
      route: window.location.pathname,
      meta: {
        href: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    })
  }

  private setupErrorHandlers() {
    window.addEventListener('error', (event) => {
      const errorName = event.error?.name || ''
      const errorMessage = event.message || ''
      
      // Check if this is an intentional test error
      const isIntentionalTest = INTENTIONAL_TEST_PATTERNS.some(pattern => 
        errorName.includes(pattern) || errorMessage.includes(pattern)
      )
      
      this.log({
        type: isIntentionalTest ? 'TEST_EVENT' : 'UI_ERROR',
        scope: 'window',
        name: event.error?.name || 'Error',
        status: 'error',
        errorMessage: event.message,
        errorDetails: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          isIntentionalTest
        },
        stack: event.error?.stack
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason
      const errorName = error?.name || ''
      const errorMessage = typeof error === 'string' ? error : error?.message || ''
      
      // Check if this is an intentional test error
      const isIntentionalTest = INTENTIONAL_TEST_PATTERNS.some(pattern => 
        errorName.includes(pattern) || errorMessage.includes(pattern)
      )
      
      this.log({
        type: isIntentionalTest ? 'TEST_EVENT' : 'UNHANDLED_REJECTION',
        scope: 'promise',
        name: error?.name || 'UnhandledRejection',
        status: 'error',
        errorMessage: errorMessage,
        errorDetails: { ...error, isIntentionalTest },
        stack: error?.stack
      })
    })
  }

  private shouldLogUrl(url: string): boolean {
    // Fast path: Skip data URLs and blobs entirely
    if (url.startsWith('data:') || url.startsWith('blob:')) return false
    
    // Fast path: Skip Next.js internal endpoints (very common)
    if (url[0] === '/' && url[1] === '_') return false
    if (url.includes('/_next/')) return false
    
    // Exclude Next.js dev endpoints
    if (url.includes('/__nextjs_')) return false
    if (url.includes('/__nextjs_original-stack-frames')) return false
    if (url.includes('/__nextjs_source-map')) return false
    if (url.includes('/__nextjs_error_feedback')) return false
    
    // Exclude browser extension schemes
    if (url.startsWith('chrome-extension://')) return false
    if (url.startsWith('moz-extension://')) return false
    if (url.startsWith('safari-extension://')) return false
    
    return true
  }

  private instrumentFetch() {
    if (fetchPatched || this.originalFetch) return
    
    // Bind original fetch to window to preserve context (fixes "Illegal invocation")
    this.originalFetch = window.fetch.bind(window)
    fetchPatched = true
    const logger = this
    const boundOriginalFetch = this.originalFetch

    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      const startTime = performance.now()
      let url: string
      
      try {
        url = input.toString()
      } catch {
        url = String(input)
      }
      
      // Skip logging for excluded URLs (Next.js dev endpoints, extensions)
      if (!logger.shouldLogUrl(url)) {
        return boundOriginalFetch(input, init)
      }
      
      const method = init?.method || 'GET'
      const isApi = url.includes('/api/')
      const isSupabase = url.includes('supabase.co')
      
      // Log request (safely - never throw)
      try {
        logger.log({
          type: isSupabase ? 'SUPABASE_QUERY' : 'API_REQUEST',
          scope: isSupabase ? 'supabase' : 'api',
          name: url.split('?')[0].split('/').pop() || 'request',
          route: url,
          method,
          status: 'pending',
          supabaseTable: isSupabase ? logger.extractSupabaseTable(url) : undefined,
          supabaseOp: isSupabase ? logger.extractSupabaseOp(url) : undefined
        })
      } catch {
        // Logging failed - don't break the actual fetch
      }

      try {
        const response = await boundOriginalFetch(input, init)
        const duration = Math.round(performance.now() - startTime)
        
        // For Supabase error responses, try to extract the error body
        let supabaseError = null
        if (isSupabase && !response.ok) {
          try {
            const clonedResponse = response.clone()
            const errorBody = await clonedResponse.json()
            supabaseError = errorBody
          } catch {
            // Could not parse error body
          }
        }
        
        // Log response (safely)
        try {
          // Check if this is an intentional test endpoint
          const isTestEndpoint = INTENTIONAL_TEST_PATTERNS.some(pattern => url.includes(pattern))
          
          logger.log({
            type: isTestEndpoint ? 'TEST_EVENT' : (isSupabase ? 'SUPABASE_QUERY' : 'API_RESPONSE'),
            scope: isSupabase ? 'supabase' : 'api',
            name: url.split('?')[0].split('/').pop() || 'request',
            route: url,
            method,
            status: response.ok ? 'success' : 'error',
            durationMs: duration,
            errorCode: !response.ok ? String(response.status) : undefined,
            errorMessage: supabaseError?.message || (!response.ok ? response.statusText : undefined),
            errorDetails: supabaseError ? {
              code: supabaseError.code,
              details: supabaseError.details,
              hint: supabaseError.hint,
              pgCode: supabaseError.pgCode || supabaseError.code
            } : undefined,
            supabaseTable: isSupabase ? logger.extractSupabaseTable(url) : undefined,
            supabaseOp: isSupabase ? logger.extractSupabaseOp(url) : undefined
          })
        } catch {}

        return response
      } catch (error: any) {
        const duration = Math.round(performance.now() - startTime)
        
        // Skip logging for intentional aborts (AbortError)
        if (error?.name === 'AbortError') {
          throw error
        }
        
        // Extract Supabase error details if available
        const errorDetails = error?.details || error?.hint ? {
          details: error.details,
          hint: error.hint,
          code: error.code
        } : error?.code ? { code: error.code } : undefined
        
        // Log error (safely)
        try {
          // Check if this is an intentional test endpoint
          const isTestEndpoint = INTENTIONAL_TEST_PATTERNS.some(pattern => url.includes(pattern))
          
          logger.log({
            type: isTestEndpoint ? 'TEST_EVENT' : (isSupabase ? 'SUPABASE_ERROR' : 'API_ERROR'),
            scope: isSupabase ? 'supabase' : 'api',
            name: url.split('?')[0].split('/').pop() || 'request',
            route: url,
            method,
            status: 'error',
            durationMs: duration,
            errorCode: error?.code,
            errorMessage: error?.message,
            errorDetails: errorDetails,
            stack: error?.stack
          })
        } catch {}
        
        throw error
      }
    }
  }

  private extractSupabaseTable(url: string): string | undefined {
    const match = url.match(/\/rest\/v1\/([^?]+)/)
    return match?.[1]
  }

  private extractSupabaseOp(url: string): string | undefined {
    if (url.includes('select=')) return 'select'
    if (url.includes('insert')) return 'insert'
    if (url.includes('update')) return 'update'
    if (url.includes('delete')) return 'delete'
    if (url.includes('rpc/')) return 'rpc'
    return undefined
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Check if an event is an intentional test/sentry verification event
   */
  private isIntentionalTestEvent(event: DebugEvent): boolean {
    const url = event.route || ''
    const message = event.errorMessage || ''
    const name = event.name || ''
    
    return INTENTIONAL_TEST_PATTERNS.some(pattern => 
      url.includes(pattern) || 
      message.includes(pattern) || 
      name.includes(pattern)
    )
  }

  log(partialEvent: Omit<DebugEvent, 'id' | 'ts'>): DebugEvent {
    const event: DebugEvent = {
      id: this.generateId(),
      ts: Date.now(),
      ...partialEvent
    }

    this.events.push(event)
    
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    this.listeners.forEach(listener => listener(this.events))

    if (process.env.NODE_ENV === 'development') {
      const prefix = `[${event.type}]${event.scope ? ` [${event.scope}]` : ''}`
      
      // Check if this is an intentional test event
      const isIntentionalTest = this.isIntentionalTestEvent(event)
      
      // Skip logging fast cache hits to reduce noise (keep errors and slow requests)
      const isCacheHit = event.type === 'CACHE_HIT'
      const isFastRequest = event.durationMs && event.durationMs < 100
      
      if (isIntentionalTest) {
        // Log intentional test events as softer "test" events, not scary errors
        if (event.status === 'error') {
          console.log(
            `%c🧪 [TEST EVENT]%c`, 
            'color: #8b5cf6; font-weight: bold', 
            'color: inherit',
            event.route || event.name,
            '→ Expected test error (sent to Sentry for verification)'
          )
        } else {
          console.log(
            `%c🧪 [TEST EVENT]%c`, 
            'color: #8b5cf6; font-weight: bold', 
            'color: inherit',
            event.route || event.name,
            event.durationMs ? `(${event.durationMs}ms)` : ''
          )
        }
      } else if (event.status === 'error') {
        // Real errors - log normally as errors
        const errorInfo = event.errorCode ? `[${event.errorCode}] ` : ''
        const details = event.errorDetails ? 
          (typeof event.errorDetails === 'object' ? 
            JSON.stringify(event.errorDetails).slice(0, 200) : 
            String(event.errorDetails).slice(0, 200)) : 
          ''
        console.error(
          prefix, 
          event.name, 
          errorInfo + (event.errorMessage || 'Unknown error'),
          details,
          event.meta || ''
        )
      } else if (event.durationMs && event.durationMs > 1000) {
        // Slow request warning
        console.warn(prefix, event.name, `${event.durationMs}ms`, event.meta || '')
      } else if (!isCacheHit || !isFastRequest) {
        // Only log cache hits if they're slow, always log other requests
        const tableInfo = event.supabaseTable ? `(${event.supabaseTable}${event.supabaseOp ? `.${event.supabaseOp}` : ''})` : ''
        console.log(prefix, event.name, tableInfo, event.durationMs ? `${event.durationMs}ms` : '', event.meta || '')
      }
    }

    return event
  }

  // Convenience methods
  info(scope: string, message: string, meta?: Record<string, any>) {
    this.log({ type: 'INFO', scope, name: message, meta })
  }

  debug(scope: string, message: string, meta?: Record<string, any>) {
    this.log({ type: 'INFO', scope, name: message, meta })
  }

  error(scope: string, message: string, meta?: Record<string, any>) {
    this.log({ type: 'UI_ERROR', scope, name: message, status: 'error', errorMessage: meta?.error || message, meta })
  }

  warn(scope: string, message: string, meta?: Record<string, any>) {
    this.log({ type: 'INFO', scope, name: message, status: 'error', meta })
  }

  fatal(scope: string, message: string, meta?: Record<string, any>, error?: Error) {
    this.log({ 
      type: 'UI_ERROR', 
      scope, 
      name: message, 
      status: 'error', 
      errorMessage: error?.message || meta?.error || message,
      errorDetails: error || meta,
      stack: error?.stack,
      meta 
    })
  }

  getEvents(): DebugEvent[] {
    return [...this.events]
  }

  getEventsByType(type: DebugEventType): DebugEvent[] {
    return this.events.filter(e => e.type === type)
  }

  getErrors(includeTestEvents: boolean = false): DebugEvent[] {
    return this.events.filter(e => {
      const isError = e.status === 'error' || e.type.includes('ERROR')
      const isTestEvent = e.type === 'TEST_EVENT' || this.isIntentionalTestEvent(e)
      
      if (includeTestEvents) {
        return isError || isTestEvent
      }
      return isError && !isTestEvent
    })
  }

  getRecentErrors(count: number = 10, includeTestEvents: boolean = false): DebugEvent[] {
    return this.getErrors(includeTestEvents).slice(-count)
  }

  clear() {
    this.events = []
    this.notifyListeners()
  }

  subscribe(listener: (events: DebugEvent[]) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.events))
  }

  mark(name: string, meta?: Record<string, any>) {
    this.log({
      type: 'PERF_MARK',
      scope: 'performance',
      name,
      meta: { ...meta, timestamp: performance.now() }
    })
  }

  logCacheHit(queryKey: string) {
    this.log({ type: 'CACHE_HIT', scope: 'cache', name: 'cache_hit', queryKey })
  }

  logCacheMiss(queryKey: string) {
    this.log({ type: 'CACHE_MISS', scope: 'cache', name: 'cache_miss', queryKey })
  }

  logCacheInvalidate(queryKey: string, meta?: Record<string, any>) {
    this.log({ type: 'CACHE_INVALIDATE', scope: 'cache', name: 'cache_invalidate', queryKey, meta })
  }

  async generateAIDiagnostics(): Promise<AIDiagnosticsBundle> {
    const recentEvents = this.events.slice(-50)
    const recentErrors = this.getRecentErrors(10)
    const slowRequests = this.events
      .filter(e => e.durationMs && e.durationMs > 1000)
      .slice(-10)

    const health = await this.runHealthChecks()

    return {
      app: {
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
        env: process.env.NODE_ENV || 'unknown',
        route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      },
      auth: {
        provider: 'clerk',
        userIdPresent: !!this.events.find(e => e.userId)?.userId,
        userId: this.events.find(e => e.userId)?.userId
      },
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'unknown',
        urlReachable: null,
        lastErrorCode: recentErrors.find(e => e.type === 'SUPABASE_ERROR')?.errorCode,
        lastErrorMessage: recentErrors.find(e => e.type === 'SUPABASE_ERROR')?.errorMessage,
        tablesChecked: {}
      },
      api: {
        checkedRoutes: {},
        failures: recentErrors.filter(e => e.scope === 'api').map(e => `${e.route}: ${e.errorMessage}`)
      },
      recentEvents,
      recentErrors,
      performance: {
        navTimings: this.extractNavTimings(),
        slowRequests
      },
      health
    }
  }

  private async runHealthChecks(): Promise<SystemHealth> {
    const checks: SystemHealth['checks'] = []
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (supabaseUrl) {
      const start = performance.now()
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, { 
          method: 'HEAD',
          headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' }
        })
        checks.push({
          name: 'Supabase Reachable',
          status: response.ok ? 'pass' : 'fail',
          message: response.ok ? 'Connected' : `Status ${response.status}`,
          duration: Math.round(performance.now() - start)
        })
      } catch (e: any) {
        checks.push({
          name: 'Supabase Reachable',
          status: 'fail',
          message: e.message,
          duration: Math.round(performance.now() - start)
        })
      }
    }

    const routes = ['/api/merchants', '/api/dashboard', '/api/transactions']
    for (const route of routes) {
      const start = performance.now()
      try {
        const response = await fetch(route, { method: 'HEAD' })
        checks.push({
          name: `API: ${route}`,
          status: response.status !== 404 ? 'pass' : 'fail',
          message: `Status ${response.status}`,
          duration: Math.round(performance.now() - start)
        })
      } catch (e: any) {
        checks.push({
          name: `API: ${route}`,
          status: 'fail',
          message: e.message,
          duration: Math.round(performance.now() - start)
        })
      }
    }

    const failedChecks = checks.filter(c => c.status === 'fail')
    const isHealthy = failedChecks.length === 0

    return {
      isHealthy,
      checks,
      summary: isHealthy 
        ? 'All systems operational'
        : `${failedChecks.length} check(s) failed: ${failedChecks.map(c => c.name).join(', ')}`
    }
  }

  private extractNavTimings(): Record<string, number> {
    if (typeof performance === 'undefined') return {}
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (!nav) return {}

    return {
      dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
      connect: Math.round(nav.connectEnd - nav.connectStart),
      ttfb: Math.round(nav.responseStart - nav.startTime),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
      loadComplete: Math.round(nav.loadEventEnd - nav.startTime)
    }
  }

  async generateStatusMessage(): Promise<string> {
    const diag = await this.generateAIDiagnostics()
    const errorCount = diag.recentErrors.length
    
    return [
      `📊 Zepto Status Report`,
      `Time: ${diag.app.timestamp}`,
      `Route: ${diag.app.route}`,
      `Env: ${diag.app.env}`,
      ``,
      `Health: ${diag.health.isHealthy ? '✅ Healthy' : '❌ Issues detected'}`,
      diag.health.summary,
      ``,
      `Auth: ${diag.auth.userIdPresent ? '✅ Signed in' : '❌ Not signed in'}`,
      diag.auth.userId ? `User: ${diag.auth.userId.slice(0, 10)}...` : '',
      ``,
      `Recent Errors: ${errorCount}`,
      ...diag.recentErrors.slice(0, 5).map(e => 
        `  • [${e.type}] ${e.name}: ${e.errorMessage?.slice(0, 100) || 'No message'}`
      ),
      ``,
      `Slow Requests: ${diag.performance.slowRequests.length}`,
      diag.performance.slowRequests.length > 0 
        ? diag.performance.slowRequests.map(r => `  • ${r.name}: ${r.durationMs}ms`).join('\n')
        : '  None'
    ].filter(Boolean).join('\n')
  }

  /**
   * Generate a quick performance summary for the console
   * Run in browser console: window.__zeptoPerf?.()
   */
  generatePerformanceSummary(): Record<string, any> {
    const events = this.events
    const recentEvents = events.slice(-100)
    
    // Calculate API request stats
    const apiRequests = recentEvents.filter(e => 
      e.type === 'API_REQUEST' || e.type === 'API_RESPONSE'
    )
    const apiDurations = apiRequests
      .filter(e => e.durationMs)
      .map(e => e.durationMs!)
    
    const avgApiDuration = apiDurations.length > 0 
      ? Math.round(apiDurations.reduce((a, b) => a + b, 0) / apiDurations.length)
      : 0
    
    const slowestApi = apiRequests
      .filter(e => e.durationMs)
      .sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0))[0]
    
    // Cache hit rate
    const cacheHits = recentEvents.filter(e => e.type === 'CACHE_HIT').length
    const cacheMisses = recentEvents.filter(e => e.type === 'CACHE_MISS').length
    const cacheTotal = cacheHits + cacheMisses
    
    // Supabase query stats
    const supabaseQueries = recentEvents.filter(e => 
      e.type === 'SUPABASE_QUERY' && e.durationMs
    )
    const avgSupabaseDuration = supabaseQueries.length > 0
      ? Math.round(supabaseQueries.reduce((a, b) => a + (b.durationMs || 0), 0) / supabaseQueries.length)
      : 0
    
    // Navigation timing
    const navTimings = this.extractNavTimings()
    
    const summary = {
      timestamp: new Date().toISOString(),
      pageLoad: navTimings.loadComplete ? `${navTimings.loadComplete}ms` : 'N/A',
      ttfb: navTimings.ttfb ? `${navTimings.ttfb}ms` : 'N/A',
      apiRequests: {
        count: apiDurations.length,
        avgDuration: `${avgApiDuration}ms`,
        slowest: slowestApi ? {
          name: slowestApi.name,
          duration: `${slowestApi.durationMs}ms`
        } : null
      },
      cacheHitRate: cacheTotal > 0 ? `${Math.round((cacheHits / cacheTotal) * 100)}%` : 'N/A',
      supabase: {
        queryCount: supabaseQueries.length,
        avgDuration: `${avgSupabaseDuration}ms`
      },
      errors: recentEvents.filter(e => e.status === 'error').length
    }
    
    // Log formatted summary (dev only)
    if (process.env.NODE_ENV === 'development') {
      console.group('⚡ Zepto Performance Summary')
      console.log('Page Load:', summary.pageLoad)
      console.log('TTFB:', summary.ttfb)
      console.log('API Avg:', summary.apiRequests.avgDuration, 
        `(${summary.apiRequests.count} requests)`,
        summary.apiRequests.slowest ? `- Slowest: ${summary.apiRequests.slowest.name} (${summary.apiRequests.slowest.duration})` : ''
      )
      console.log('Cache Hit Rate:', summary.cacheHitRate)
      console.log('Supabase Avg:', summary.supabase.avgDuration, `(${summary.supabase.queryCount} queries)`)
      console.log('Errors:', summary.errors)
      console.groupEnd()
    }
    
    return summary
  }
}

// Singleton instance
export const debugLogger = new DebugLogger()

// Expose performance summary to window for console access
if (typeof window !== 'undefined') {
  (window as any).__zeptoPerf = () => debugLogger.generatePerformanceSummary()
  ;(window as any).__zeptoDiagnostics = () => debugLogger.generateAIDiagnostics()
}

// Helper to wrap Supabase queries
export function wrapSupabaseQuery<T>(
  table: string,
  operation: string,
  queryPromise: Promise<T>
): Promise<T> {
  const startTime = performance.now()
  
  debugLogger.log({
    type: 'SUPABASE_QUERY',
    scope: 'supabase',
    name: `${table}.${operation}`,
    supabaseTable: table,
    supabaseOp: operation,
    status: 'pending'
  })
  
  return queryPromise
    .then(result => {
      debugLogger.log({
        type: 'SUPABASE_QUERY',
        scope: 'supabase',
        name: `${table}.${operation}`,
        supabaseTable: table,
        supabaseOp: operation,
        status: 'success',
        durationMs: Math.round(performance.now() - startTime)
      })
      return result
    })
    .catch(error => {
      debugLogger.log({
        type: 'SUPABASE_ERROR',
        scope: 'supabase',
        name: `${table}.${operation}`,
        supabaseTable: table,
        supabaseOp: operation,
        status: 'error',
        durationMs: Math.round(performance.now() - startTime),
        errorCode: error?.code,
        errorMessage: error?.message,
        errorDetails: error,
        stack: error?.stack
      })
      throw error
    })
}
