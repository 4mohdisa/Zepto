'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'

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

type ErrorType = 'TABLE_MISSING' | 'SCHEMA_MISMATCH' | 'PERMISSION_DENIED' | 'UNKNOWN' | null

interface UseMerchantsReturn {
  merchants: Merchant[]
  loading: boolean
  error: string | null
  errorType: ErrorType
  refetch: () => Promise<void>
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredMerchants: Merchant[]
}

// Simple cache for merchants data
const merchantsCache = new Map<string, { data: Merchant[]; timestamp: number }>()
const CACHE_STALE_TIME = 30 * 1000 // 30 seconds

export function useMerchants(): UseMerchantsReturn {
  const { user } = useAuth()
  
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<ErrorType>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const analyzeError = useCallback((err: any): { type: ErrorType; message: string } => {
    const code = err?.code
    const message = err?.message || ''
    
    if (code === 'TABLE_MISSING' || message.includes('table') || message.includes('relation')) {
      return { type: 'TABLE_MISSING', message: 'The merchants table does not exist. Please run the SQL migration.' }
    }
    
    if (code === 'SCHEMA_MISMATCH' || message.includes('uuid') || message.includes('invalid input syntax')) {
      return { type: 'SCHEMA_MISMATCH', message: 'Schema mismatch: user_id column needs to be TEXT type, not UUID.' }
    }
    
    if (code === 'PERMISSION_DENIED' || message.includes('permission')) {
      return { type: 'PERMISSION_DENIED', message: 'Permission denied. Check RLS policies.' }
    }
    
    return { type: 'UNKNOWN', message: message || 'Failed to load merchants' }
  }, [])

  const fetchMerchants = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    // Check cache first
    const cached = merchantsCache.get(user.id)
    const now = Date.now()
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_STALE_TIME) {
      setMerchants(cached.data)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setErrorType(null)

    try {
      // Use the API route instead of direct Supabase query to avoid schema cache issues
      const response = await fetch('/api/merchants')
      const result = await response.json()

      if (!response.ok) {
        const { type, message } = analyzeError(result)
        setErrorType(type)
        throw new Error(message)
      }

      const merchantData = (result.merchants || []) as Merchant[]
      setMerchants(merchantData)
      
      // Update cache
      merchantsCache.set(user.id, {
        data: merchantData,
        timestamp: Date.now()
      })
    } catch (err: any) {
      console.error('Error fetching merchants:', err)
      setError(err.message || 'Failed to load merchants')
    } finally {
      setLoading(false)
    }
  }, [user?.id, analyzeError])

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
    errorType,
    refetch: () => fetchMerchants(true),
    searchQuery,
    setSearchQuery,
    filteredMerchants,
  }
}

// Export cache invalidation helper
export function invalidateMerchantsCache(userId?: string) {
  if (userId) {
    merchantsCache.delete(userId)
  } else {
    merchantsCache.clear()
  }
}
