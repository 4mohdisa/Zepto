import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { transactionService } from '@/app/services/transaction-services'
import { RecurringTransactionFormValues } from '../../shared/transaction-schema'

interface UseRecurringTransactionSubmitProps {
  userId: string | undefined
  mode: 'create' | 'edit'
  initialDataId?: number
  onSuccess: () => void
  onSubmitCallback?: (data: RecurringTransactionFormValues) => void
  onRefresh?: () => void
}

export function useRecurringTransactionSubmit({
  userId,
  mode,
  initialDataId,
  onSuccess,
  onSubmitCallback,
  onRefresh
}: UseRecurringTransactionSubmitProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async (data: RecurringTransactionFormValues) => {
    if (!userId) {
      toast.error("Authentication required", {
        description: "Please sign in to create recurring transactions.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formatDate = (date: Date | undefined): string | undefined =>
        date ? date.toISOString() : undefined

      const submissionData = {
        ...data,
        user_id: userId,
        category_id: data.category_id ? parseInt(data.category_id, 10) : 1,
        start_date: formatDate(data.start_date) as string,
        end_date: formatDate(data.end_date),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (mode === 'create') {
        await transactionService.createRecurringTransaction(submissionData)
      } else if (mode === 'edit' && initialDataId) {
        await transactionService.updateRecurringTransaction(initialDataId, submissionData, userId)
      } else if (onSubmitCallback) {
        await onSubmitCallback(data)
      }

      toast.success(
        `${mode === 'create' ? 'Created' : 'Updated'} recurring transaction`,
        { description: 'Your recurring transaction has been successfully saved.' }
      )

      onRefresh?.()
      onSuccess()
    } catch (error) {
      console.error('Failed to submit recurring transaction:', error)
      toast.error('Failed to save recurring transaction', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [userId, mode, initialDataId, onSuccess, onSubmitCallback, onRefresh])

  return { handleSubmit, isSubmitting }
}
