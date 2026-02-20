'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSupabaseClient } from '@/utils/supabase/client'
import { Transaction } from '@/app/types/transaction'
import { DateRange } from 'react-day-picker'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { createTransactionService } from '@/app/services/transaction-services'

interface TransactionWithCategory extends Transaction {
  categories?: { name: string } | null
}

/**
 * useTransactions Hook
 * 
 * Manages transaction data with optimistic updates and real-time sync.
 * Uses Clerk-authenticated Supabase client for all database operations.
 */
export function useTransactions(dateRange?: DateRange) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { user } = useAuth()
  const supabase = useSupabaseClient()
  
  // Create transaction service with authenticated client
  const transactionService = createTransactionService(supabase)

  // Use refs to avoid dependency issues
  const userRef = useRef(user)
  userRef.current = user
  const supabaseRef = useRef(supabase)
  supabaseRef.current = supabase
  const transactionServiceRef = useRef(transactionService)
  transactionServiceRef.current = transactionService
  const dateRangeRef = useRef(dateRange)
  dateRangeRef.current = dateRange

  // Function to manually trigger a refresh
  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  // Fetch transactions when component mounts or when dependencies change
  useEffect(() => {
    async function fetchTransactions() {
      const currentUser = userRef.current
      if (!currentUser?.id) {
        console.log('[useTransactions] No user, skipping fetch')
        return
      }

      console.info('[useTransactions] Fetching for user:', currentUser.id.substring(0, 12) + '...')

      try {
        setLoading(true)
        let query = supabaseRef.current
          .from('transactions')
          .select(`
            *,
            categories (
              name
            )
          `)
          .eq('user_id', currentUser.id)
          .order('date', { ascending: false })

        const currentDateRange = dateRangeRef.current
        if (currentDateRange?.from) {
          query = query.gte('date', currentDateRange.from.toISOString().split('T')[0])
        }
        if (currentDateRange?.to) {
          query = query.lte('date', currentDateRange.to.toISOString().split('T')[0])
        }

        const { data, error } = await query as { data: TransactionWithCategory[] | null, error: unknown }

        if (error) {
          console.error('[useTransactions] Database error:', error)
          throw error
        }

        const processedTransactions = (data || []).map(transaction => ({
          id: transaction.id,
          user_id: transaction.user_id || currentUser.id,
          date: transaction.date,
          amount: transaction.amount,
          name: transaction.name,
          description: transaction.description,
          type: transaction.type,
          account_type: transaction.account_type,
          category_id: transaction.category_id,
          category_name: transaction.categories?.name || transaction.category_name || 'Uncategorized',
          recurring_frequency: transaction.recurring_frequency,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at
        }))

        console.info('[useTransactions] Fetched transactions:', processedTransactions.length)
        setTransactions(processedTransactions as Transaction[])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions'
        console.error('[useTransactions] Error fetching transactions:', {
          error: errorMessage,
          userId: currentUser.id.substring(0, 12) + '...'
        })
        setError(err instanceof Error ? err : new Error('Failed to fetch transactions'))
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()

    if (user?.id) {
      const pollingInterval = setInterval(() => {
        refresh()
      }, 30000)
      
      return () => clearInterval(pollingInterval)
    }
  // Only depend on user?.id and refreshTrigger, not the callback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, refreshTrigger])

  // CRUD operations with optimistic updates
  const createTransaction = useCallback(async (data: Partial<Transaction>) => {
    const currentUser = userRef.current
    if (!currentUser?.id) throw new Error('User not authenticated')

    const tempId = `temp-${Date.now()}`

    try {
      // Optimistic update - add transaction immediately
      const optimisticTransaction: Transaction = {
        id: tempId,
        user_id: currentUser.id,
        date: data.date || new Date().toISOString().split('T')[0],
        amount: data.amount || 0,
        name: data.name || '',
        type: data.type || 'Expense',
        account_type: data.account_type || 'Checking',
        category_id: data.category_id || null,
        category_name: data.category_name || 'Uncategorized',
        description: data.description || null,
        recurring_frequency: data.recurring_frequency || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setTransactions(prev => [optimisticTransaction, ...prev])

      // Use the transaction service with authenticated client
      const result = await transactionServiceRef.current.createTransaction({
        user_id: currentUser.id,
        date: data.date || new Date().toISOString().split('T')[0],
        amount: data.amount || 0,
        name: data.name || '',
        type: data.type || 'Expense',
        account_type: data.account_type || 'Checking',
        category_id: data.category_id || null,
        category_name: data.category_name || null,
        description: data.description || null,
        recurring_frequency: data.recurring_frequency || null
      } as any)

      const newTransaction = result.transaction

      const processedTransaction: Transaction = {
        id: newTransaction.id,
        user_id: newTransaction.user_id || currentUser.id,
        date: newTransaction.date,
        amount: newTransaction.amount,
        name: newTransaction.name,
        description: newTransaction.description,
        type: newTransaction.type,
        account_type: newTransaction.account_type,
        category_id: newTransaction.category_id,
        category_name: data.category_name || 'Uncategorized',
        recurring_frequency: newTransaction.recurring_frequency,
        created_at: newTransaction.created_at,
        updated_at: newTransaction.updated_at
      }

      setTransactions(prev =>
        prev.map(t => String(t.id) === tempId ? processedTransaction : t)
      )

      // Refresh to ensure all data is in sync
      refresh()
      
      toast.success('Transaction created successfully')
      return processedTransaction
    } catch (err) {
      // Remove optimistic transaction on error
      setTransactions(prev => prev.filter(t => String(t.id) !== tempId))
      console.error('Error creating transaction:', err)
      toast.error('Failed to create transaction')
      throw err
    }
  }, [])

  const updateTransaction = useCallback(async (id: number | string, data: Partial<Transaction>) => {
    const currentUser = userRef.current
    if (!currentUser?.id) throw new Error('User not authenticated')

    try {
      // Optimistic update
      setTransactions(prev => 
        prev.map(t => t.id === id ? { ...t, ...data } : t)
      )

      // Remove user_id from data before sending to update
      const { user_id, ...updateData } = data
      await transactionServiceRef.current.updateTransaction(Number(id), updateData)

      toast.success('Transaction updated successfully')
      // Refresh to get the latest data with category names
      refresh()
    } catch (err) {
      console.error('Error updating transaction:', err)
      toast.error('Failed to update transaction')
      // Revert optimistic update on error
      refresh()
      throw err
    }
  }, [refresh])

  const deleteTransaction = useCallback(async (id: number | string) => {
    const currentUser = userRef.current
    if (!currentUser?.id) throw new Error('User not authenticated')

    try {
      setTransactions(prev => prev.filter(t => t.id !== id))

      await transactionServiceRef.current.deleteTransaction(Number(id), currentUser.id)

      refresh()
      toast.success('Transaction deleted successfully')
    } catch (err) {
      console.error('Error deleting transaction:', err)
      toast.error('Failed to delete transaction')
      // Restore transaction on error
      refresh()
      throw err
    }
  }, [refresh])

  const bulkDeleteTransactions = useCallback(async (ids: (number | string)[]) => {
    const currentUser = userRef.current
    if (!currentUser?.id) throw new Error('User not authenticated')

    try {
      setTransactions(prev => prev.filter(t => !t.id || !ids.includes(t.id)))

      const { error } = await supabaseRef.current
        .from('transactions')
        .delete()
        .in('id', ids.map(id => Number(id)))
        .eq('user_id', currentUser.id)

      if (error) throw error

      refresh()
      toast.success('Transactions deleted successfully')
    } catch (err) {
      console.error('Error deleting transactions:', err)
      toast.error('Failed to delete transactions')
      // Restore transactions on error
      refresh()
      throw err
    }
  }, [refresh])

  const bulkUpdateTransactions = useCallback(async (ids: (number | string)[], changes: Partial<Transaction>) => {
    const currentUser = userRef.current
    if (!currentUser?.id) throw new Error('User not authenticated')

    try {
      // Optimistic update
      setTransactions(prev => 
        prev.map(t => t.id && ids.includes(t.id) ? { ...t, ...changes } : t)
      )

      const { id: _id, user_id: _user_id, ...changesWithoutId } = changes
      const updateData = {
        ...changesWithoutId,
        date: changes.date,
        updated_at: new Date().toISOString()
      }
      
      const { error } = await supabaseRef.current
        .from('transactions')
        .update(updateData)
        .in('id', ids.map(id => Number(id)))
        .eq('user_id', currentUser.id)

      if (error) throw error

      toast.success('Transactions updated successfully')
      // Refresh to get the latest data with category names
      refresh()
    } catch (err) {
      console.error('Error updating transactions:', err)
      toast.error('Failed to update transactions')
      // Revert optimistic updates on error
      refresh()
      throw err
    }
  }, [refresh])

  return { 
    transactions, 
    loading, 
    error, 
    refresh,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    bulkDeleteTransactions,
    bulkUpdateTransactions
  }
}
