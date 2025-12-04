import { useCallback, useEffect } from 'react'
import { RecurringTransaction, Transaction } from "@/app/types/transaction"

interface UseRecurringActionsProps {
  refresh: () => Promise<void>
  deleteRecurringTransaction: (id: number | string) => Promise<void>
  bulkDeleteRecurringTransactions: (ids: (number | string)[]) => Promise<void>
  updateRecurringTransaction: (id: number | string, data: Partial<RecurringTransaction>) => Promise<void>
  bulkUpdateRecurringTransactions: (ids: (number | string)[], changes: Partial<RecurringTransaction>) => Promise<void>
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

  const handleDelete = useCallback(async (id: number | string) => {
    try {
      await deleteRecurringTransaction(id)
    } catch (error) {
      console.error("Error deleting transaction:", error)
    }
  }, [deleteRecurringTransaction])

  const handleBulkDelete = useCallback(async (ids: (number | string)[]) => {
    try {
      await bulkDeleteRecurringTransactions(ids)
    } catch (error) {
      console.error('Error deleting recurring transactions:', error)
    }
  }, [bulkDeleteRecurringTransactions])

  const handleEdit = useCallback(async (id: number | string, formData: Partial<Transaction>) => {
    try {
      await updateRecurringTransaction(id, formData as Partial<RecurringTransaction>)
    } catch (error) {
      console.error('Error updating recurring transaction:', error)
    }
  }, [updateRecurringTransaction])

  const handleBulkEdit = useCallback(async (ids: (number | string)[], changes: Partial<Transaction>) => {
    try {
      await bulkUpdateRecurringTransactions(ids, changes as Partial<RecurringTransaction>)
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
