'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSupabaseClient } from '@/lib/supabase/client'
import { RecurringTransaction, Transaction } from '@/types/transaction'
import { useAuth } from '@/providers'
import { toast } from 'sonner'
import { predictUpcomingTransactions } from '@/lib/utils/predict-transactions'
import { createTransactionService } from '@/features/transactions/services'

// Cache for recurring transactions
interface CacheEntry {
  data: RecurringTransaction[]
  timestamp: number
}
const recurringCache = new Map<string, CacheEntry>()
const CACHE_STALE_TIME = 30 * 1000 // 30 seconds

interface UseRecurringTransactionsReturn {
  recurringTransactions: RecurringTransaction[]
  upcomingTransactions: Transaction[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  createRecurringTransaction: (data: Partial<RecurringTransaction>) => Promise<RecurringTransaction>
  updateRecurringTransaction: (id: number | string, data: Partial<RecurringTransaction>) => Promise<void>
  deleteRecurringTransaction: (id: number | string) => Promise<void>
  generateDueTransactions: () => Promise<number>
}

export function useRecurringTransactions(): UseRecurringTransactionsReturn {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = useSupabaseClient()
  
  const transactionService = createTransactionService(supabase)
  
  const userRef = useRef(user)
  userRef.current = user
  const transactionServiceRef = useRef(transactionService)
  transactionServiceRef.current = transactionService

  // Guard to prevent double generation in React Strict Mode
  const hasGeneratedRef = useRef(false)

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    const currentUser = userRef.current
    if (currentUser?.id) {
      recurringCache.delete(currentUser.id)
    }
  }, [])

  // Fetch recurring transactions
  const fetchRecurringTransactions = useCallback(async (forceRefresh = false) => {
    const currentUser = userRef.current
    if (!currentUser?.id) {
      return
    }

    // Check cache first
    const cached = recurringCache.get(currentUser.id)
    const now = Date.now()
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_STALE_TIME) {
      setRecurringTransactions(cached.data)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const data = await transactionServiceRef.current.getRecurringTransactions(currentUser.id)

      const processedData = (data || []).map((item: any) => ({
        ...item,
        category_name: item.categories?.name || 'Uncategorized',
        merchant_name: item.merchants?.merchant_name || null
      })) as RecurringTransaction[]

      setRecurringTransactions(processedData)
      
      // Update cache
      recurringCache.set(currentUser.id, {
        data: processedData,
        timestamp: Date.now()
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recurring transactions'
      
      // Error is already set in state, avoid console spam
      
      setError(err instanceof Error ? err : new Error('Failed to fetch recurring transactions'))
      
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        toast.error('Network error: Unable to connect to database.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Force a refresh
  const refresh = useCallback(async (): Promise<void> => {
    invalidateCache()
    await fetchRecurringTransactions(true) // force refresh
  }, [fetchRecurringTransactions, invalidateCache])

  // Create recurring transaction
  const createRecurringTransaction = useCallback(async (data: Partial<RecurringTransaction>): Promise<RecurringTransaction> => {
    const currentUser = userRef.current
    if (!currentUser?.id) throw new Error('User not authenticated')

    try {
      const newRecurringTransaction = await transactionServiceRef.current.createRecurringTransaction({
        ...data,
        user_id: currentUser.id,
      } as RecurringTransaction)

      invalidateCache()
      await refresh()
      toast.success('Recurring transaction created successfully')
      return newRecurringTransaction as RecurringTransaction
    } catch (err) {
      console.error('Error creating recurring transaction:', err)
      toast.error('Failed to create recurring transaction')
      throw err
    }
  }, [refresh, invalidateCache])

  // Update recurring transaction
  const updateRecurringTransaction = useCallback(async (id: number | string, data: Partial<RecurringTransaction>) => {
    const currentUser = userRef.current
    if (!currentUser?.id) throw new Error('User not authenticated')

    try {
      await transactionServiceRef.current.updateRecurringTransaction(Number(id), data, currentUser.id)
      invalidateCache()
      await refresh()
      toast.success('Recurring transaction updated successfully')
    } catch (err) {
      console.error('Error updating recurring transaction:', err)
      toast.error('Failed to update recurring transaction')
      throw err
    }
  }, [refresh, invalidateCache])

  // Delete recurring transaction
  const deleteRecurringTransaction = useCallback(async (id: number | string) => {
    const currentUser = userRef.current
    if (!currentUser?.id) throw new Error('User not authenticated')

    try {
      await transactionServiceRef.current.deleteRecurringTransaction(Number(id), currentUser.id)
      invalidateCache()
      await refresh()
      toast.success('Recurring transaction deleted successfully')
    } catch (err) {
      console.error('Error deleting recurring transaction:', err)
      toast.error('Failed to delete recurring transaction')
      throw err
    }
  }, [refresh, invalidateCache])

  // Auto-generate due recurring transactions
  const generateDueTransactions = useCallback(async (): Promise<number> => {
    const currentUser = userRef.current
    if (!currentUser?.id) return 0

    try {
      const response = await fetch('/api/recurring/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('[useRecurringTransactions] Failed to generate transactions:', error)
        return 0
      }

      const result = await response.json()
      
      if (result.created > 0) {
        toast.success(`Created ${result.created} transaction${result.created > 1 ? 's' : ''} from recurring items`)
      }
      
      return result.created || 0
    } catch (err) {
      console.error('[useRecurringTransactions] Error generating due transactions:', err)
      return 0
    }
  }, [])

  // Initial fetch - also generate due transactions
  useEffect(() => {
    if (user?.id && !hasGeneratedRef.current) {
      // Guard to prevent double generation in React Strict Mode
      hasGeneratedRef.current = true
      
      // First generate any due transactions, then fetch the updated list
      generateDueTransactions().then(() => {
        fetchRecurringTransactions()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Generate predicted upcoming transactions - 1 per recurring item
  const upcomingTransactions = useMemo((): Transaction[] => {
    if (!recurringTransactions.length) return []
    return predictUpcomingTransactions(recurringTransactions)
  }, [recurringTransactions])

  return {
    recurringTransactions,
    upcomingTransactions,
    loading,
    error,
    refresh,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    generateDueTransactions
  }
}
