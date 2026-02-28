/**
 * Client-side data caching hook
 * Prevents refetching when revisiting pages within stale time
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { debugLogger } from '@/utils/debug-logger'

type CacheEntry<T> = {
  data: T
  timestamp: number
  staleTime: number
  isValidating?: boolean
}

const cache = new Map<string, CacheEntry<any>>()

interface UseDataCacheOptions<T> {
  key: string
  fetchFn: () => Promise<T>
  staleTime?: number // milliseconds, default 30 seconds
  enabled?: boolean
}

export function useDataCache<T>({
  key,
  fetchFn,
  staleTime = 30000, // 30 seconds default
  enabled = true,
}: UseDataCacheOptions<T>) {
  const [data, setData] = useState<T | null>(() => {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.staleTime) {
      return cached.data
    }
    return null
  })
  const [loading, setLoading] = useState(!data && enabled)
  const [error, setError] = useState<string | null>(null)
  const isFetchingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async (force = false) => {
    if (isFetchingRef.current) return
    
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    
    // Check cache first
    if (!force) {
      const cached = cache.get(key)
      if (cached && Date.now() - cached.timestamp < cached.staleTime) {
        setData(cached.data)
        setLoading(false)
        debugLogger.debug('cache', 'Cache hit', { key, age: Date.now() - cached.timestamp })
        return
      }
    }

    isFetchingRef.current = true
    setLoading(true)
    setError(null)

    try {
      debugLogger.debug('cache', 'Fetching fresh data', { key })
      const result = await fetchFn()
      
      // Update cache
      cache.set(key, {
        data: result,
        timestamp: Date.now(),
        staleTime,
      })
      
      setData(result)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const message = err instanceof Error ? err.message : 'Failed to fetch data'
      setError(message)
      debugLogger.error('cache', 'Fetch failed', { key, error: message })
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [key, fetchFn, staleTime])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData()
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [enabled, fetchData])

  // Manual refetch function
  const refetch = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  // Invalidate cache for this key
  const invalidate = useCallback(() => {
    cache.delete(key)
    debugLogger.debug('cache', 'Invalidated', { key })
  }, [key])

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
  }
}

// Hook specifically for dashboard data
export function useDashboardCache(period: string) {
  return useDataCache({
    key: `dashboard-${period}`,
    fetchFn: async () => {
      const response = await fetch(`/api/dashboard?period=${period}`)
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      return response.json()
    },
    staleTime: 60000, // 1 minute
  })
}

// Hook for transactions with filters
export function useTransactionsCache(filterKey: string, fetchFn: () => Promise<any>) {
  return useDataCache({
    key: `transactions-${filterKey}`,
    fetchFn,
    staleTime: 30000, // 30 seconds
  })
}

// Hook for recurring transactions
export function useRecurringCache(fetchFn: () => Promise<any>) {
  return useDataCache({
    key: 'recurring-transactions',
    fetchFn,
    staleTime: 60000, // 1 minute
  })
}

// Global cache invalidation helper
export function invalidateCache(pattern?: string) {
  if (pattern) {
    // Delete all keys matching pattern
    const keysToDelete: string[] = []
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => cache.delete(key))
    debugLogger.debug('cache', 'Invalidated pattern', { pattern, count: keysToDelete.length })
  } else {
    // Clear all cache
    const count = cache.size
    cache.clear()
    debugLogger.debug('cache', 'Cleared all', { count })
  }
}

export default useDataCache
