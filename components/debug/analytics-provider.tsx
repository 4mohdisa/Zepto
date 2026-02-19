'use client'

import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react'
import { useDebug } from './debug-provider'

export interface FunctionCall {
  id: string
  functionName: string
  category: string
  startTime: number
  endTime?: number
  duration?: number
  success: boolean
  error?: string
  inputSize?: number
  outputSize?: number
  metadata?: Record<string, any>
  timestamp: Date
}

export interface FunctionStats {
  functionName: string
  category: string
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  averageDuration: number
  minDuration: number
  maxDuration: number
  lastCalled: Date | null
  errorRate: number
  recentCalls: FunctionCall[]
}

export interface CategoryStats {
  category: string
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  averageDuration: number
  errorRate: number
  functions: string[]
}

interface AnalyticsContextValue {
  calls: FunctionCall[]
  stats: Map<string, FunctionStats>
  categoryStats: Map<string, CategoryStats>
  trackFunction: <T>(
    functionName: string,
    category: string,
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ) => Promise<T>
  startTracking: (functionName: string, category: string, metadata?: Record<string, any>) => string
  endTracking: (callId: string, success: boolean, error?: string, metadata?: Record<string, any>) => void
  getFunctionStats: (functionName: string) => FunctionStats | undefined
  getCategoryStats: (category: string) => CategoryStats | undefined
  clearAnalytics: () => void
  exportAnalytics: () => string
  isAnalyticsEnabled: boolean
  setAnalyticsEnabled: (enabled: boolean) => void
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null)

