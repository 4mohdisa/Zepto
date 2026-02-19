'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useSupabaseClient } from '@/utils/supabase/client'
import { 
  Bug, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Database, 
  Shield, 
  User, 
  Wifi,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Terminal,
  Copy,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DebugLog {
  id: string
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'success'
  category: string
  message: string
  details?: any
}

interface SystemCheck {
  name: string
  status: 'pending' | 'checking' | 'success' | 'error' | 'warning'
  message: string
  details?: string
}

export function ComprehensiveDebug() {
  const { getToken, userId, isSignedIn, isLoaded, orgId } = useAuth()
  const supabase = useSupabaseClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'network' | 'database'>('overview')
  const [logs, setLogs] = useState<DebugLog[]>([])
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([
    { name: 'Authentication', status: 'pending', message: 'Not checked' },
    { name: 'Supabase Connection', status: 'pending', message: 'Not checked' },
    { name: 'Database Access', status: 'pending', message: 'Not checked' },
    { name: 'RLS Policies', status: 'pending', message: 'Not checked' },
  ])
  const [jwtPayload, setJwtPayload] = useState<any>(null)
  const [networkRequests, setNetworkRequests] = useState<any[]>([])

  const addLog = useCallback((level: DebugLog['level'], category: string, message: string, details?: any) => {
    const newLog: DebugLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      category,
      message,
      details
    }
    setLogs(prev => [newLog, ...prev].slice(0, 100)) // Keep last 100 logs
  }, [])

  const updateCheck = useCallback((name: string, status: SystemCheck['status'], message: string, details?: string) => {
    setSystemChecks(prev => prev.map(check => 
      check.name === name ? { ...check, status, message, details } : check
    ))
  }, [])

  const runSystemChecks = useCallback(async () => {
    addLog('info', 'System', 'Starting system checks...')

    // Check 1: Authentication
    updateCheck('Authentication', 'checking', 'Verifying auth state...')
    if (!isLoaded) {
      updateCheck('Authentication', 'warning', 'Auth still loading', 'Wait for auth to initialize')
      addLog('warn', 'Auth', 'Authentication still loading')
    } else if (!isSignedIn) {
      updateCheck('Authentication', 'error', 'Not signed in', 'User needs to sign in')
      addLog('error', 'Auth', 'User not signed in')
    } else {
      updateCheck('Authentication', 'success', `Signed in as ${userId?.substring(0, 15)}...`)
      addLog('success', 'Auth', `User authenticated: ${userId}`)
    }

    // Check 2: Supabase Connection
    updateCheck('Supabase Connection', 'checking', 'Testing connection...')
    try {
      const { error } = await supabase.from('profiles').select('count').limit(0)
      if (error) {
        updateCheck('Supabase Connection', 'error', 'Connection failed', error.message)
        addLog('error', 'Supabase', 'Connection failed', error)
      } else {
        updateCheck('Supabase Connection', 'success', 'Connected')
        addLog('success', 'Supabase', 'Connection successful')
      }
    } catch (err) {
      updateCheck('Supabase Connection', 'error', 'Exception', String(err))
      addLog('error', 'Supabase', 'Connection exception', err)
    }

    // Check 3: Database Access
    if (isSignedIn) {
      updateCheck('Database Access', 'checking', 'Testing data access...')
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('id')
          .limit(1)

        if (error) {
          if (error.code === '42501') {
            updateCheck('Database Access', 'error', 'RLS Policy Denied', 'Row Level Security is blocking access')
            addLog('error', 'Database', 'RLS policy violation', error)
          } else {
            updateCheck('Database Access', 'error', 'Query failed', error.message)
            addLog('error', 'Database', 'Query failed', error)
          }
        } else {
          updateCheck('Database Access', 'success', `Can read data (${data?.length || 0} rows)`)
          addLog('success', 'Database', 'Data access confirmed')
        }
      } catch (err) {
        updateCheck('Database Access', 'error', 'Exception', String(err))
        addLog('error', 'Database', 'Access exception', err)
      }

      // Check 4: RLS Policies - Try INSERT
      updateCheck('RLS Policies', 'checking', 'Testing INSERT policy...')
      try {
        // Try to insert and immediately rollback with a test that will fail validation
        const { error } = await supabase
          .from('transactions')
          .insert({
            user_id: 'test-invalid-user-id',
            name: 'RLS Test',
            amount: 0.01,
            type: 'Expense',
            date: new Date().toISOString().split('T')[0]
          })
          .select()

        if (error) {
          if (error.code === '42501' || error.message?.includes('violates row-level security')) {
            updateCheck('RLS Policies', 'success', 'INSERT policy working correctly')
            addLog('success', 'RLS', 'INSERT policy verified - correctly blocked unauthorized insert')
          } else {
            updateCheck('RLS Policies', 'warning', 'Unexpected error', error.message)
            addLog('warn', 'RLS', 'Unexpected error during test', error)
          }
        } else {
          // Insert succeeded - this means RLS might not be properly configured
          updateCheck('RLS Policies', 'warning', 'INSERT succeeded - verify RLS is enabled')
          addLog('warn', 'RLS', 'Test insert succeeded - RLS may be disabled')
        }
      } catch (err) {
        updateCheck('RLS Policies', 'error', 'Exception', String(err))
        addLog('error', 'RLS', 'Policy test exception', err)
      }
    } else {
      updateCheck('Database Access', 'warning', 'Skipped - not signed in')
      updateCheck('RLS Policies', 'warning', 'Skipped - not signed in')
    }

    addLog('info', 'System', 'System checks completed')
  }, [isLoaded, isSignedIn, userId, supabase, addLog, updateCheck])

  useEffect(() => {
    if (isOpen && isSignedIn) {
      // Decode JWT
      getToken().then(token => {
        if (token) {
          try {
            const base64Payload = token.split('.')[1]
            const jsonPayload = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'))
            const payload = JSON.parse(jsonPayload)
            setJwtPayload(payload)
            addLog('info', 'JWT', 'Token decoded successfully', { 
              sub: payload.sub,
              role: payload.role,
              iss: payload.iss
            })
          } catch (e) {
            addLog('error', 'JWT', 'Failed to decode token', e)
          }
        }
      })
    }
  }, [isOpen, isSignedIn, getToken, addLog])

  const clearLogs = () => {
    setLogs([])
    addLog('info', 'System', 'Logs cleared')
  }

  const copyLogs = () => {
    const logText = logs.map(l => 
      `[${l.timestamp.toISOString()}] [${l.level.toUpperCase()}] [${l.category}] ${l.message}`
    ).join('\n')
    navigator.clipboard.writeText(logText)
    addLog('success', 'System', 'Logs copied to clipboard')
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 gap-2"
        onClick={() => setIsOpen(true)}
      >
        <Bug className="h-4 w-4" />
        Debug
      </Button>
    )
  }

  return (
    <Card className={cn(
      "fixed right-4 z-50 shadow-2xl border-2 transition-all duration-200",
      isMinimized ? "bottom-4 w-auto" : "bottom-4 left-4 max-w-2xl max-h-[80vh] flex flex-col"
    )}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-orange-500" />
          <CardTitle className="text-sm font-semibold">Debug Panel</CardTitle>
          <Badge variant="outline" className="text-xs">
            {logs.length} logs
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          {/* Tabs */}
          <div className="flex border-b shrink-0">
            {(['overview', 'logs', 'network', 'database'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 text-xs font-medium capitalize transition-colors",
                  activeTab === tab 
                    ? "border-b-2 border-primary text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <CardContent className="p-0 overflow-auto flex-1 min-h-0">
            {activeTab === 'overview' && (
              <div className="p-4 space-y-4">
                {/* System Checks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">System Checks</h4>
                    <Button size="sm" variant="outline" className="h-6 text-xs" onClick={runSystemChecks}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Run Checks
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {systemChecks.map((check) => (
                      <div key={check.name} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/50 text-sm">
                        <div className="flex items-center gap-2">
                          {check.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {check.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                          {check.status === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                          {check.status === 'checking' && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
                          {check.status === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-muted" />}
                          <span className="font-medium">{check.name}</span>
                        </div>
                        <span className={cn(
                          "text-xs",
                          check.status === 'success' && "text-green-600",
                          check.status === 'error' && "text-red-600",
                          check.status === 'warning' && "text-yellow-600",
                        )}>
                          {check.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Auth Status */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Authentication</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Status:</span>
                    </div>
                    <div>
                      {!isLoaded ? (
                        <Badge variant="outline">Loading...</Badge>
                      ) : isSignedIn ? (
                        <Badge className="bg-green-500">Signed In</Badge>
                      ) : (
                        <Badge variant="destructive">Not Signed In</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">User ID:</span>
                    </div>
                    <div className="font-mono text-xs truncate">{userId || 'N/A'}</div>

                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Org ID:</span>
                    </div>
                    <div className="font-mono text-xs truncate">{orgId || 'N/A'}</div>

                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Role Claim:</span>
                    </div>
                    <div>
                      {jwtPayload?.role === 'authenticated' ? (
                        <Badge className="bg-green-500">authenticated</Badge>
                      ) : (
                        <Badge variant="destructive">{jwtPayload?.role || 'missing'}</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* JWT Preview */}
                {jwtPayload && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">JWT Claims</h4>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify({
                        sub: jwtPayload.sub,
                        role: jwtPayload.role,
                        iat: jwtPayload.iat,
                        exp: jwtPayload.exp,
                        iss: jwtPayload.iss
                      }, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-2 border-b shrink-0">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">Application Logs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={copyLogs}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={clearLogs}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-2 space-y-1">
                  {logs.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No logs yet. Run system checks to generate logs.
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div 
                        key={log.id} 
                        className={cn(
                          "text-xs p-2 rounded font-mono",
                          log.level === 'error' && "bg-red-500/10 text-red-600",
                          log.level === 'warn' && "bg-yellow-500/10 text-yellow-600",
                          log.level === 'success' && "bg-green-500/10 text-green-600",
                          log.level === 'info' && "bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          <Badge variant="outline" className="text-[10px] h-4">
                            {log.category}
                          </Badge>
                          <span className="font-medium">{log.message}</span>
                        </div>
                        {log.details && (
                          <pre className="mt-1 text-[10px] opacity-70 overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'network' && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                <Wifi className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Network monitoring coming soon...
              </div>
            )}

            {activeTab === 'database' && (
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Database Status</h4>
                  <div className="text-sm space-y-2">
                    <div className="flex items-center justify-between py-1">
                      <span>Supabase URL</span>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/https:\/\//, '').substring(0, 20)}...
                      </code>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Quick Queries</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs"
                      onClick={async () => {
                        addLog('info', 'Query', 'Testing profiles access...')
                        const { data, error } = await supabase.from('profiles').select('*').limit(1)
                        if (error) {
                          addLog('error', 'Query', 'Profiles query failed', error)
                        } else {
                          addLog('success', 'Query', `Profiles query succeeded: ${data.length} rows`)
                        }
                      }}
                    >
                      <Database className="h-3 w-3 mr-1" />
                      Test Profiles
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs"
                      onClick={async () => {
                        addLog('info', 'Query', 'Testing transactions access...')
                        const { data, error } = await supabase.from('transactions').select('*').limit(1)
                        if (error) {
                          addLog('error', 'Query', 'Transactions query failed', error)
                        } else {
                          addLog('success', 'Query', `Transactions query succeeded: ${data.length} rows`)
                        }
                      }}
                    >
                      <Database className="h-3 w-3 mr-1" />
                      Test Transactions
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </>
      )}
    </Card>
  )
}
