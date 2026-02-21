'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSupabaseClient } from '@/utils/supabase/client'
import { useAuth } from '@/context/auth-context'

interface AccountBalance {
  id: number
  user_id: string
  account_type: string
  current_balance: number
  effective_date: string
  last_updated: string
}

interface BalanceCalculation {
  account_type: string
  starting_balance: number
  effective_date: string
  income_after: number
  expenses_after: number
  current_balance: number
}

export function useCurrentBalance() {
  const [balances, setBalances] = useState<AccountBalance[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = useSupabaseClient()

  // Fetch account balances and transactions
  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    let isCancelled = false

    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch account balances
        const { data: balancesData, error: balancesError } = await supabase
          .from('account_balances')
          .select('*')
          .eq('user_id', user.id)

        if (balancesError) throw balancesError

        // Fetch all transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })

        if (transactionsError) throw transactionsError

        if (!isCancelled) {
          setBalances(balancesData || [])
          setTransactions(transactionsData || [])
        }
      } catch (err) {
        console.error('Error fetching balance data:', err)
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    // Subscribe to transaction changes
    const subscription = supabase
      .channel('transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchData() // Refetch when transactions change
        }
      )
      .subscribe()

    return () => {
      isCancelled = true
      subscription.unsubscribe()
    }
  }, [user?.id, supabase])

  // Calculate current balance for each account
  const balanceSummary = useMemo((): BalanceCalculation[] => {
    if (balances.length === 0) return []

    return balances.map((balance) => {
      const effectiveDate = balance.effective_date || '1970-01-01'

      // Get transactions after the effective date
      const transactionsAfter = transactions.filter((t) => {
        const transactionDate = t.date
        return transactionDate >= effectiveDate
      })

      // Calculate income and expenses
      const incomeAfter = transactionsAfter
        .filter((t) => t.type === 'Income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const expensesAfter = transactionsAfter
        .filter((t) => t.type === 'Expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      // Calculate current balance
      const currentBalance =
        Number(balance.current_balance) + incomeAfter - expensesAfter

      return {
        account_type: balance.account_type,
        starting_balance: Number(balance.current_balance),
        effective_date: effectiveDate,
        income_after: incomeAfter,
        expenses_after: expensesAfter,
        current_balance: currentBalance,
      }
    })
  }, [balances, transactions])

  // Calculate totals
  const totals = useMemo(() => {
    return {
      totalStartingBalance: balanceSummary.reduce(
        (sum, b) => sum + b.starting_balance,
        0
      ),
      totalCurrentBalance: balanceSummary.reduce(
        (sum, b) => sum + b.current_balance,
        0
      ),
      totalIncome: balanceSummary.reduce((sum, b) => sum + b.income_after, 0),
      totalExpenses: balanceSummary.reduce((sum, b) => sum + b.expenses_after, 0),
    }
  }, [balanceSummary])

  // Refresh function
  const refresh = useCallback(async () => {
    if (!user?.id) return

    try {
      // Refetch balances
      const { data: balancesData } = await supabase
        .from('account_balances')
        .select('*')
        .eq('user_id', user.id)

      // Refetch transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      setBalances(balancesData || [])
      setTransactions(transactionsData || [])
    } catch (err) {
      console.error('Error refreshing balance:', err)
    }
  }, [user?.id, supabase])

  return {
    balanceSummary,
    totals,
    loading,
    refresh,
  }
}
