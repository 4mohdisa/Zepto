'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/providers'
import { invalidateMerchantsCache } from '@/hooks/use-merchants'

// Simple cache for transactions
const transactionsCache = new Map<string, { data: Transaction[]; timestamp: number; nextCursor: string | null; hasNextPage: boolean }>()
const CACHE_STALE_TIME = 30 * 1000 // 30 seconds

interface Transaction {
  id: number
  user_id: string
  date: string
  name: string
  description: string | null
  amount: number
  type: 'Income' | 'Expense'
  account_type: string
  category_id: number | null
  categories: { id: number; name: string } | null
}

interface UseTransactionsState {
  dateFrom: string
  dateTo: string
  search: string
  categoryId: string
  typeOrder: 'default' | 'expense_first' | 'income_first'
}

interface UseTransactionsReturn {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => Promise<void>
  refetch: () => Promise<void>
  state: UseTransactionsState
  setDateFrom: (date: string) => void
  setDateTo: (date: string) => void
  setSearch: (search: string) => void
  setCategoryId: (id: string) => void
  setTypeOrder: (order: 'default' | 'expense_first' | 'income_first') => void
  selectedIds: Set<number>
  setSelectedIds: (ids: Set<number>) => void
  toggleSelection: (id: number) => void
  selectAll: () => void
  clearSelection: () => void
  bulkDelete: (ids: number[]) => Promise<void>
  bulkUpdateCategory: (ids: number[], categoryId: string) => Promise<void>
  updateTransaction: (id: number, data: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: number) => Promise<void>
}

