'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/providers'
import { debugLogger } from '@/lib/utils/debug-logger'

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
  
  const [history, setHistory] = useState<BalanceHistoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
    setErrorCode(null)

    try {
      const params = new URLSearchParams()
      params.append('limit', String(limit))
      if (accountType && accountType !== 'all') {
        params.append('accountType', accountType)
      }

      const response = await fetch(`/api/balance-history?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        // Extract structured error from API
        const errorMessage = result.error || result.message || `Failed to fetch: ${response.statusText}`
        const errorCodeValue = result.code || `HTTP_${response.status}`
        
        throw {
          message: errorMessage,
          code: errorCodeValue,
          details: result.details,
          sqlHint: result.sqlHint
        }
      }

      setHistory(result.history || [])
      debugLogger.info('balance', 'Fetched balance history', { 
        count: result.count || 0,
        duration: result.duration 
      })
    } catch (err: any) {
      const message = err?.message || 'Failed to fetch history'
      const code = err?.code || 'UNKNOWN_ERROR'
      
      setError(message)
      setErrorCode(code)
      
      debugLogger.error('balance', 'Failed to fetch history', { 
        error: message,
        code: code,
        details: err?.details,
        sqlHint: err?.sqlHint
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, accountType, limit])

  // Add a new history record
  const addHistoryRecord = useCallback(async (
    accountType: string, 
    balanceAmount: number, 
    note?: string
  ) => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/balance-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_type: accountType,
          balance_amount: balanceAmount,
          note: note || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to add history')
      }

      debugLogger.info('balance', 'Added history record', { 
        accountType, 
        balanceAmount,
        recordId: result.record?.id 
      })
      
      // Refresh history after adding
      await fetchHistory()
      
      return result.record
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add history'
      debugLogger.error('balance', 'Failed to add history', { 
        accountType,
        balanceAmount,
        error: message 
      })
      throw err
    }
  }, [user?.id, fetchHistory])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return {
    history,
    loading,
    error,
    errorCode,
    refetch: fetchHistory,
    addHistoryRecord,
  }
}

export default useBalanceHistory
