'use client'

import { useState, useMemo } from 'react'
import { useAnalytics, type FunctionStats, type CategoryStats } from './analytics-provider'
import { 
  Activity, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Timer,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function AnalyticsDashboard() {
  const { 
    calls, 
    stats, 
    categoryStats, 
    clearAnalytics, 
    exportAnalytics,
    isAnalyticsEnabled,
    setAnalyticsEnabled 
  } = useAnalytics()
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(new Set())

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalCalls = calls.length
    const successfulCalls = calls.filter(c => c.success).length
    const failedCalls = totalCalls - successfulCalls
    const avgDuration = totalCalls > 0 
      ? calls.reduce((sum, c) => sum + (c.duration || 0), 0) / totalCalls 
      : 0
    const errorRate = totalCalls > 0 ? (failedCalls / totalCalls) * 100 : 0

    // Get slowest functions
    const functionAvgDurations = Array.from(stats.values())
      .filter(s => s.totalCalls > 0)
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 5)

    // Get most error-prone functions
    const errorProneFunctions = Array.from(stats.values())
      .filter(s => s.totalCalls > 0 && s.errorRate > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 5)

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      avgDuration,
      errorRate,
      slowestFunctions: functionAvgDurations,
      errorProneFunctions
    }
  }, [calls, stats])

  // Filter functions
  const filteredFunctions = useMemo(() => {
    let functions = Array.from(stats.values())
    
    if (selectedCategory !== 'all') {
      functions = functions.filter(f => f.category === selectedCategory)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      functions = functions.filter(f => 
        f.functionName.toLowerCase().includes(query) ||
        f.category.toLowerCase().includes(query)
      )
    }
    
    return functions.sort((a, b) => b.totalCalls - a.totalCalls)
  }, [stats, selectedCategory, searchQuery])

  // Get all categories
  const categories = useMemo(() => {
    return Array.from(categoryStats.keys()).sort()
  }, [categoryStats])

  const toggleExpanded = (functionName: string) => {
    setExpandedFunctions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(functionName)) {
        newSet.delete(functionName)
      } else {
        newSet.add(functionName)
      }
      return newSet
    })
  }

  const handleExport = () => {
    const data = exportAnalytics()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isAnalyticsEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Activity className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Analytics Disabled</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Enable analytics to track function performance and usage patterns.
        </p>
        <Button onClick={() => setAnalyticsEnabled(true)}>
          Enable Analytics
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-4 border-b">
        <StatCard
          title="Total Calls"
          value={overallStats.totalCalls.toString()}
          icon={Activity}
          color="text-blue-500"
        />
        <StatCard
          title="Success Rate"
          value={`${((overallStats.successfulCalls / (overallStats.totalCalls || 1)) * 100).toFixed(1)}%`}
          icon={CheckCircle}
          color="text-green-500"
        />
        <StatCard
          title="Avg Duration"
          value={`${Math.round(overallStats.avgDuration)}ms`}
          icon={Clock}
          color="text-purple-500"
        />
        <StatCard
          title="Error Rate"
          value={`${overallStats.errorRate.toFixed(1)}%`}
          icon={AlertCircle}
          color={overallStats.errorRate > 5 ? "text-red-500" : "text-yellow-500"}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 p-3 border-b">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search functions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-7 text-xs"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-8 px-2 text-xs border rounded bg-background"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={clearAnalytics}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Performers */}
        {(overallStats.slowestFunctions.length > 0 || overallStats.errorProneFunctions.length > 0) && (
          <div className="p-4 space-y-4">
            {overallStats.slowestFunctions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                  <Timer className="h-3.5 w-3.5" />
                  Slowest Functions (Avg)
                </h4>
                <div className="space-y-1">
                  {overallStats.slowestFunctions.map(func => (
                    <div 
                      key={func.functionName}
                      className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30 text-xs"
                    >
                      <span className="font-medium truncate">{func.functionName}</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(func.averageDuration)}ms
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {overallStats.errorProneFunctions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Error-Prone Functions
                </h4>
                <div className="space-y-1">
                  {overallStats.errorProneFunctions.map(func => (
                    <div 
                      key={func.functionName}
                      className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30 text-xs"
                    >
                      <span className="font-medium truncate">{func.functionName}</span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          func.errorRate > 50 ? "border-red-500 text-red-500" : "border-yellow-500 text-yellow-500"
                        )}
                      >
                        {func.errorRate.toFixed(1)}% errors
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Function List */}
        <div className="p-4 space-y-2">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">
            Function Details ({filteredFunctions.length})
          </h4>
          
          {filteredFunctions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              No functions tracked yet. Analytics will appear as functions are called.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFunctions.map(func => (
                <FunctionCard
                  key={func.functionName}
                  stats={func}
                  isExpanded={expandedFunctions.has(func.functionName)}
                  onToggle={() => toggleExpanded(func.functionName)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon: Icon,
  color
}: { 
  title: string
  value: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground uppercase">{title}</span>
        <Icon className={cn("h-3.5 w-3.5", color)} />
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}

function FunctionCard({ 
  stats, 
  isExpanded, 
  onToggle 
}: { 
  stats: FunctionStats
  isExpanded: boolean
  onToggle: () => void
}) {
  const successRate = stats.totalCalls > 0 
    ? (stats.successfulCalls / stats.totalCalls) * 100 
    : 0

  return (
    <Card className={cn("overflow-hidden", isExpanded && "border-primary")}>
      <CardHeader 
        className="py-2 px-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0">
              <CardTitle className="text-xs font-medium truncate">
                {stats.functionName}
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">{stats.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-[10px] h-5">
              {stats.totalCalls} calls
            </Badge>
            {stats.errorRate > 0 && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] h-5",
                  stats.errorRate > 50 ? "border-red-500 text-red-500" : "border-yellow-500 text-yellow-500"
                )}
              >
                {stats.errorRate.toFixed(0)}% err
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="py-2 px-3 pt-0">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between py-1 border-b border-muted">
              <span className="text-muted-foreground">Success Rate</span>
              <span className={cn(
                successRate >= 95 ? "text-green-600" : successRate >= 80 ? "text-yellow-600" : "text-red-600"
              )}>
                {successRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-muted">
              <span className="text-muted-foreground">Avg Duration</span>
              <span>{Math.round(stats.averageDuration)}ms</span>
            </div>
            <div className="flex justify-between py-1 border-b border-muted">
              <span className="text-muted-foreground">Min/Max</span>
              <span>{Math.round(stats.minDuration)}ms / {Math.round(stats.maxDuration)}ms</span>
            </div>
            <div className="flex justify-between py-1 border-b border-muted">
              <span className="text-muted-foreground">Last Called</span>
              <span>{stats.lastCalled ? new Date(stats.lastCalled).toLocaleTimeString() : 'Never'}</span>
            </div>
          </div>
          
          {stats.recentCalls.length > 0 && (
            <div className="mt-3">
              <h5 className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                Recent Calls
              </h5>
              <div className="space-y-1">
                {stats.recentCalls.slice(0, 5).map((call, idx) => (
                  <div 
                    key={call.id}
                    className="flex items-center justify-between py-1 px-2 rounded bg-muted/30 text-[10px]"
                  >
                    <div className="flex items-center gap-2">
                      {call.success ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                      <span>{new Date(call.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {call.duration !== undefined && (
                        <span className="text-muted-foreground">{Math.round(call.duration)}ms</span>
                      )}
                      {call.error && (
                        <span className="text-red-500 truncate max-w-[100px]" title={call.error}>
                          {call.error}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
