import { useCallback, useEffect } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { transactionService } from '@/app/services/transaction-services'
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
  // Process any due recurring transactions on mount
  useEffect(() => {
    const generateDueTransactions = async () => {
      if (!user) return

      try {
        const generatedTransactions = await transactionService.generateDueTransactions(user.id)
        
        if (generatedTransactions && generatedTransactions.length > 0) {
          toast.success(`${generatedTransactions.length} transaction(s) generated from recurring schedules`)
          refreshTransactions()
        }
      } catch (error) {
        console.error('Error generating due transactions:', error)
        toast.error('Failed to process recurring transactions')
      }
    }

    generateDueTransactions()
  }, [user, refreshTransactions])

  const handleTransactionSubmit = useCallback(async (data: any) => {
    if (!user) return

    try {
      if (data.transactionType === "regular") {
        const transactionData = {
          ...data,
          user_id: user.id
        }
        await transactionService.createTransaction(transactionData)
      } else {
        await transactionService.createCombinedTransaction(data, user.id)
      }
    } catch (error) {
      console.error("Failed to create transaction:", error)
    }
  }, [user])

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
    handleTransactionSubmit,
    handleDeleteTransaction,
    handleBulkDelete,
    handleEditTransaction,
    handleBulkEdit
  }
}
