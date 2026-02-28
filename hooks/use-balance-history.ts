'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabaseClient } from '@/utils/supabase/client'
import { useAuth } from '@/context/auth-context'
import { debugLogger } from '@/utils/debug-logger'

export interface BalanceHistoryRecord {
  id: string
  user_id: string
  account_type: string
  balance_amount: number
  note: string | null
  created_at: string
}

interface UseBalanceHistoryOptions {
  accountType?: string
  limit?: number
}

export function useBalanceHistory(options: UseBalanceHistoryOptions = {}) {
  const { accountType, limit = 50 } = options
  const { user } = useAuth()
  const supabase = useSupabaseClient()
  
  const [history, setHistory] = useState<BalanceHistoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('account_balance_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (accountType && accountType !== 'all') {
        query = query.eq('account_type', accountType)
      }

      const { data, error: supabaseError } = await query

      if (supabaseError) {
        throw supabaseError
      }

      setHistory(data || [])
      debugLogger.info('balance', 'Fetched balance history', { count: data?.length || 0 })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch history'
      setError(message)
      debugLogger.error('balance', 'Failed to fetch history', { error: message })
    } finally {
      setLoading(false)
    }
  }, [user?.id, accountType, limit, supabase])

  // Add a new history record
  const addHistoryRecord = useCallback(async (
    accountType: string, 
    balanceAmount: number, 
    note?: string
  ) => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('account_balance_history')
        .insert({
          user_id: user.id,
          account_type: accountType,
          balance_amount: balanceAmount,
          note: note || null,
        })

      if (error) throw error

      debugLogger.info('balance', 'Added history record', { accountType, balanceAmount })
      
      // Refresh history after adding
      await fetchHistory()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add history'
      debugLogger.error('balance', 'Failed to add history', { error: message })
    }
  }, [user?.id, supabase, fetchHistory])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return {
    history,
    loading,
    error,
    refetch: fetchHistory,
    addHistoryRecord,
  }
}

export default useBalanceHistory
