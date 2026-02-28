'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/auth-context'

// Cache for dashboard data
interface CacheEntry {
  data: DashboardData
  timestamp: number
}
const dashboardCache = new Map<string, CacheEntry>()
const CACHE_STALE_TIME = 30 * 1000 // 30 seconds

interface DashboardData {
  period: string
  total_balance: number
  balances_by_account: { account_type: string; current_balance: number }[]
  kpis: {
    income: number
    expenses: number
    net_balance: number
    savings_rate: number
  }
  daily_series: { date: string; income: number; expense: number }[]
  category_distribution: { name: string; total: number }[]
}

interface UseDashboardDataReturn {
  data: DashboardData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  invalidateCache: () => void
}

export function useDashboardData(period: string): UseDashboardDataReturn {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const cacheKey = `${user.id}:${period}`
    const cached = dashboardCache.get(cacheKey)
    const now = Date.now()

    // Use cache if available and not stale
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_STALE_TIME) {
      setData(cached.data)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/dashboard?period=${period}&account=all`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)
      
      // Update cache
      dashboardCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [period, user?.id])

  useEffect(() => {
    fetchData(false) // use cache if available
  }, [fetchData])

  // Invalidate cache for this period
  const invalidateCache = useCallback(() => {
    if (user?.id) {
      const cacheKey = `${user.id}:${period}`
      dashboardCache.delete(cacheKey)
    }
  }, [user?.id, period])

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true), // force refresh
    invalidateCache,
  }
}
