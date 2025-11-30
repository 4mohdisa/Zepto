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
  deleteTransaction: (id: number) => Promise<void>
  bulkDeleteTransactions: (ids: number[]) => Promise<void>
  updateTransaction: (id: number, data: Partial<UpdateTransaction>) => Promise<void>
  bulkUpdateTransactions: (ids: number[], changes: Partial<UpdateTransaction>) => Promise<void>
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

  const handleDeleteTransaction = useCallback(async (id: number) => {
    try {
      await deleteTransaction(id)
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }, [deleteTransaction])

  const handleBulkDelete = useCallback(async (ids: number[]) => {
    try {
      await bulkDeleteTransactions(ids)
    } catch (error) {
      console.error('Error deleting transactions:', error)
    }
  }, [bulkDeleteTransactions])

  const handleEditTransaction = useCallback(async (id: number, formData: Partial<UpdateTransaction>) => {
    try {
      const formattedData = {
        ...formData,
        date: formData.date instanceof Date ? format(formData.date, 'yyyy-MM-dd') : formData.date
      }
      await updateTransaction(id, formattedData)
    } catch (error) {
      console.error('Error updating transaction:', error)
    }
  }, [updateTransaction])

  const handleBulkEdit = useCallback(async (ids: number[], changes: Partial<UpdateTransaction>) => {
    try {
      const formattedChanges = {
        ...changes,
        date: changes.date instanceof Date ? format(changes.date, 'yyyy-MM-dd') : changes.date
      }
      await bulkUpdateTransactions(ids, formattedChanges)
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
