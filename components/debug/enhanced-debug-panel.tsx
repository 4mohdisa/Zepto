'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { createBrowserClient } from '@supabase/ssr'
import { useDebug, useDebugLogger } from './debug-provider'
import { AnalyticsDashboard } from './analytics-dashboard'
import { 
  Bug, 
  X, 
  Minimize2, 
  Maximize2, 
  Database, 
  Shield, 
  User, 
  Wifi,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Terminal,
  Copy,
  Trash2,
  Download,
  Search,
  Filter,
  Settings,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { LogLevel } from './debug-provider'

interface SystemCheck {
  id: string
  name: string
  status: 'pending' | 'checking' | 'success' | 'error' | 'warning'
  message: string
  details?: string
  timestamp?: Date
}

// Create a safe Supabase client for debug panel
function useDebugSupabaseClient() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  
  // Only create client if auth is ready
  if (!isLoaded || !isSignedIn) {
    return null
  }
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return null
    }
    
    return createBrowserClient(supabaseUrl, supabaseKey, {
      accessToken: async () => {
        try {
          const token = await getToken()
          return token ?? null
        } catch {
          return null
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  } catch {
    return null
  }
}

export function EnhancedDebugPanel() {
  const { userId, isSignedIn, isLoaded, orgId, getToken } = useAuth()
  const supabase = useDebugSupabaseClient()
  const { logs, clearLogs, exportLogs, isDebugMode, setDebugMode, addLog } = useDebug()
  const logger = useDebugLogger('DebugPanel')
  
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([
    { id: 'auth', name: 'Authentication', status: 'pending', message: 'Not checked' },
    { id: 'connection', name: 'Supabase Connection', status: 'pending', message: 'Not checked' },
    { id: 'database', name: 'Database Access', status: 'pending', message: 'Not checked' },
    { id: 'rls', name: 'RLS Policies', status: 'pending', message: 'Not checked' },
    { id: 'jwt', name: 'JWT Claims', status: 'pending', message: 'Not checked' },
  ])
  const [jwtPayload, setJwtPayload] = useState<any>(null)
  const [logFilter, setLogFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all')
  const [isRunningChecks, setIsRunningChecks] = useState(false)
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online')

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('online')
      logger.success('Network connection restored')
    }
    
    const handleOffline = () => {
      setNetworkStatus('offline')
      logger.error('Network connection lost')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [logger])

  // Monitor logs for network errors
  useEffect(() => {
    const recentLogs = logs.slice(0, 5)
    const hasNetworkError = recentLogs.some(log => 
      log.level === 'error' && 
      (log.message.toLowerCase().includes('connection') ||
       log.message.toLowerCase().includes('network') ||
       log.message.toLowerCase().includes('fetch') ||
       log.details?.isNetworkError === true)
    )
    
    if (hasNetworkError && networkStatus === 'online') {
      // Update connection check if we see network errors
      setSystemChecks(prev => prev.map(check => 
        check.id === 'connection' && check.status === 'success' 
          ? { ...check, status: 'warning', message: 'Recent connection errors detected' } 
          : check
      ))
    }
  }, [logs, networkStatus])

  const updateCheck = useCallback((id: string, status: SystemCheck['status'], message: string, details?: string) => {
    setSystemChecks(prev => prev.map(check => 
      check.id === id ? { ...check, status, message, details, timestamp: new Date() } : check
    ))
  }, [])

  const runSystemChecks = useCallback(async () => {
    if (isRunningChecks) return
    setIsRunningChecks(true)
    logger.info('Starting comprehensive system checks...')

    // Reset all checks
    setSystemChecks(prev => prev.map(c => ({ ...c, status: 'pending', message: 'Waiting...' })))

    // Check 1: Authentication
    updateCheck('auth', 'checking', 'Verifying auth state...')
    await new Promise(r => setTimeout(r, 100)) // Visual feedback
    
    if (!isLoaded) {
      updateCheck('auth', 'warning', 'Auth still loading', 'Wait for auth to initialize')
      logger.warn('Authentication still loading')
    } else if (!isSignedIn) {
      updateCheck('auth', 'error', 'Not signed in', 'User needs to sign in')
      logger.error('User not signed in')
    } else {
      updateCheck('auth', 'success', `Authenticated as ${userId?.substring(0, 12)}...`)
      logger.success(`User authenticated: ${userId}`)
    }

    // Check 2: JWT Claims
    updateCheck('jwt', 'checking', 'Decoding JWT...')
    try {
      const token = await getToken()
      if (token) {
        const base64Payload = token.split('.')[1]
        const jsonPayload = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'))
        const payload = JSON.parse(jsonPayload)
        setJwtPayload(payload)
        
        if (payload.role === 'authenticated') {
          updateCheck('jwt', 'success', 'Valid JWT with role claim')
          logger.success('JWT decoded successfully', { 
            sub: payload.sub?.substring(0, 12) + '...',
            role: payload.role,
            hasIat: !!payload.iat,
            hasExp: !!payload.exp
          })
        } else {
          updateCheck('jwt', 'error', `Missing role claim: ${payload.role}`, 'Add { "role": "authenticated" } to Clerk session token')
          logger.error('JWT missing role claim', { role: payload.role })
        }
      } else {
        updateCheck('jwt', 'error', 'No token available')
        logger.error('No JWT token available')
      }
    } catch (err) {
      updateCheck('jwt', 'error', 'Failed to decode JWT', String(err))
      logger.error('JWT decode failed', err)
    }

    // Check 3: Supabase Connection
    updateCheck('connection', 'checking', 'Testing connection...')
    if (!supabase) {
      updateCheck('connection', 'error', 'Supabase client not available', 'Auth not ready')
      logger.error('Supabase client not available')
    } else {
      try {
        const startTime = performance.now()
        const { error } = await supabase.from('profiles').select('count').limit(0)
        const duration = Math.round(performance.now() - startTime)
        
        if (error) {
          updateCheck('connection', 'error', `Connection failed (${duration}ms)`, error.message)
          logger.error('Supabase connection failed', { error, duration: `${duration}ms` })
        } else {
          updateCheck('connection', 'success', `Connected (${duration}ms)`)
          logger.success('Supabase connection successful', { duration: `${duration}ms` })
        }
      } catch (err: any) {
        const errorMessage = String(err)
        const isNetworkError = 
          errorMessage.includes('fetch') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('network') ||
          errorMessage.includes('ERR_CONNECTION') ||
          errorMessage.includes('Failed to fetch')
        
        if (isNetworkError) {
          updateCheck('connection', 'error', 'Network Error', 'Check your internet connection and Supabase status')
          logger.error('Network error - cannot reach Supabase', { 
            error: errorMessage,
            hint: 'Check if Supabase is running and accessible'
          })
        } else {
          updateCheck('connection', 'error', 'Connection exception', errorMessage)
          logger.error('Supabase connection exception', err)
        }
      }
    }

    // Check 4: Database Access (only if signed in and supabase client available)
    if (isSignedIn && supabase) {
      updateCheck('database', 'checking', 'Testing data access...')
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('id, name')
          .limit(1)

        if (error) {
          if (error.code === '42501') {
            updateCheck('database', 'error', 'RLS Policy Denied', 'Row Level Security is blocking access')
            logger.error('Database access denied by RLS', error)
          } else {
            updateCheck('database', 'error', `Query failed: ${error.code}`, error.message)
            logger.error('Database query failed', error)
          }
        } else {
          updateCheck('database', 'success', `Can read transactions (${data?.length || 0} rows)`)
          logger.success('Database access confirmed', { rowsReturned: data?.length || 0 })
        }
      } catch (err) {
        updateCheck('database', 'error', 'Access exception', String(err))
        logger.error('Database access exception', err)
      }

      // Check 5: RLS Policies - Try to insert (will fail on either FK or RLS)
      updateCheck('rls', 'checking', 'Testing INSERT policy...')
      try {
        const { error } = await supabase
          .from('transactions')
          .insert({
            user_id: 'test-invalid-user-id-for-rls-check',
            name: 'RLS Policy Test',
            amount: 0.01,
            type: 'Expense',
            date: new Date().toISOString().split('T')[0]
          })
          .select()

        if (error) {
          // 42501 = RLS violation, 23503 = FK violation (user doesn't exist)
          // Both indicate security is working (RLS or FK constraint)
          if (error.code === '42501' || error.message?.includes('violates row-level security')) {
            updateCheck('rls', 'success', 'INSERT policy correctly blocks unauthorized inserts')
            logger.success('RLS INSERT policy working correctly')
          } else if (error.code === '23503') {
            // FK constraint error - means we got past RLS but failed on FK
            // This actually indicates RLS might NOT be working if we can attempt the insert
            updateCheck('rls', 'warning', 'FK constraint blocked insert - verify RLS is enabled', error.message)
            logger.warn('Insert blocked by FK constraint, not RLS', error)
          } else {
            updateCheck('rls', 'warning', 'Unexpected error', error.message)
            logger.warn('Unexpected error during RLS test', error)
          }
        } else {
          updateCheck('rls', 'warning', 'Test insert succeeded - RLS may be disabled', 'Check if RLS is enabled on the transactions table')
          logger.warn('RLS test insert succeeded - verify RLS is enabled')
        }
      } catch (err) {
        updateCheck('rls', 'error', 'Policy test exception', String(err))
        logger.error('RLS policy test exception', err)
      }
    } else {
      updateCheck('database', 'warning', isSignedIn ? 'Skipped - no client' : 'Skipped - not signed in')
      updateCheck('rls', 'warning', isSignedIn ? 'Skipped - no client' : 'Skipped - not signed in')
      logger.warn('Database and RLS checks skipped', { reason: isSignedIn ? 'no client' : 'not signed in' })
    }

    setIsRunningChecks(false)
    logger.info('System checks completed')
  }, [isLoaded, isSignedIn, userId, supabase, updateCheck, logger, isRunningChecks])

  const handleExport = () => {
    const content = exportLogs()
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zeptodebug-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    logger.success('Logs exported to file')
  }

  const filteredLogs = logs.filter(log => {
    const matchesText = !logFilter || 
      log.message.toLowerCase().includes(logFilter.toLowerCase()) ||
      log.category.toLowerCase().includes(logFilter.toLowerCase())
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter
    return matchesText && matchesLevel
  })

  const logCounts = {
    all: logs.length,
    error: logs.filter(l => l.level === 'error').length,
    warn: logs.filter(l => l.level === 'warn').length,
    info: logs.filter(l => l.level === 'info').length,
    debug: logs.filter(l => l.level === 'debug').length,
    success: logs.filter(l => l.level === 'success').length,
  }

  // Don't render in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !isDebugMode) {
    return null
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 gap-2 shadow-lg hover:shadow-xl transition-shadow"
        onClick={() => setIsOpen(true)}
      >
        <Bug className="h-4 w-4" />
        <span className="hidden sm:inline">Debug</span>
        {logCounts.error > 0 && (
          <Badge variant="destructive" className="ml-1 h-5 min-w-5 flex items-center justify-center text-[10px]">
            {logCounts.error}
          </Badge>
        )}
      </Button>
    )
  }

  return (
    <Card className={cn(
      "fixed z-50 shadow-2xl border-2 transition-all duration-200 flex flex-col",
      isMinimized 
        ? "bottom-4 right-4 w-auto" 
        : "bottom-4 right-4 left-4 md:left-auto md:w-[700px] md:max-w-[90vw] max-h-[80vh]"
    )}>
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-orange-500" />
            <CardTitle className="text-sm font-semibold">Debug Console</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px] h-5">
              {logs.length} logs
            </Badge>
            {logCounts.error > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5">
                {logCounts.error} errors
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={() => setIsOpen(false)}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b px-4 py-2 h-auto shrink-0">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs">
              Logs
              {logCounts.error > 0 && <span className="ml-1 text-red-500">({logCounts.error})</span>}
            </TabsTrigger>
            <TabsTrigger value="auth" className="text-xs">Auth</TabsTrigger>
            <TabsTrigger value="database" className="text-xs">Database</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 flex-1 overflow-auto p-4 space-y-4">
            {/* Network Errors Alert */}
            {(() => {
              const recentErrors = logs.slice(0, 10).filter(log => 
                log.level === 'error' && 
                (log.message.toLowerCase().includes('connection') ||
                 log.message.toLowerCase().includes('network') ||
                 log.message.toLowerCase().includes('fetch') ||
                 log.details?.isNetworkError === true)
              )
              if (recentErrors.length > 0) {
                return (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Wifi className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-red-600">Network Errors Detected</h4>
                        <p className="text-xs text-red-600/80 mt-1">
                          {recentErrors.length} connection error(s) in recent logs. 
                          Check the Logs tab for details.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })()}

            {/* System Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">System Status</h4>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs"
                  onClick={runSystemChecks}
                  disabled={isRunningChecks}
                >
                  <RefreshCw className={cn("h-3 w-3 mr-1", isRunningChecks && "animate-spin")} />
                  {isRunningChecks ? 'Running...' : 'Run Checks'}
                </Button>
              </div>
              
              <div className="space-y-1.5">
                {systemChecks.map((check) => (
                  <div 
                    key={check.id} 
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <StatusIcon status={check.status} />
                      <div>
                        <span className="text-sm font-medium">{check.name}</span>
                        {check.details && (
                          <p className="text-xs text-muted-foreground mt-0.5">{check.details}</p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={check.status} message={check.message} />
                  </div>
                ))}
              </div>
            </div>

            {/* Environment */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">Environment</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">Node Env</span>
                  <Badge variant="outline" className="text-xs">{process.env.NODE_ENV}</Badge>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">Debug Mode</span>
                  <Badge 
                    className={cn("text-xs", isDebugMode ? "bg-green-500" : "bg-muted")}
                  >
                    {isDebugMode ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">Network</span>
                  <Badge 
                    className={cn(
                      "text-xs",
                      networkStatus === 'online' ? "bg-green-500" : "bg-red-500"
                    )}
                  >
                    {networkStatus === 'online' ? 'Online' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">Supabase</span>
                  <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded truncate max-w-[100px]">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').substring(0, 15)}...
                  </code>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="mt-0 flex-1 flex flex-col min-h-0">
            {/* Log Controls */}
            <div className="border-b p-2 space-y-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter logs..."
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="h-8 pl-7 text-xs"
                  />
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleExport} title="Export logs">
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={clearLogs} title="Clear logs">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              {/* Level Filter */}
              <div className="flex items-center gap-1 flex-wrap">
                {(['all', 'error', 'warn', 'info', 'debug', 'success'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setLevelFilter(level)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                      levelFilter === level 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                    <span className="ml-1 opacity-60">({logCounts[level]})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Log List */}
            <div className="flex-1 overflow-auto p-2 space-y-1">
              {filteredLogs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No logs match your filters</p>
                  {logs.length === 0 && (
                    <p className="text-xs mt-1">Run system checks to generate logs</p>
                  )}
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className={cn(
                      "text-xs p-2.5 rounded-lg border transition-colors",
                      log.level === 'error' && "bg-red-500/5 border-red-500/20",
                      log.level === 'warn' && "bg-yellow-500/5 border-yellow-500/20",
                      log.level === 'success' && "bg-green-500/5 border-green-500/20",
                      log.level === 'info' && "bg-blue-500/5 border-blue-500/20",
                      log.level === 'debug' && "bg-muted border-transparent"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <LogLevelIcon level={log.level} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-muted-foreground font-mono text-[10px]">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          <Badge variant="outline" className="text-[10px] h-4 px-1">
                            {log.category}
                          </Badge>
                          {log.source && (
                            <span className="text-[10px] text-muted-foreground truncate">
                              {log.source}
                            </span>
                          )}
                        </div>
                        <p className={cn(
                          "font-medium mt-0.5",
                          log.level === 'error' && "text-red-600",
                          log.level === 'warn' && "text-yellow-600",
                        )}>
                          {log.message}
                        </p>
                        {log.details && (
                          <pre className="mt-1.5 p-1.5 bg-black/5 rounded text-[10px] overflow-auto max-h-24">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="auth" className="mt-0 flex-1 overflow-auto p-4 space-y-4">
            {/* Auth Status */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">Authentication Status</h4>
              
              <div className="space-y-2">
                <StatusRow 
                  icon={<User className="h-4 w-4" />}
                  label="Signed In"
                  value={isSignedIn ? 'Yes' : 'No'}
                  status={isSignedIn ? 'success' : 'error'}
                />
                <StatusRow 
                  icon={<User className="h-4 w-4" />}
                  label="User ID"
                  value={userId || 'N/A'}
                  monospace
                />
                <StatusRow 
                  icon={<Shield className="h-4 w-4" />}
                  label="Organization ID"
                  value={orgId || 'N/A'}
                  monospace
                />
                <StatusRow 
                  icon={<Shield className="h-4 w-4" />}
                  label="JWT Role Claim"
                  value={jwtPayload?.role || 'N/A'}
                  status={jwtPayload?.role === 'authenticated' ? 'success' : 'error'}
                />
              </div>
            </div>

            {/* JWT Details */}
            {jwtPayload && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">JWT Payload</h4>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
                  {JSON.stringify({
                    sub: jwtPayload.sub,
                    role: jwtPayload.role,
                    iat: jwtPayload.iat ? new Date(jwtPayload.iat * 1000).toISOString() : undefined,
                    exp: jwtPayload.exp ? new Date(jwtPayload.exp * 1000).toISOString() : undefined,
                    iss: jwtPayload.iss,
                  }, null, 2)}
                </pre>
              </div>
            )}

            {/* Debug Mode Toggle */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Persistent Debug Mode</h4>
                  <p className="text-xs text-muted-foreground">Keep debug panel enabled across sessions</p>
                </div>
                <Button
                  variant={isDebugMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDebugMode(!isDebugMode)
                    localStorage.setItem('zeptodebug', String(!isDebugMode))
                  }}
                >
                  {isDebugMode ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="database" className="mt-0 flex-1 overflow-auto p-4 space-y-4">
            {/* Connection Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">Connection Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">Supabase URL</span>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[200px]">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '')}
                  </code>
                </div>
              </div>
            </div>

            {/* Quick Tests */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">Quick Tests</h4>
              <div className="grid grid-cols-2 gap-2">
                <TestButton 
                  label="Test Profiles"
                  disabled={!supabase}
                  onClick={async () => {
                    if (!supabase) {
                      logger.error('Supabase client not available')
                      return
                    }
                    logger.info('Testing profiles table...')
                    const start = performance.now()
                    const { data, error } = await supabase.from('profiles').select('*').limit(1)
                    const duration = Math.round(performance.now() - start)
                    if (error) {
                      logger.error('Profiles test failed', { error, duration: `${duration}ms` })
                    } else {
                      logger.success('Profiles test passed', { rows: data.length, duration: `${duration}ms` })
                    }
                  }}
                />
                <TestButton 
                  label="Test Transactions"
                  disabled={!supabase}
                  onClick={async () => {
                    if (!supabase) {
                      logger.error('Supabase client not available')
                      return
                    }
                    logger.info('Testing transactions table...')
                    const start = performance.now()
                    const { data, error } = await supabase.from('transactions').select('*').limit(1)
                    const duration = Math.round(performance.now() - start)
                    if (error) {
                      logger.error('Transactions test failed', { error, duration: `${duration}ms` })
                    } else {
                      logger.success('Transactions test passed', { rows: data.length, duration: `${duration}ms` })
                    }
                  }}
                />
                <TestButton 
                  label="Test Categories"
                  disabled={!supabase}
                  onClick={async () => {
                    if (!supabase) {
                      logger.error('Supabase client not available')
                      return
                    }
                    logger.info('Testing categories table...')
                    const start = performance.now()
                    const { data, error } = await supabase.from('categories').select('*').limit(1)
                    const duration = Math.round(performance.now() - start)
                    if (error) {
                      logger.error('Categories test failed', { error, duration: `${duration}ms` })
                    } else {
                      logger.success('Categories test passed', { rows: data.length, duration: `${duration}ms` })
                    }
                  }}
                />
                <TestButton 
                  label="Test Recurring"
                  disabled={!supabase}
                  onClick={async () => {
                    if (!supabase) {
                      logger.error('Supabase client not available')
                      return
                    }
                    logger.info('Testing recurring_transactions table...')
                    const start = performance.now()
                    const { data, error } = await supabase.from('recurring_transactions').select('*').limit(1)
                    const duration = Math.round(performance.now() - start)
                    if (error) {
                      logger.error('Recurring transactions test failed', { error, duration: `${duration}ms` })
                    } else {
                      logger.success('Recurring transactions test passed', { rows: data.length, duration: `${duration}ms` })
                    }
                  }}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0 flex-1 flex flex-col min-h-0 overflow-hidden">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      )}
    </Card>
  )
}

// Helper Components

function StatusIcon({ status }: { status: SystemCheck['status'] }) {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500 shrink-0" />
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
    case 'checking':
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500 shrink-0" />
    default:
      return <div className="h-4 w-4 rounded-full border-2 border-muted shrink-0" />
  }
}

function StatusBadge({ status, message }: { status: SystemCheck['status']; message: string }) {
  return (
    <span className={cn(
      "text-xs font-medium",
      status === 'success' && "text-green-600",
      status === 'error' && "text-red-600",
      status === 'warning' && "text-yellow-600",
      status === 'checking' && "text-blue-600",
      status === 'pending' && "text-muted-foreground"
    )}>
      {message}
    </span>
  )
}

function LogLevelIcon({ level }: { level: LogLevel }) {
  switch (level) {
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500 shrink-0" />
    case 'warn':
      return <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
    case 'info':
      return <Wifi className="h-4 w-4 text-blue-500 shrink-0" />
    default:
      return <Terminal className="h-4 w-4 text-muted-foreground shrink-0" />
  }
}

function StatusRow({ 
  icon, 
  label, 
  value, 
  status,
  monospace 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  status?: 'success' | 'error' | 'warning'
  monospace?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className={cn(
        "text-sm font-medium",
        monospace && "font-mono text-xs",
        status === 'success' && "text-green-600",
        status === 'error' && "text-red-600",
        !status && "text-foreground"
      )}>
        {value}
      </span>
    </div>
  )
}

function TestButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button 
      size="sm" 
      variant="outline" 
      className="text-xs justify-start"
      onClick={onClick}
      disabled={disabled}
    >
      <Database className="h-3 w-3 mr-1.5 shrink-0" />
      {label}
    </Button>
  )
}
