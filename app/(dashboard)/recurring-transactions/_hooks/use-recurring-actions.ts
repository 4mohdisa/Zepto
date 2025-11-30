import { useCallback, useEffect } from 'react'
import { Transaction } from "@/app/types/transaction"

interface UseRecurringActionsProps {
  refresh: () => Promise<void>
  deleteRecurringTransaction: (id: number) => Promise<void>
  bulkDeleteRecurringTransactions: (ids: number[]) => Promise<void>
  updateRecurringTransaction: (id: number, data: Partial<Transaction>) => Promise<void>
  bulkUpdateRecurringTransactions: (ids: number[], changes: Partial<Transaction>) => Promise<void>
  onOpenAddDialog: () => void
}

export function useRecurringActions({
  refresh,
  deleteRecurringTransaction,
  bulkDeleteRecurringTransactions,
  updateRecurringTransaction,
  bulkUpdateRecurringTransactions,
  onOpenAddDialog
}: UseRecurringActionsProps) {
  // Listen for header event to open add dialog
  useEffect(() => {
    const handleHeaderAddRecurringTransaction = () => {
      onOpenAddDialog()
    }

    window.addEventListener('header:addrecurringtransaction', handleHeaderAddRecurringTransaction)

    return () => {
      window.removeEventListener('header:addrecurringtransaction', handleHeaderAddRecurringTransaction)
    }
  }, [onOpenAddDialog])

  const handleAddSuccess = useCallback(async () => {
    try {
      await refresh()
    } catch (error) {
      console.error("Error creating transaction:", error)
    }
  }, [refresh])

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteRecurringTransaction(id)
    } catch (error) {
      console.error("Error deleting transaction:", error)
    }
  }, [deleteRecurringTransaction])

  const handleBulkDelete = useCallback(async (ids: number[]) => {
    try {
      await bulkDeleteRecurringTransactions(ids)
    } catch (error) {
      console.error('Error deleting recurring transactions:', error)
    }
  }, [bulkDeleteRecurringTransactions])

  const handleEdit = useCallback(async (id: number, formData: Partial<Transaction>) => {
    try {
      await updateRecurringTransaction(id, formData)
    } catch (error) {
      console.error('Error updating recurring transaction:', error)
    }
  }, [updateRecurringTransaction])

  const handleBulkEdit = useCallback(async (ids: number[], changes: Partial<Transaction>) => {
    try {
      await bulkUpdateRecurringTransactions(ids, changes)
    } catch (error) {
      console.error('Error updating recurring transactions:', error)
    }
  }, [bulkUpdateRecurringTransactions])

  return {
    handleAddSuccess,
    handleDelete,
    handleBulkDelete,
    handleEdit,
    handleBulkEdit
  }
}
