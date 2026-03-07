'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  debugLogger, 
  type DebugEvent, 
  type AIDiagnosticsBundle,
  type SystemHealth 
} from '@/lib/utils/debug-logger'
import { useDebugEvents } from '@/hooks/use-debug-events'
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Terminal,
  Database,
  Server,
  Wifi,
  WifiOff,
  Copy,
  Download,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Bug,
  MessageSquare,
  Stethoscope,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Tab = 'overview' | 'errors' | 'requests' | 'ai-diagnostics'

export function DebugConsole() {
  const [events, setEvents] = useState<DebugEvent[]>([])
  const [selectedTab, setSelectedTab] = useState<Tab>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [diagnostics, setDiagnostics] = useState<AIDiagnosticsBundle | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(false)

  // Subscribe to debug events
  useEffect(() => {
    setEvents(debugLogger.getEvents())
    return debugLogger.subscribe((newEvents) => {
      setEvents(newEvents)
    })
  }, [])

  // Refresh diagnostics
  const refreshDiagnostics = useCallback(async () => {
    setIsLoadingDiagnostics(true)
    try {
      const diag = await debugLogger.generateAIDiagnostics()
      setDiagnostics(diag)
      setHealth(diag.health)
    } catch (e) {
      console.error('Failed to generate diagnostics:', e)
    } finally {
      setIsLoadingDiagnostics(false)
    }
  }, [])

  // Initial diagnostics load
  useEffect(() => {
    refreshDiagnostics()
  }, [refreshDiagnostics])

  // Filtered events
  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchQuery || 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.errorMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.route?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = selectedTypes.size === 0 || selectedTypes.has(event.type)
    
    return matchesSearch && matchesType
  })

  const errorEvents = events.filter(e => e.status === 'error' || e.type.includes('ERROR'))
  const apiEvents = events.filter(e => e.scope === 'api' || e.scope === 'supabase')

  // Copy status message
  const copyStatusMessage = async () => {
    try {
      const message = await debugLogger.generateStatusMessage()
      await navigator.clipboard.writeText(message)
      toast.success('Status message copied to clipboard')
    } catch (e) {
      toast.error('Failed to copy status')
    }
  }

  // Copy AI JSON bundle
  const copyAIBundle = async () => {
    try {
      const bundle = await debugLogger.generateAIDiagnostics()
      await navigator.clipboard.writeText(JSON.stringify(bundle, null, 2))
      toast.success('AI diagnostics bundle copied to clipboard')
    } catch (e) {
      toast.error('Failed to copy diagnostics')
    }
  }

  // Export all events
  const exportEvents = () => {
    const data = JSON.stringify(events, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-events-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Events exported')
  }

  // Clear events
  const clearEvents = () => {
    debugLogger.clear()
    toast.success('Events cleared')
  }

  // Toggle event expansion
  const toggleEvent = (id: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedEvents(newExpanded)
  }

  // Format timestamp
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-purple-600" />
          <h2 className="font-semibold text-gray-900">Debug Console</h2>
          <Badge variant="secondary" className="text-xs">
            {events.length} events
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyStatusMessage}>
            <MessageSquare className="h-4 w-4 mr-1" />
            Copy Status
          </Button>
          <Button variant="outline" size="sm" onClick={copyAIBundle}>
            <Cpu className="h-4 w-4 mr-1" />
            AI Bundle
          </Button>
          <Button variant="outline" size="sm" onClick={exportEvents}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={clearEvents}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as Tab)} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Errors
            {errorEvents.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {errorEvents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-1">
            <Server className="h-4 w-4" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="ai-diagnostics" className="flex items-center gap-1">
            <Stethoscope className="h-4 w-4" />
            AI Feed
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Health Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {health?.isHealthy ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn(
                  "text-2xl font-bold",
                  health?.isHealthy ? "text-green-600" : "text-red-600"
                )}>
                  {health?.isHealthy ? 'Healthy' : 'Issues'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {health?.checks.length || 0} checks run
                </p>
              </CardContent>
            </Card>

            {/* Error Count */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn(
                  "text-2xl font-bold",
                  errorEvents.length > 0 ? "text-red-600" : "text-green-600"
                )}>
                  {errorEvents.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Last 500 events
                </p>
              </CardContent>
            </Card>

            {/* API Calls */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Server className="h-4 w-4 text-blue-500" />
                  API Calls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                  {apiEvents.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supabase + App API
                </p>
              </CardContent>
            </Card>

            {/* Cache Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4 text-purple-500" />
                  Cache
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-purple-600">
                    {events.filter(e => e.type === 'CACHE_HIT').length}
                  </p>
                  <span className="text-xs text-gray-500">hits</span>
                  <span className="text-gray-300">|</span>
                  <p className="text-xl font-bold text-gray-500">
                    {events.filter(e => e.type === 'CACHE_MISS').length}
                  </p>
                  <span className="text-xs text-gray-500">misses</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {events.filter(e => e.type === 'CACHE_INVALIDATE').length} invalidations
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Health Check Details */}
          {health && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Health Check Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {health.checks.map((check, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        {check.status === 'pass' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : check.status === 'fail' ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm">{check.name}</span>
                      </div>
                      <div className="text-right">
                        {check.duration !== undefined && (
                          <span className="text-xs text-gray-500 mr-2">{check.duration}ms</span>
                        )}
                        <Badge 
                          variant={check.status === 'pass' ? 'default' : check.status === 'fail' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {check.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Errors Preview */}
          {errorEvents.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recent Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {errorEvents.slice(-5).reverse().map((event, i) => (
                    <div key={event.id} className="text-sm border-l-2 border-red-300 pl-2 py-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-red-700">[{event.type}] {event.name}</span>
                        <span className="text-xs text-gray-400">{formatTime(event.ts)}</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{event.errorMessage}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="flex-1 p-4 overflow-auto">
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search errors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <div className="space-y-2">
            {errorEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No errors captured</p>
              </div>
            ) : (
              errorEvents.filter(e => 
                !searchQuery || 
                e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.errorMessage?.toLowerCase().includes(searchQuery.toLowerCase())
              ).reverse().map(event => (
                <ErrorEventCard 
                  key={event.id} 
                  event={event} 
                  isExpanded={expandedEvents.has(event.id)}
                  onToggle={() => toggleEvent(event.id)}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="flex-1 p-4 overflow-auto">
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Filter requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <div className="space-y-2">
            {apiEvents.filter(e => 
              !searchQuery || 
              e.route?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              e.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).reverse().map(event => (
              <RequestEventCard 
                key={event.id} 
                event={event}
                isExpanded={expandedEvents.has(event.id)}
                onToggle={() => toggleEvent(event.id)}
              />
            ))}
          </div>
        </TabsContent>

        {/* AI Diagnostics Tab */}
        <TabsContent value="ai-diagnostics" className="flex-1 p-4 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">AI Diagnostics Feed</h3>
              <p className="text-sm text-gray-500">Export system status for AI analysis</p>
            </div>
            <Button onClick={refreshDiagnostics} disabled={isLoadingDiagnostics}>
              <RefreshCw className={cn("h-4 w-4 mr-1", isLoadingDiagnostics && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {diagnostics && (
            <div className="space-y-4">
              {/* Status Message Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Status Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48 font-mono whitespace-pre-wrap">
                    {diagnostics.health.summary}
                  </pre>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2" 
                    onClick={copyStatusMessage}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Status
                  </Button>
                </CardContent>
              </Card>

              {/* JSON Bundle Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    JSON Diagnostics Bundle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64 font-mono">
                    {JSON.stringify(diagnostics, null, 2)}
                  </pre>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2" 
                    onClick={copyAIBundle}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy JSON Bundle
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-gray-500">Recent Events</p>
                    <p className="text-xl font-bold">{diagnostics.recentEvents.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-gray-500">Recent Errors</p>
                    <p className="text-xl font-bold text-red-600">{diagnostics.recentErrors.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-gray-500">Auth Provider</p>
                    <p className="text-xl font-bold capitalize">{diagnostics.auth.provider}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-gray-500">Supabase URL</p>
                    <p className="text-xs font-mono truncate">{diagnostics.supabase.url.slice(0, 20)}...</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Error Event Card Component
function ErrorEventCard({ 
  event, 
  isExpanded, 
  onToggle 
}: { 
  event: DebugEvent
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <div 
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="font-medium text-sm">[{event.type}] {event.name}</span>
          <span className="text-xs text-gray-400">
            {new Date(event.ts).toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {event.errorCode && (
            <Badge variant="outline" className="text-xs font-mono">
              {event.errorCode}
            </Badge>
          )}
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-3 pb-3 border-t bg-gray-50">
          <p className="text-sm text-red-700 mt-2">{event.errorMessage}</p>
          {event.errorDetails && (
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-48">
              {typeof event.errorDetails === 'string' 
                ? event.errorDetails 
                : JSON.stringify(event.errorDetails, null, 2)}
            </pre>
          )}
          {event.stack && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-500">Stack Trace:</p>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32 mt-1">
                {event.stack}
              </pre>
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigator.clipboard.writeText(JSON.stringify(event, null, 2))}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy Event
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Request Event Card Component
function RequestEventCard({ 
  event, 
  isExpanded, 
  onToggle 
}: { 
  event: DebugEvent
  isExpanded: boolean
  onToggle: () => void
}) {
  const isSlow = event.durationMs && event.durationMs > 1000
  
  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <div 
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {event.status === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          <span className="font-medium text-sm">{event.method} {event.name}</span>
          <span className="text-xs text-gray-400">
            {new Date(event.ts).toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {event.durationMs && (
            <span className={cn(
              "text-xs",
              isSlow ? "text-orange-600 font-medium" : "text-gray-500"
            )}>
              {event.durationMs}ms
            </span>
          )}
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-3 pb-3 border-t bg-gray-50">
          <div className="mt-2 space-y-1 text-sm">
            {event.route && <p><span className="text-gray-500">Route:</span> {event.route}</p>}
            {event.supabaseTable && <p><span className="text-gray-500">Table:</span> {event.supabaseTable}</p>}
            {event.supabaseOp && <p><span className="text-gray-500">Operation:</span> {event.supabaseOp}</p>}
            {event.durationMs && <p><span className="text-gray-500">Duration:</span> {event.durationMs}ms</p>}
          </div>
          {event.errorMessage && (
            <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
              {event.errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
