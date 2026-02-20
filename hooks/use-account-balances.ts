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
  const [usingFallback, setUsingFallback] = useState(false)
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
        setUsingFallback(false)
        
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

        // Try to fetch current balance summary (bank-style calculation)
        try {
          const { data: summaryData, error: summaryError } = await supabase
            .rpc('get_current_balance_summary', { p_user_id: user.id })

          if (summaryError) {
            // If function doesn't exist, use fallback calculation
            console.warn('[useAccountBalances] Using fallback calculation - run migration 009_update_balance_system.sql')
            setUsingFallback(true)
            
            // Fallback: Calculate from balances directly without effective date logic
            const fallbackSummary = (balancesData || []).map((balance: any) => ({
              account_type: balance.account_type,
              starting_balance: Number(balance.current_balance),
              effective_date: balance.effective_date || new Date().toISOString().split('T')[0],
              income_after: 0,
              expenses_after: 0,
              current_balance: Number(balance.current_balance)
            }))
            
            if (!isCancelled) {
              setCurrentBalanceSummary(fallbackSummary)
            }
          } else {
            if (!isCancelled) {
              setCurrentBalanceSummary(summaryData || [])
            }
          }
        } catch (rpcError) {
          console.warn('[useAccountBalances] RPC failed, using fallback:', rpcError)
          setUsingFallback(true)
          
          // Fallback calculation
          const fallbackSummary = (balancesData || []).map((balance: any) => ({
            account_type: balance.account_type,
            starting_balance: Number(balance.current_balance),
            effective_date: balance.effective_date || new Date().toISOString().split('T')[0],
            income_after: 0,
            expenses_after: 0,
            current_balance: Number(balance.current_balance)
          }))
          
          if (!isCancelled) {
            setCurrentBalanceSummary(fallbackSummary)
          }
        }

        if (!isCancelled) {
          console.info('[useAccountBalances] Fetched successfully', { 
            balancesCount: balancesData?.length || 0,
            summaryCount: balancesData?.length || 0,
            usingFallback
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
      
      // Check if effective_date column exists by trying to use it
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

      if (error) {
        // If effective_date doesn't exist, try without it
        if (error.message?.includes('effective_date')) {
          console.warn('[useAccountBalances] effective_date column not found, using legacy upsert')
          const { error: legacyError } = await supabase
            .from('account_balances')
            .upsert({
              user_id: user.id,
              account_type: data.account_type,
              current_balance: data.current_balance,
              last_updated: new Date().toISOString()
            }, {
              onConflict: 'user_id,account_type'
            })
          if (legacyError) throw legacyError
        } else {
          throw error
        }
      }

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

      if (error) {
        // Fallback: just return the stored balance
        const balance = balances.find(b => b.account_type === accountType)
        return balance ? Number(balance.current_balance) : 0
      }
      return data || 0
    } catch (err) {
      console.error('Error calculating current balance:', err)
      // Fallback
      const balance = balances.find(b => b.account_type === accountType)
      return balance ? Number(balance.current_balance) : 0
    }
  }, [user?.id, supabase, balances])

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
    const dates = balances.map(b => new Date(b.effective_date || b.last_updated))
    const latest = new Date(Math.max(...dates.map(d => d.getTime())))
    return latest.toISOString().split('T')[0]
  }, [balances])

  return {
    balances,
    currentBalanceSummary,
    loading,
    error,
    usingFallback,
    refresh,
    upsertBalance,
    updateBalance,
    deleteBalance,
    calculateCurrentBalance,
    totals,
    latestEffectiveDate
  }
}