export function useTransactions(): UseTransactionsReturn {
  const { user } = useAuth()
  
  // Filter state
  const [state, setState] = useState<UseTransactionsState>({
    dateFrom: '',
    dateTo: '',
    search: '',
    categoryId: 'all',
    typeOrder: 'default',
  })

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Refs for aborting requests
  const abortControllerRef = useRef<AbortController | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Generate cache key from state
  const getCacheKey = useCallback(() => {
    return JSON.stringify({
      dateFrom: state.dateFrom,
      dateTo: state.dateTo,
      search: state.search,
      categoryId: state.categoryId,
      typeOrder: state.typeOrder,
    })
  }, [state])

  // Fetch transactions
  const fetchTransactions = useCallback(async (isInitial = true, forceRefresh = false) => {
    if (!user?.id) return

    const cacheKey = getCacheKey()
    const now = Date.now()
    const cached = transactionsCache.get(cacheKey)

    // Use cache if available and not stale (for initial fetch only)
    if (isInitial && cached && !forceRefresh) {
      const isStale = now - cached.timestamp > CACHE_STALE_TIME
      if (!isStale) {
        setTransactions(cached.data)
        setCursor(cached.nextCursor)
        setHasNextPage(cached.hasNextPage)
        setLoading(false)
        return
      }
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    if (isInitial) {
      setLoading(true)
      setCursor(null)
    } else {
      setIsFetchingNextPage(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append('limit', '50')
      if (state.dateFrom) params.append('dateFrom', state.dateFrom)
      if (state.dateTo) params.append('dateTo', state.dateTo)
      if (state.search) params.append('search', state.search)
      if (state.categoryId !== 'all') params.append('categoryId', state.categoryId)
      if (state.typeOrder !== 'default') params.append('typeOrder', state.typeOrder)
      if (!isInitial && cursor) params.append('cursor', cursor)

      const response = await fetch(`/api/transactions?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }

      const data = await response.json()

      if (isInitial) {
        setTransactions(data.rows)
        // Update cache
        transactionsCache.set(cacheKey, {
          data: data.rows,
          timestamp: Date.now(),
          nextCursor: data.nextCursor,
          hasNextPage: data.hasNextPage,
        })
      } else {
        setTransactions((prev) => {
          const newData = [...prev, ...data.rows]
          // Update cache with merged data
          transactionsCache.set(cacheKey, {
            data: newData,
            timestamp: Date.now(),
            nextCursor: data.nextCursor,
            hasNextPage: data.hasNextPage,
          })
          return newData
        })
      }

      setCursor(data.nextCursor)
      setHasNextPage(data.hasNextPage)
    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.error('Fetch transactions error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      if (isInitial) {
        setLoading(false)
      } else {
        setIsFetchingNextPage(false)
      }
    }
  }, [user?.id, state, cursor, getCacheKey])

  // Initial fetch and refetch on filter changes
  useEffect(() => {
    fetchTransactions(true)
    // Clear selection when filters change
    clearSelection()
  }, [state.dateFrom, state.dateTo, state.categoryId, state.typeOrder])

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchTransactions(true)
      clearSelection()
    }, 400)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [state.search])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Fetch next page
  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return
    await fetchTransactions(false)
  }, [hasNextPage, isFetchingNextPage, fetchTransactions])

  // Selection helpers
  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(transactions.map((t) => t.id)))
  }, [transactions])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Invalidate all transaction caches (call after mutations)
  const invalidateCache = useCallback(() => {
    transactionsCache.clear()
  }, [])

  // Bulk actions
  const bulkDelete = useCallback(async (ids: number[]) => {
    if (!user?.id || ids.length === 0) return

    try {
      const response = await fetch('/api/transactions/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionIds: ids }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete transactions')
      }

      // Remove deleted transactions from state
      setTransactions((prev) => prev.filter((t) => !ids.includes(t.id)))
      // Invalidate cache to ensure consistency
      invalidateCache()
      // Invalidate merchants cache - deletion affects merchant counts
      invalidateMerchantsCache(user.id)
      clearSelection()
    } catch (err) {
      console.error('Bulk delete error:', err)
      throw err
    }
  }, [user?.id, clearSelection, invalidateCache])

  const bulkUpdateCategory = useCallback(async (ids: number[], categoryId: string) => {
    if (!user?.id || ids.length === 0) return

    try {
      const response = await fetch('/api/transactions/bulk-update-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionIds: ids, categoryId }),
      })

      if (!response.ok) {
        throw new Error('Failed to update transactions')
      }

      // Invalidate cache and refresh to get updated data
      invalidateCache()
      // Invalidate merchants cache - category update may affect merchant data
      invalidateMerchantsCache(user.id)
      await fetchTransactions(true, true) // force refresh
      clearSelection()
    } catch (err) {
      console.error('Bulk update error:', err)
      throw err
    }
  }, [user?.id, fetchTransactions, clearSelection, invalidateCache])

  // Single transaction update
  const updateTransaction = useCallback(async (id: number, data: Partial<Transaction>) => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/transactions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      })

      if (!response.ok) {
        throw new Error('Failed to update transaction')
      }

      // Update local state
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      )
      // Invalidate cache to ensure consistency
      invalidateCache()
      // Invalidate merchants cache - update may affect merchant name/count
      invalidateMerchantsCache(user.id)
    } catch (err) {
      console.error('Update transaction error:', err)
      throw err
    }
  }, [user?.id, invalidateCache])

  // Single transaction delete
  const deleteTransaction = useCallback(async (id: number) => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/transactions/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionIds: [id] }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete transaction')
      }

      // Remove from local state
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      // Remove from selection if selected
      setSelectedIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      // Invalidate cache to ensure consistency
      invalidateCache()
      // Invalidate merchants cache - deletion affects merchant counts
      invalidateMerchantsCache(user.id)
    } catch (err) {
      console.error('Delete transaction error:', err)
      throw err
    }
  }, [user?.id, invalidateCache])

  // State setters
  const setDateFrom = useCallback((date: string) => {
    setState((prev) => ({ ...prev, dateFrom: date }))
  }, [])

  const setDateTo = useCallback((date: string) => {
    setState((prev) => ({ ...prev, dateTo: date }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setState((prev) => ({ ...prev, search }))
  }, [])

  const setCategoryId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, categoryId: id }))
  }, [])

  const setTypeOrder = useCallback((order: 'default' | 'expense_first' | 'income_first') => {
    setState((prev) => ({ ...prev, typeOrder: order }))
  }, [])

  return {
    transactions,
    loading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch: () => fetchTransactions(true, true), // force refresh
    state,
    setDateFrom,
    setDateTo,
    setSearch,
    setCategoryId,
    setTypeOrder,
    selectedIds,
    setSelectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    bulkDelete,
    bulkUpdateCategory,
    updateTransaction,
    deleteTransaction,
  }
}