const MAX_STORED_CALLS = 1000
const MAX_RECENT_CALLS_PER_FUNCTION = 50

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [calls, setCalls] = useState<FunctionCall[]>([])
  const [stats, setStats] = useState<Map<string, FunctionStats>>(new Map())
  const [categoryStats, setCategoryStats] = useState<Map<string, CategoryStats>>(new Map())
  const [isAnalyticsEnabled, setAnalyticsEnabled] = useState(true)
  const [activeCalls, setActiveCalls] = useState<Map<string, FunctionCall>>(new Map())
  const { addLog } = useDebug()
  
  // Refs to avoid dependency issues
  const addLogRef = useRef(addLog)
  addLogRef.current = addLog
  const callsRef = useRef(calls)
  callsRef.current = calls

  // Calculate stats from calls
  const calculateStats = useCallback((callsList: FunctionCall[]) => {
    const functionMap = new Map<string, FunctionStats>()
    const categoryMap = new Map<string, CategoryStats>()

    callsList.forEach(call => {
      // Update function stats
      const existingStats = functionMap.get(call.functionName)
      if (existingStats) {
        const durations = existingStats.recentCalls
          .map(c => c.duration)
          .filter((d): d is number => d !== undefined)
        
        if (call.duration !== undefined) {
          durations.push(call.duration)
        }

        const allDurations = durations.slice(-100)
        const avgDuration = allDurations.length > 0 
          ? allDurations.reduce((a, b) => a + b, 0) / allDurations.length 
          : 0

        functionMap.set(call.functionName, {
          ...existingStats,
          totalCalls: existingStats.totalCalls + 1,
          successfulCalls: call.success 
            ? existingStats.successfulCalls + 1 
            : existingStats.successfulCalls,
          failedCalls: !call.success 
            ? existingStats.failedCalls + 1 
            : existingStats.failedCalls,
          averageDuration: avgDuration,
          minDuration: call.duration !== undefined 
            ? Math.min(existingStats.minDuration, call.duration)
            : existingStats.minDuration,
          maxDuration: call.duration !== undefined 
            ? Math.max(existingStats.maxDuration, call.duration)
            : existingStats.maxDuration,
          lastCalled: call.timestamp,
          errorRate: ((existingStats.failedCalls + (call.success ? 0 : 1)) / (existingStats.totalCalls + 1)) * 100,
          recentCalls: [...existingStats.recentCalls, call].slice(-MAX_RECENT_CALLS_PER_FUNCTION)
        })
      } else {
        functionMap.set(call.functionName, {
          functionName: call.functionName,
          category: call.category,
          totalCalls: 1,
          successfulCalls: call.success ? 1 : 0,
          failedCalls: call.success ? 0 : 1,
          averageDuration: call.duration || 0,
          minDuration: call.duration || 0,
          maxDuration: call.duration || 0,
          lastCalled: call.timestamp,
          errorRate: call.success ? 0 : 100,
          recentCalls: [call]
        })
      }

      // Update category stats
      const existingCategoryStats = categoryMap.get(call.category)
      if (existingCategoryStats) {
        const functions = new Set([...existingCategoryStats.functions, call.functionName])
        categoryMap.set(call.category, {
          ...existingCategoryStats,
          totalCalls: existingCategoryStats.totalCalls + 1,
          successfulCalls: call.success 
            ? existingCategoryStats.successfulCalls + 1 
            : existingCategoryStats.successfulCalls,
          failedCalls: !call.success 
            ? existingCategoryStats.failedCalls + 1 
            : existingCategoryStats.failedCalls,
          errorRate: ((existingCategoryStats.failedCalls + (call.success ? 0 : 1)) / (existingCategoryStats.totalCalls + 1)) * 100,
          functions: Array.from(functions)
        })
      } else {
        categoryMap.set(call.category, {
          category: call.category,
          totalCalls: 1,
          successfulCalls: call.success ? 1 : 0,
          failedCalls: call.success ? 0 : 1,
          averageDuration: 0,
          errorRate: call.success ? 0 : 100,
          functions: [call.functionName]
        })
      }
    })

    // Calculate average duration for categories
    categoryMap.forEach((catStats, category) => {
      const categoryCalls = callsList.filter(c => c.category === category && c.duration !== undefined)
      if (categoryCalls.length > 0) {
        catStats.averageDuration = categoryCalls.reduce((sum, c) => sum + (c.duration || 0), 0) / categoryCalls.length
      }
    })

    setStats(functionMap)
    setCategoryStats(categoryMap)
  }, [])

  // Recalculate stats when calls change
  useEffect(() => {
    calculateStats(calls)
  }, [calls, calculateStats])

  const startTracking = useCallback((
    functionName: string,
    category: string,
    metadata?: Record<string, any>
  ): string => {
    if (!isAnalyticsEnabled) return ''

    const callId = `${functionName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const call: FunctionCall = {
      id: callId,
      functionName,
      category,
      startTime: performance.now(),
      success: false,
      timestamp: new Date(),
      metadata
    }

    setActiveCalls(prev => new Map(prev.set(callId, call)))
    
    return callId
  }, [isAnalyticsEnabled])

  const endTracking = useCallback((
    callId: string,
    success: boolean,
    error?: string,
    metadata?: Record<string, any>
  ): void => {
    if (!isAnalyticsEnabled || !callId) return

    setActiveCalls(prev => {
      const call = prev.get(callId)
      if (!call) return prev

      const endTime = performance.now()
      const duration = endTime - call.startTime

      const completedCall: FunctionCall = {
        ...call,
        endTime,
        duration,
        success,
        error,
        metadata: { ...call.metadata, ...metadata }
      }

      setCalls(prevCalls => {
        const newCalls = [completedCall, ...prevCalls]
        return newCalls.slice(0, MAX_STORED_CALLS)
      })

      // Log significant events using ref
      if (!success) {
        addLogRef.current('error', 'Analytics', `Failed: ${call.functionName}`, { 
          duration: Math.round(duration),
          error,
          category: call.category 
        })
      } else if (duration > 5000) {
        addLogRef.current('warn', 'Analytics', `Slow: ${call.functionName}`, { 
          duration: Math.round(duration),
          category: call.category 
        })
      }

      const newMap = new Map(prev)
      newMap.delete(callId)
      return newMap
    })
  }, [isAnalyticsEnabled])

  const trackFunction = useCallback(async <T,>(
    functionName: string,
    category: string,
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<T> => {
    if (!isAnalyticsEnabled) {
      return fn()
    }

    const callId = startTracking(functionName, category, metadata)
    
    try {
      const result = await fn()
      endTracking(callId, true)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      endTracking(callId, false, errorMessage)
      throw error
    }
  }, [isAnalyticsEnabled, startTracking, endTracking])

  const getFunctionStats = useCallback((functionName: string): FunctionStats | undefined => {
    return stats.get(functionName)
  }, [stats])

  const getCategoryStats = useCallback((category: string): CategoryStats | undefined => {
    return categoryStats.get(category)
  }, [categoryStats])

  const clearAnalytics = useCallback(() => {
    setCalls([])
    setStats(new Map())
    setCategoryStats(new Map())
    setActiveCalls(new Map())
    addLogRef.current('info', 'Analytics', 'Analytics data cleared')
  }, [])

  const exportAnalytics = useCallback(() => {
    const currentCalls = callsRef.current
    const data = {
      exportedAt: new Date().toISOString(),
      totalCalls: currentCalls.length,
      functionStats: Array.from(stats.values()),
      categoryStats: Array.from(categoryStats.values()),
      recentCalls: currentCalls.slice(0, 100)
    }
    return JSON.stringify(data, null, 2)
  }, [stats, categoryStats])

  // Stable context value
  const value = React.useMemo(() => ({
    calls,
    stats,
    categoryStats,
    trackFunction,
    startTracking,
    endTracking,
    getFunctionStats,
    getCategoryStats,
    clearAnalytics,
    exportAnalytics,
    isAnalyticsEnabled,
    setAnalyticsEnabled
  }), [calls, stats, categoryStats, trackFunction, startTracking, endTracking, getFunctionStats, getCategoryStats, clearAnalytics, exportAnalytics, isAnalyticsEnabled])

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}

// Hook to create a tracked version of a function
export function useTrackedFunction<T extends (...args: any[]) => any>(
  fn: T,
  functionName: string,
  category: string
): T {
  const { trackFunction } = useAnalytics()
  
  // Use refs to avoid dependency issues
  const fnRef = useRef(fn)
  fnRef.current = fn
  const trackFunctionRef = useRef(trackFunction)
  trackFunctionRef.current = trackFunction
  const functionNameRef = useRef(functionName)
  functionNameRef.current = functionName
  const categoryRef = useRef(category)
  categoryRef.current = category
  
  return React.useCallback(async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return trackFunctionRef.current(
      functionNameRef.current,
      categoryRef.current,
      () => fnRef.current(...args),
      { args: args.map(arg => typeof arg === 'object' ? '[Object]' : arg) }
    ) as Promise<ReturnType<T>>
  }, []) as T
}

// Hook to track a callback
export function useTrackedCallback<T extends (...args: any[]) => any>(
  callback: T,
  functionName: string,
  category: string,
  deps: React.DependencyList = []
): T {
  const { trackFunction } = useAnalytics()
  
  // Use refs to avoid dependency issues
  const callbackRef = useRef(callback)
  callbackRef.current = callback
  const trackFunctionRef = useRef(trackFunction)
  trackFunctionRef.current = trackFunction
  const functionNameRef = useRef(functionName)
  functionNameRef.current = functionName
  const categoryRef = useRef(category)
  categoryRef.current = category
  
  return React.useCallback(async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return trackFunctionRef.current(
      functionNameRef.current,
      categoryRef.current,
      () => callbackRef.current(...args),
      { argsCount: args.length }
    ) as Promise<ReturnType<T>>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps) as T
}
