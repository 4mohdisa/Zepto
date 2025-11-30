'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { RecurringTransaction, Transaction } from '@/app/types/transaction'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { predictUpcomingTransactions } from '@/utils/predict-transactions'

export function useRecurringTransactions(): {
  recurringTransactions: RecurringTransaction[];
  upcomingTransactions: Transaction[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  createRecurringTransaction: (data: Partial<RecurringTransaction>) => Promise<void>;
  updateRecurringTransaction: (id: number, data: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: number) => Promise<void>;
  bulkDeleteRecurringTransactions: (ids: number[]) => Promise<void>;
  bulkUpdateRecurringTransactions: (ids: number[], changes: Partial<RecurringTransaction>) => Promise<void>;
} {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  // Fetch recurring transactions
  const fetchRecurringTransactions = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Process the data to extract category names
      const processedData = (data || []).map(item => ({
        ...item,
        category_name: item.categories?.name || 'Uncategorized'
      }))

      setRecurringTransactions(processedData as RecurringTransaction[])
    } catch (err) {
      console.error('Error fetching recurring transactions:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch recurring transactions'))
    } finally {
      setLoading(false)
    }
  }, [user?.id, supabase])

  // Force a refresh of recurring transactions
  const refresh = useCallback(async (): Promise<void> => {
    setRefreshTrigger(prev => prev + 1)
    // Don't call fetchRecurringTransactions directly to avoid circular dependency
    // The refreshTrigger change will trigger the useEffect that calls it
  }, [])

  // Create recurring transaction
  const createRecurringTransaction = useCallback(async (data: Partial<RecurringTransaction>) => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      const insertData = {
        user_id: user.id,
        name: data.name || '',
        amount: data.amount || 0,
        type: data.type || 'Expense',
        account_type: data.account_type || 'Checking',
        category_id: data.category_id || 0,
        frequency: data.frequency || 'Monthly',
        start_date: data.start_date instanceof Date ? data.start_date.toISOString() : (data.start_date || new Date().toISOString()),
        end_date: data.end_date instanceof Date ? data.end_date.toISOString() : data.end_date,
        description: data.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('recurring_transactions')
        .insert(insertData)

      if (error) throw error

      await refresh()
      toast.success('Recurring transaction created successfully')
    } catch (err) {
      console.error('Error creating recurring transaction:', err)
      toast.error('Failed to create recurring transaction')
      throw err
    }
  }, [user?.id, supabase, refresh])

  // Update recurring transaction
  const updateRecurringTransaction = useCallback(async (id: number, data: Partial<RecurringTransaction>) => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      const { id: _id, user_id: _user_id, ...dataWithoutId } = data
      const updateData = {
        ...dataWithoutId,
        start_date: data.start_date instanceof Date ? data.start_date.toISOString() : data.start_date,
        end_date: data.end_date instanceof Date ? data.end_date.toISOString() : data.end_date,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('recurring_transactions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await refresh()
      toast.success('Recurring transaction updated successfully')
    } catch (err) {
      console.error('Error updating recurring transaction:', err)
      toast.error('Failed to update recurring transaction')
      throw err
    }
  }, [user?.id, supabase, refresh])

  // Delete recurring transaction
  const deleteRecurringTransaction = useCallback(async (id: number) => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await refresh()
      toast.success('Recurring transaction deleted successfully')
    } catch (err) {
      console.error('Error deleting recurring transaction:', err)
      toast.error('Failed to delete recurring transaction')
      throw err
    }
  }, [user?.id, supabase, refresh])

  // Bulk delete
  const bulkDeleteRecurringTransactions = useCallback(async (ids: number[]) => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id)

      if (error) throw error

      await refresh()
      toast.success('Recurring transactions deleted successfully')
    } catch (err) {
      console.error('Error deleting recurring transactions:', err)
      toast.error('Failed to delete recurring transactions')
      throw err
    }
  }, [user?.id, supabase, refresh])

  // Bulk update
  const bulkUpdateRecurringTransactions = useCallback(async (ids: number[], changes: Partial<RecurringTransaction>) => {
    if (!user?.id) throw new Error('User not authenticated')

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
        .in('id', ids)
        .eq('user_id', user.id)

      if (error) throw error

      await refresh()
      toast.success('Recurring transactions updated successfully')
    } catch (err) {
      console.error('Error updating recurring transactions:', err)
      toast.error('Failed to update recurring transactions')
      throw err
    }
  }, [user?.id, supabase, refresh])

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchRecurringTransactions()
    }
  }, [user?.id, fetchRecurringTransactions, refreshTrigger])

  // Generate predicted upcoming transactions in-memory
  const upcomingTransactions = useMemo((): Transaction[] => {
    // Generate 2 upcoming transactions per recurring transaction
    return predictUpcomingTransactions(recurringTransactions, 2)
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