'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSupabaseClient } from '@/utils/supabase/client'
import { RecurringTransaction, Transaction } from '@/app/types/transaction'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { predictUpcomingTransactions } from '@/utils/predict-transactions'
import { createTransactionService } from '@/app/services/transaction-services'

export function useRecurringTransactions(): {
  recurringTransactions: RecurringTransaction[];
  upcomingTransactions: Transaction[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  createRecurringTransaction: (data: Partial<RecurringTransaction>) => Promise<RecurringTransaction>;
  updateRecurringTransaction: (id: number | string, data: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: number | string) => Promise<void>;
  bulkDeleteRecurringTransactions: (ids: (number | string)[]) => Promise<void>;
  bulkUpdateRecurringTransactions: (ids: (number | string)[], changes: Partial<RecurringTransaction>) => Promise<void>;
} {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = useSupabaseClient()
  
  // Create transaction service with authenticated client
  const transactionService = createTransactionService(supabase)
  
  // Use refs to avoid dependency issues
  const userRef = useRef(user)
  userRef.current = user
  const transactionServiceRef = useRef(transactionService)
  transactionServiceRef.current = transactionService

  // Fetch recurring transactions - stable callback that never changes
  const fetchRecurringTransactions = useCallback(async () => {
    const currentUser = userRef.current
    if (!currentUser?.id) {
      console.debug('[useRecurringTransactions] No user ID, skipping fetch')
      return
    }

    console.info('[useRecurringTransactions] Fetching recurring transactions', { userId: currentUser.id.substring(0, 12) + '...' })

    try {
      setLoading(true)
      setError(null)
      
      // Use the service to fetch recurring transactions
      const data = await transactionServiceRef.current.getRecurringTransactions(currentUser.id)

      console.info('[useRecurringTransactions] Fetched recurring transactions', { count: data?.length || 0 })

      // Process the data to extract category names
      const processedData = (data || []).map((item: any) => ({
        ...item,
        category_name: item.categories?.name || 'Uncategorized'
      }))

      setRecurringTransactions(processedData as RecurringTransaction[])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recurring transactions'
      const isNetworkError = errorMessage.includes('fetch') || 
                            errorMessage.includes('network') || 
                            errorMessage.includes('connection') ||
                            errorMessage.includes('ERR_CONNECTION')
      
      console.error('[useRecurringTransactions] Failed to fetch recurring transactions', { 
        error: errorMessage,
        isNetworkError,
        userId: currentUser.id.substring(0, 12) + '...'
      })
      
      setError(err instanceof Error ? err : new Error('Failed to fetch recurring transactions'))
      
      if (isNetworkError) {
        toast.error('Network error: Unable to connect to database. Please check your connection.')
      }
    } finally {
      setLoading(false)
    }
  }, []) // Empty dependency array - never changes

  // Force a refresh of recurring transactions
  const refresh = useCallback(async (): Promise<void> => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  // Create recurring transaction
  const createRecurringTransaction = useCallback(async (data: Partial<RecurringTransaction>): Promise<RecurringTransaction> => {
    const currentUser = userRef.current
    if (!currentUser?.id) throw new Error('User not authenticated')

    try {
      const newRecurringTransaction = await transactionServiceRef.current.createRecurringTransaction({
        ...data,
        user_id: currentUser.id,
      } as RecurringTransaction)

      await refresh()
      toast.success('Recurring transaction created successfully')
      return newRecurringTransaction as RecurringTransaction
    } catch (err) {
      console.error('Error creating recurring transaction:', err)
      toast.error('Failed to create recurring transaction')
      throw err
    }
  }, [refresh])

  // Update recurring transaction
  const updateRecurringTransaction = useCallback(async (id: number | string, data: Partial<RecurringTransaction>) => {
    const currentUser = userRef.current
    if (!currentUser?.id) throw new Error('User not authenticated')

    try {
      await transactionServiceRef.current.updateRecurringTransaction(Number(id), data, currentUser.id)

      await refresh()
      toast.success('Recurring transaction updated successfully')
    } catch (err) {
      console.error('Error updating recurring transaction:', err)
      toast.error('Failed to update recurring transaction')
      throw err
    }
  }, [refresh])

  // Delete recurring transaction
  const deleteRecurringTransaction = useCallback(async (id: number | string) => {
    const currentUser = userRef.current
    if (!currentUser?.id) throw new Error('User not authenticated')

    try {
      await transactionServiceRef.current.deleteRecurringTransaction(Number(id), currentUser.id)

      await refresh()
      toast.success('Recurring transaction deleted successfully')
    } catch (err) {
      console.error('Error deleting recurring transaction:', err)
      toast.error('Failed to delete recurring transaction')
      throw err
    }
  }, [refresh])

  // Bulk delete
  const bulkDeleteRecurringTransactions = useCallback(async (ids: (number | string)[]) => {
    const currentUser = userRef.current
    if (!currentUser?.id) throw new Error('User not authenticated')

    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .in('id', ids.map(id => Number(id)))
        .eq('user_id', currentUser.id)

      if (error) throw error

      await refresh()
      toast.success('Recurring transactions deleted successfully')
    } catch (err) {
      console.error('Error deleting recurring transactions:', err)
      toast.error('Failed to delete recurring transactions')
      throw err
    }
  }, [supabase, refresh])

  // Bulk update
  const bulkUpdateRecurringTransactions = useCallback(async (ids: (number | string)[], changes: Partial<RecurringTransaction>) => {
    const currentUser = userRef.current
    if (!currentUser?.id) throw new Error('User not authenticated')

    try {
      const { id: _id, user_id: _user_id, ...changesWithoutId } = changes
      const updateData = {
        ...changesWithoutId,
        start_date: changes.start_date instanceof Date ? changes.start_date.toISOString() : changes.start_date,
        end_date: changes.end_date instanceof Date ? changes.end_date.toISOString() : changes.end_date,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('recurring_transactions')
        .update(updateData)
        .in('id', ids.map(id => Number(id)))
        .eq('user_id', currentUser.id)

      if (error) throw error

      await refresh()
      toast.success('Recurring transactions updated successfully')
    } catch (err) {
      console.error('Error updating recurring transactions:', err)
      toast.error('Failed to update recurring transactions')
      throw err
    }
  }, [supabase, refresh])

  // Initial fetch - only depends on refreshTrigger, not the callback
  useEffect(() => {
    if (user?.id) {
      fetchRecurringTransactions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, refreshTrigger])

  // Generate predicted upcoming transactions in-memory
  const upcomingTransactions = useMemo((): Transaction[] => {
    if (!recurringTransactions.length) return []

    const predictionsPerTransaction = Math.max(
      2,
      Math.ceil(12 / recurringTransactions.length)
    )

    const allPredictions = predictUpcomingTransactions(
      recurringTransactions,
      predictionsPerTransaction
    )

    return allPredictions.slice(0, 12)
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
    bulkDeleteRecurringTransactions,
    bulkUpdateRecurringTransactions
  }
}
