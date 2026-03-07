'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '@/providers'
import { debugLogger } from '@/lib/utils/debug-logger'

export interface Merchant {
  id: string
  user_id: string
  merchant_name: string
  normalized_name: string
  transaction_count: number
  last_used_at: string
  created_at: string
  updated_at: string
}

export type MerchantsErrorCode = 
  | 'AUTH_MISSING'
  | 'TABLE_MISSING' 
  | 'SCHEMA_MISMATCH'
  | 'PERMISSION_DENIED'
  | 'QUERY_ERROR'
  | 'INTERNAL_ERROR'
  | 'API_ROUTE_MISSING'
  | null

interface MerchantsError {
  message: string
  code: MerchantsErrorCode
  details?: string
  sqlHint?: string
}

interface BackfillStatus {
  transactionsCount: number
  merchantsCount: number
  hasTransactions: boolean
  hasMerchants: boolean
  needsBackfill: boolean
}

interface CacheMetadata {
  lastFetchAt: number | null
  lastInvalidateAt: number | null
  lastMutationAt: number | null
  isFetching: boolean
  cacheKey: string | null
}

interface UseMerchantsReturn {
  merchants: Merchant[]
  loading: boolean
  error: MerchantsError | null
  backfillStatus: BackfillStatus | null
  isBackfilling: boolean
  refetch: () => Promise<void>
  runBackfill: (options?: { dryRun?: boolean; useAI?: boolean }) => Promise<void>
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredMerchants: Merchant[]
  lastFetchDuration: number | null
  cacheMetadata: CacheMetadata
}

// Simple cache for merchants data
const merchantsCache = new Map<string, { data: Merchant[]; timestamp: number }>()
const CACHE_STALE_TIME = 30 * 1000 // 30 seconds

// Global cache metadata for debug visibility
const globalCacheMetadata: Record<string, CacheMetadata> = {}

// Listeners for cache invalidation events
const invalidationListeners = new Set<(userId: string) => void>()

