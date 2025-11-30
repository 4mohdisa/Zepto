'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Transaction } from '@/app/types/transaction'
import { DateRange } from 'react-day-picker'
import { useAuth } from '@/context/auth-context'
import { RealtimeChannel } from '@supabase/supabase-js'
import { toast } from 'sonner'

interface TransactionWithCategory extends Transaction {
  categories?: { name: string } | null
}

export function useTransactions(dateRange?: DateRange) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { user } = useAuth()
  const supabase = createClient()

  // Function to manually trigger a refresh - memoized to prevent infinite loops
  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  // Fetch transactions when component mounts or when dependencies change
  useEffect(() => {
    let subscription: RealtimeChannel | null = null

    async function fetchTransactions() {
      if (!user?.id) return

      try {
        let query = supabase
          .from('transactions')
          .select(`
            *,
            categories (
              name
            )
          `)
          .eq('user_id', user.id)
          .order('date', { ascending: false })

        if (dateRange?.from) {
          query = query.gte('date', dateRange.from.toISOString().split('T')[0])
        }
        if (dateRange?.to) {
          query = query.lte('date', dateRange.to.toISOString().split('T')[0])
        }

        const { data, error } = await query as { data: TransactionWithCategory[] | null, error: unknown }

        if (error) throw error

        const processedTransactions = (data || []).map(transaction => ({
          ...transaction,
          category_name: transaction.categories?.name || transaction.category_name || 'Uncategorized'
        }))

        setTransactions(processedTransactions as Transaction[])
      } catch (err) {
        console.error('Error fetching transactions:', err)
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

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [supabase, user?.id, dateRange?.from, dateRange?.to, refresh, refreshTrigger])

  // CRUD operations with optimistic updates
  const createTransaction = useCallback(async (data: Partial<Transaction>) => {
    if (!user?.id) throw new Error('User not authenticated')

    const tempId = `temp-${Date.now()}`
    
    try {
      // Optimistic update - add transaction immediately
      const optimisticTransaction: Transaction = {
        id: tempId,
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        name: '',
        type: 'Expense',
        account_type: 'Checking',
        category_id: 0,
        category_name: 'Uncategorized',
        ...data
      } as Transaction

      setTransactions(prev => [optimisticTransaction, ...prev])

      const insertData = {
        user_id: user.id,
        date: data.date instanceof Date ? data.date.toISOString().split('T')[0] : (data.date || new Date().toISOString().split('T')[0]),
        amount: data.amount || 0,
        name: data.name || '',
        type: data.type || 'Expense',
        account_type: data.account_type || 'Checking',
        category_id: data.category_id || 0,
        description: data.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error, data: newTransaction } = await supabase
        .from('transactions')
        .insert(insertData)
        .select(`
          *,
          categories (
            name
          )
        `)
        .single()

      if (error) throw error

      const processedTransaction: Transaction = {
        ...newTransaction,
        user_id: newTransaction.user_id || user.id,
        category_name: (newTransaction as TransactionWithCategory)?.categories?.name || newTransaction.category_name || 'Uncategorized'
      } as Transaction

      setTransactions(prev => 
        prev.map(t => String(t.id) === tempId ? processedTransaction : t)
      )

      toast.success('Transaction created successfully')
      return processedTransaction
    } catch (err) {
      // Remove optimistic transaction on error
      setTransactions(prev => prev.filter(t => String(t.id) !== tempId))
      console.error('Error creating transaction:', err)
      toast.error('Failed to create transaction')
      throw err
    }
  }, [user?.id, supabase])

  const updateTransaction = useCallback(async (id: number | string, data: Partial<Transaction>) => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      // Optimistic update
      setTransactions(prev => 
        prev.map(t => t.id === id ? { ...t, ...data } : t)
      )

      const { id: _id, user_id: _user_id, ...dataWithoutId } = data
      const updateData = {
        ...dataWithoutId,
        date: data.date instanceof Date ? data.date.toISOString().split('T')[0] : data.date,
        updated_at: new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', Number(id))
        .eq('user_id', user.id)

      if (error) throw error

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
  }, [user?.id, supabase, refresh])

  const deleteTransaction = useCallback(async (id: number | string) => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      setTransactions(prev => prev.filter(t => t.id !== id))

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', Number(id))
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Transaction deleted successfully')
    } catch (err) {
      console.error('Error deleting transaction:', err)
      toast.error('Failed to delete transaction')
      // Restore transaction on error
      refresh()
      throw err
    }
  }, [user?.id, supabase, refresh])

  const bulkDeleteTransactions = useCallback(async (ids: (number | string)[]) => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      setTransactions(prev => prev.filter(t => !t.id || !ids.includes(t.id)))

      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', ids.map(id => Number(id)))
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Transactions deleted successfully')
    } catch (err) {
      console.error('Error deleting transactions:', err)
      toast.error('Failed to delete transactions')
      // Restore transactions on error
      refresh()
      throw err
    }
  }, [user?.id, supabase, refresh])

  const bulkUpdateTransactions = useCallback(async (ids: (number | string)[], changes: Partial<Transaction>) => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      // Optimistic update
      setTransactions(prev => 
        prev.map(t => t.id && ids.includes(t.id) ? { ...t, ...changes } : t)
      )

      const { id: _id, user_id: _user_id, ...changesWithoutId } = changes
      const updateData = {
        ...changesWithoutId,
        date: changes.date instanceof Date ? changes.date.toISOString().split('T')[0] : changes.date,
        updated_at: new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .in('id', ids.map(id => Number(id)))
        .eq('user_id', user.id)

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
  }, [user?.id, supabase, refresh])

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
