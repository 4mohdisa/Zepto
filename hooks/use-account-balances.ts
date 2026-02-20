'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSupabaseClient } from '@/utils/supabase/client'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import type { AccountBalance, CurrentBalanceSummary, CreateBalanceData, UpdateBalanceData, AccountType } from '@/app/types/balance'

export function useAccountBalances() {
  const [balances, setBalances] = useState<AccountBalance[]>([])
  const [currentBalanceSummary, setCurrentBalanceSummary] = useState<CurrentBalanceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { user } = useAuth()
  const supabase = useSupabaseClient()
  
  // Fetch account balances and current balance summary
  useEffect(() => {
    if (!user?.id) {
      setBalances([])
      setCurrentBalanceSummary([])
      setLoading(false)
      return
    }

    let isCancelled = false

    const fetchBalances = async () => {
      console.info('[useAccountBalances] Fetching account balances for user:', user.id.substring(0, 12) + '...')
      
      try {
        setLoading(true)
        setError(null)
        
        // Fetch account balances
        const { data: balancesData, error: balancesError } = await supabase
          .from('account_balances')
          .select('*')
          .eq('user_id', user.id)
          .order('account_type')

        if (balancesError) throw balancesError

        if (!isCancelled) {
          setBalances(balancesData || [])
        }

        // Fetch current balance summary (bank-style calculation)
        const { data: summaryData, error: summaryError } = await supabase
          .rpc('get_current_balance_summary', { p_user_id: user.id })

        if (summaryError) throw summaryError

        if (!isCancelled) {
          setCurrentBalanceSummary(summaryData || [])
          console.info('[useAccountBalances] Fetched successfully', { 
            balancesCount: balancesData?.length || 0,
            summaryCount: summaryData?.length || 0
          })
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch account balances'
        console.error('[useAccountBalances] Failed to fetch', { error: errorMessage })
        if (!isCancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch account balances'))
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchBalances()

    return () => {
      isCancelled = true
    }
  }, [user?.id, refreshTrigger, supabase])

  // Refresh function
  const refresh = useCallback(async (): Promise<void> => {
    console.info('[useAccountBalances] Refreshing...')
    setRefreshTrigger(prev => prev + 1)
  }, [])

  // Create or update balance
  const upsertBalance = useCallback(async (data: CreateBalanceData): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      const effectiveDate = data.effective_date || new Date().toISOString().split('T')[0]
      
      const { error } = await supabase
        .from('account_balances')
        .upsert({
          user_id: user.id,
          account_type: data.account_type,
          current_balance: data.current_balance,
          effective_date: effectiveDate,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id,account_type'
        })

      if (error) throw error

      console.info('[useAccountBalances] Balance upserted, refreshing...')
      await refresh()
      toast.success(`${data.account_type} balance updated successfully`)
    } catch (err) {
      console.error('Error updating balance:', err)
      toast.error('Failed to update balance')
      throw err
    }
  }, [user?.id, supabase, refresh])

  // Update balance by ID
  const updateBalance = useCallback(async (id: number, data: UpdateBalanceData): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      const updateData: any = {
        current_balance: data.current_balance,
        last_updated: new Date().toISOString()
      }
      
      if (data.effective_date) {
        updateData.effective_date = data.effective_date
      }
      
      const { error } = await supabase
        .from('account_balances')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await refresh()
      toast.success('Balance updated successfully')
    } catch (err) {
      console.error('Error updating balance:', err)
      toast.error('Failed to update balance')
      throw err
    }
  }, [user?.id, supabase, refresh])

  // Delete balance
  const deleteBalance = useCallback(async (id: number): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      const { error } = await supabase
        .from('account_balances')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await refresh()
      toast.success('Balance entry deleted successfully')
    } catch (err) {
      console.error('Error deleting balance:', err)
      toast.error('Failed to delete balance')
      throw err
    }
  }, [user?.id, supabase, refresh])

  // Calculate current balance for a specific account
  const calculateCurrentBalance = useCallback(async (accountType: AccountType): Promise<number> => {
    if (!user?.id) return 0

    try {
      const { data, error } = await supabase
        .rpc('calculate_current_balance', { 
          p_user_id: user.id,
          p_account_type: accountType 
        })

      if (error) throw error
      return data || 0
    } catch (err) {
      console.error('Error calculating current balance:', err)
      return 0
    }
  }, [user?.id, supabase])

  // Calculate totals for current balance
  const totals = useMemo(() => {
    const totalCurrentBalance = currentBalanceSummary.reduce((sum, b) => sum + Number(b.current_balance), 0)
    const totalStartingBalance = currentBalanceSummary.reduce((sum, b) => sum + Number(b.starting_balance), 0)
    const totalIncome = currentBalanceSummary.reduce((sum, b) => sum + Number(b.income_after), 0)
    const totalExpenses = currentBalanceSummary.reduce((sum, b) => sum + Number(b.expenses_after), 0)
    
    return {
      totalCurrentBalance,
      totalStartingBalance,
      totalIncome,
      totalExpenses
    }
  }, [currentBalanceSummary])

  // Get the latest effective date across all accounts
  const latestEffectiveDate = useMemo(() => {
    if (balances.length === 0) return null
    const dates = balances.map(b => new Date(b.effective_date))
    const latest = new Date(Math.max(...dates.map(d => d.getTime())))
    return latest.toISOString().split('T')[0]
  }, [balances])

  return {
    balances,
    currentBalanceSummary,
    loading,
    error,
    refresh,
    upsertBalance,
    updateBalance,
    deleteBalance,
    calculateCurrentBalance,
    totals,
    latestEffectiveDate
  }
}
