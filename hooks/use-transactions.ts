'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/context/auth-context'

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

  // Fetch transactions
  const fetchTransactions = useCallback(async (isInitial = true) => {
    if (!user?.id) return

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
      } else {
        setTransactions((prev) => [...prev, ...data.rows])
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
  }, [user?.id, state, cursor])

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
      clearSelection()
    } catch (err) {
      console.error('Bulk delete error:', err)
      throw err
    }
  }, [user?.id, clearSelection])

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

      // Refresh to get updated data
      await fetchTransactions(true)
      clearSelection()
    } catch (err) {
      console.error('Bulk update error:', err)
      throw err
    }
  }, [user?.id, fetchTransactions, clearSelection])

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
    refetch: () => fetchTransactions(true),
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
  }
}
