'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSupabaseClient } from '@/utils/supabase/client'
import { RecurringTransaction, Transaction } from '@/app/types/transaction'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { predictUpcomingTransactions } from '@/utils/predict-transactions'
import { createTransactionService } from '@/app/services/transaction-services'

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
      console.debug('[useRecurringTransactions] No user ID, skipping fetch')
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
        category_name: item.categories?.name || 'Uncategorized'
      })) as RecurringTransaction[]

      setRecurringTransactions(processedData)
      
      // Update cache
      recurringCache.set(currentUser.id, {
        data: processedData,
        timestamp: Date.now()
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recurring transactions'
      
      console.error('[useRecurringTransactions] Failed to fetch recurring transactions', { 
        error: errorMessage,
        userId: currentUser.id.substring(0, 12) + '...'
      })
      
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

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchRecurringTransactions()
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
    deleteRecurringTransaction
  }
}
