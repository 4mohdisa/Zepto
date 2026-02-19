import { useCallback } from 'react'
import { UpdateTransaction } from '@/app/types/transaction'

interface User {
  id: string
  email?: string
  user_metadata?: {
    name?: string
  }
}

interface UseDashboardActionsProps {
  user: User | null
  refreshTransactions: () => void
  deleteTransaction: (id: number | string) => Promise<void>
  bulkDeleteTransactions: (ids: (number | string)[]) => Promise<void>
  updateTransaction: (id: number | string, data: Partial<UpdateTransaction>) => Promise<void>
  bulkUpdateTransactions: (ids: (number | string)[], changes: Partial<UpdateTransaction>) => Promise<void>
}

export function useDashboardActions({
  user,
  refreshTransactions,
  deleteTransaction,
  bulkDeleteTransactions,
  updateTransaction,
  bulkUpdateTransactions
}: UseDashboardActionsProps) {
  // Note: Transaction submission now handled by TransactionDialog with authenticated hooks
  // No longer need handleTransactionSubmit - it's just a pass-through callback

  const handleDeleteTransaction = useCallback(async (id: number | string) => {
    try {
      await deleteTransaction(id)
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }, [deleteTransaction])

  const handleBulkDelete = useCallback(async (ids: (number | string)[]) => {
    try {
      await bulkDeleteTransactions(ids)
    } catch (error) {
      console.error('Error deleting transactions:', error)
    }
  }, [bulkDeleteTransactions])

  const handleEditTransaction = useCallback(async (id: number | string, formData: Partial<UpdateTransaction>) => {
    try {
      // date is already a string in UpdateTransaction type, no need to convert
      await updateTransaction(id, formData)
    } catch (error) {
      console.error('Error updating transaction:', error)
    }
  }, [updateTransaction])

  const handleBulkEdit = useCallback(async (ids: (number | string)[], changes: Partial<UpdateTransaction>) => {
    try {
      // date is already a string in UpdateTransaction type, no need to convert
      await bulkUpdateTransactions(ids, changes)
    } catch (error) {
      console.error('Error updating transactions:', error)
    }
  }, [bulkUpdateTransactions])

  return {
    handleDeleteTransaction,
    handleBulkDelete,
    handleEditTransaction,
    handleBulkEdit
  }
}