export function useMerchants(): UseMerchantsReturn {
  const { user } = useAuth()
  const userIdRef = useRef<string | null>(null)
  
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<MerchantsError | null>(null)
  const [backfillStatus, setBackfillStatus] = useState<BackfillStatus | null>(null)
  const [isBackfilling, setIsBackfilling] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastFetchDuration, setLastFetchDuration] = useState<number | null>(null)
  const [cacheMetadata, setCacheMetadata] = useState<CacheMetadata>({
    lastFetchAt: null,
    lastInvalidateAt: null,
    lastMutationAt: null,
    isFetching: false,
    cacheKey: null
  })

  // Update userId ref
  useEffect(() => {
    userIdRef.current = user?.id || null
  }, [user?.id])

  // Listen for cache invalidation events
  useEffect(() => {
    if (!user?.id) return

    const handleInvalidation = (invalidatedUserId: string) => {
      if (invalidatedUserId === user.id) {
        debugLogger.logCacheMiss(`merchants:${user.id}`)
        // Force refetch
        fetchMerchants(true)
      }
    }

    invalidationListeners.add(handleInvalidation)
    return () => {
      invalidationListeners.delete(handleInvalidation)
    }
  }, [user?.id])

  // Fetch backfill status
  const fetchBackfillStatus = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch('/api/merchants/backfill')
      if (response.ok) {
        const data = await response.json()
        setBackfillStatus(data)
      }
    } catch (e) {
      // Silently fail - not critical
    }
  }, [user?.id])

  const fetchMerchants = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setLoading(false)
      setError({ message: 'Not authenticated', code: 'AUTH_MISSING' })
      return
    }

    const cacheKey = `merchants:${user.id}`

    // Check cache first
    const cached = merchantsCache.get(user.id)
    const now = Date.now()
    
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_STALE_TIME) {
      debugLogger.logCacheHit(cacheKey)
      setMerchants(cached.data)
      setLoading(false)
      setCacheMetadata(prev => ({
        ...prev,
        cacheKey,
        lastFetchAt: cached.timestamp,
        isFetching: false
      }))
      return
    }

    debugLogger.logCacheMiss(cacheKey)
    setLoading(true)
    setCacheMetadata(prev => ({ ...prev, isFetching: true, cacheKey }))
    setError(null)

    try {
      const startTime = Date.now()
      const response = await fetch('/api/merchants')
      const result = await response.json()
      const duration = Date.now() - startTime
      setLastFetchDuration(duration)

      if (!response.ok) {
        // Handle specific error codes from API
        const errorCode = result.code as MerchantsErrorCode
        
        switch (errorCode) {
          case 'TABLE_MISSING':
            setError({
              message: 'Merchants table does not exist in the database',
              code: 'TABLE_MISSING',
              sqlHint: result.sqlHint
            })
            break
          case 'SCHEMA_MISMATCH':
            setError({
              message: 'Database schema mismatch: user_id needs to be TEXT type',
              code: 'SCHEMA_MISMATCH',
              details: result.details,
              sqlHint: result.sqlHint
            })
            break
          case 'PERMISSION_DENIED':
            setError({
              message: 'Permission denied accessing merchants',
              code: 'PERMISSION_DENIED',
              details: result.details
            })
            break
          case 'AUTH_MISSING':
            setError({
              message: 'Authentication required',
              code: 'AUTH_MISSING'
            })
            break
          default:
            setError({
              message: result.error || 'Failed to load merchants',
              code: errorCode || 'QUERY_ERROR',
              details: result.details
            })
        }
        setMerchants([])
        setCacheMetadata(prev => ({ ...prev, isFetching: false }))
        return
      }

      // Success - API returned 200
      const merchantData = (result.merchants || []) as Merchant[]
      
      // Debug logging removed for production performance
      
      setMerchants(merchantData)
      
      // Update cache
      merchantsCache.set(user.id, {
        data: merchantData,
        timestamp: Date.now()
      })
      
      // Update global metadata for debug
      globalCacheMetadata[user.id] = {
        lastFetchAt: Date.now(),
        lastInvalidateAt: globalCacheMetadata[user.id]?.lastInvalidateAt || null,
        lastMutationAt: globalCacheMetadata[user.id]?.lastMutationAt || null,
        isFetching: false,
        cacheKey
      }
      
      setCacheMetadata({
        lastFetchAt: Date.now(),
        lastInvalidateAt: cacheMetadata.lastInvalidateAt,
        lastMutationAt: cacheMetadata.lastMutationAt,
        isFetching: false,
        cacheKey
      })
      
      // Clear error on success
      setError(null)
      
      // Fetch backfill status to know if we should show the backfill button
      await fetchBackfillStatus()
      
    } catch (err: any) {
      console.error('[useMerchants] Fetch error:', err)
      
      // Check if it's a network error (API route not found)
      if (err.message?.includes('fetch') || err.message?.includes('Failed to fetch')) {
        setError({
          message: 'API route not accessible. The /api/merchants endpoint may not exist.',
          code: 'API_ROUTE_MISSING',
          details: err.message
        })
      } else {
        setError({
          message: err.message || 'Network error',
          code: 'INTERNAL_ERROR',
          details: String(err)
        })
      }
      setMerchants([])
      setCacheMetadata(prev => ({ ...prev, isFetching: false }))
    } finally {
      setLoading(false)
    }
  }, [user?.id, fetchBackfillStatus, cacheMetadata.lastInvalidateAt, cacheMetadata.lastMutationAt])

  const runBackfill = useCallback(async (options: { dryRun?: boolean; useAI?: boolean } = {}) => {
    if (!user?.id) return
    
    setIsBackfilling(true)
    debugLogger.info('merchants', 'Starting backfill from UI', options)
    
    try {
      const response = await fetch('/api/merchants/backfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'all',
          limit: 5000,
          dryRun: options.dryRun || false,
          useAI: options.useAI || false
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Backfill failed')
      }
      
      debugLogger.info('merchants', 'Backfill complete', {
        transactionsProcessed: result.transactionsProcessed,
        merchantsFound: result.merchantsFound,
        merchantsCreated: result.merchantsCreated
      })
      
      // Invalidate and refetch
      invalidateMerchantsCache(user.id)
      await fetchMerchants(true)
      await fetchBackfillStatus()
      
    } catch (err: any) {
      debugLogger.error('merchants', 'Backfill failed', { error: err.message })
      throw err
    } finally {
      setIsBackfilling(false)
    }
  }, [user?.id, fetchMerchants, fetchBackfillStatus])

  // Filter merchants by search query
  const filteredMerchants = useMemo(() => {
    if (!searchQuery.trim()) return merchants
    
    const query = searchQuery.toLowerCase()
    return merchants.filter(m => 
      m.merchant_name.toLowerCase().includes(query) ||
      m.normalized_name.includes(query)
    )
  }, [merchants, searchQuery])

  // Initial fetch
  useEffect(() => {
    fetchMerchants()
  }, [fetchMerchants])

  return {
    merchants,
    loading,
    error,
    backfillStatus,
    isBackfilling,
    refetch: () => fetchMerchants(true),
    runBackfill,
    searchQuery,
    setSearchQuery,
    filteredMerchants,
    lastFetchDuration,
    cacheMetadata
  }
}

// Export cache invalidation helper - can be called from anywhere
export function invalidateMerchantsCache(userId?: string) {
  const targetId = userId || (typeof window !== 'undefined' ? 
    // Try to get current user from localStorage or other global state
    null : null)
  
  if (targetId) {
    merchantsCache.delete(targetId)
    
    // Update global metadata
    if (globalCacheMetadata[targetId]) {
      globalCacheMetadata[targetId].lastInvalidateAt = Date.now()
    }
    
    // Notify all listeners
    invalidationListeners.forEach(listener => listener(targetId))
    
    debugLogger.logCacheInvalidate(`merchants:${targetId}`, { userId: targetId })
  } else {
    // Clear all
    const countBefore = merchantsCache.size
    merchantsCache.clear()
    Object.keys(globalCacheMetadata).forEach(key => {
      if (globalCacheMetadata[key]) {
        globalCacheMetadata[key].lastInvalidateAt = Date.now()
      }
    })
    
    debugLogger.logCacheInvalidate('merchants:all', { clearedCount: countBefore })
  }
}

// Export global cache metadata for debug console
export function getMerchantsCacheMetadata(): Record<string, CacheMetadata> {
  return { ...globalCacheMetadata }
}

// Export cache contents for debug (be careful with size)
export function getMerchantsCacheDebugInfo(): { size: number; keys: string[] } {
  return {
    size: merchantsCache.size,
    keys: Array.from(merchantsCache.keys())
  }
}
