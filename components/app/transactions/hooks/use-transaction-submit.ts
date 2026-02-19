import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Transaction } from '@/app/types/transaction'
import { TransactionFormValues } from '../../shared/transaction-schema'
import { TransactionType } from '@/data/transactiontypes'
import { FrequencyType, frequencies } from '@/data/frequencies'
import { AccountType } from '@/data/account-types'

interface Category {
  id: number
  name: string
}

interface UseTransactionSubmitProps {
  userId: string | undefined
  categories: Category[]
  categoriesLoading: boolean
  categoriesError: Error | null
  mode: 'create' | 'edit'
  onSuccess: () => void
  onSubmitCallback?: (data: TransactionFormValues) => void
  createTransaction?: (data: Partial<Transaction>) => Promise<Transaction>
  updateTransaction?: (id: number | string, data: Partial<Transaction>) => Promise<void>
}

export function useTransactionSubmit({
  userId,
  categories,
  categoriesLoading,
  categoriesError,
  mode,
  onSuccess,
  onSubmitCallback,
  createTransaction,
  updateTransaction
}: UseTransactionSubmitProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async (data: TransactionFormValues) => {
    if (!userId) {
      toast.error("Authentication required", {
        description: "Please sign in to create transactions.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (categoriesLoading) {
        throw new Error('Categories are still loading. Please try again.')
      }

      if (categoriesError) {
        throw new Error('Failed to load categories. Please refresh the page.')
      }

      const categoryId = Number(data.category_id)
      const selectedCategory = categories.find(cat => cat.id === categoryId)
      
      if (!selectedCategory) {
        throw new Error(`Category ${categoryId} not found. Please select a valid category.`)
      }

      const now = new Date().toISOString()
      let result: { transaction?: unknown; recurringTransaction?: unknown; success?: boolean } = {}
      
      if (mode === 'edit') {
        // TODO: Implement edit mode using updateTransaction
        result = { success: true }
      } else if (data.recurring_frequency !== 'Never') {
        // TODO: Implement recurring transaction creation using createRecurringTransaction hook
        toast.error('Recurring transactions not yet supported', {
          description: 'Please use recurring transactions page to create recurring transactions'
        })
        throw new Error('Recurring transactions not yet supported')
      } else {
        // One-time transaction - use authenticated createTransaction function
        if (!createTransaction) {
          throw new Error('Create transaction function not provided')
        }

        const transactionData: Partial<Transaction> = {
          user_id: userId,
          name: data.name,
          amount: data.amount,
          type: data.type as TransactionType,
          account_type: data.account_type as AccountType,
          category_id: categoryId,
          description: data.description,
          date: data.date.toISOString().split('T')[0], // YYYY-MM-DD format
          recurring_frequency: 'Never' as FrequencyType
        }

        const transaction = await createTransaction(transactionData)
        result = { transaction }
      }

      if (result.transaction) {
        toast.success(`${mode === 'create' ? 'Created' : 'Updated'} transaction`, {
          description: `${data.name} - ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.amount)}`
        })
      }
      
      if (result.recurringTransaction) {
        const frequencyObj = frequencies.find(f => f.value === data.recurring_frequency)
        toast.success('Created recurring transaction', {
          description: `This transaction will repeat ${frequencyObj ? frequencyObj.label : data.recurring_frequency}`
        })
      }

      onSubmitCallback?.(data)
      onSuccess()
    } catch (error) {
      console.error('Failed to submit transaction:', error)
      let errorMessage = "Please try again."
      
      if (error instanceof Error) {
        if (error.message.includes('user_id')) {
          errorMessage = "Authentication required. Please sign in."
        } else if (error.message.includes('date')) {
          errorMessage = "Please select a valid date."
        } else if (error.message.includes('frequency')) {
          errorMessage = "Please select a valid recurring frequency."
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error("Failed to save transaction", {
        description: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [userId, categories, categoriesLoading, categoriesError, mode, onSuccess, onSubmitCallback])

  return { handleSubmit, isSubmitting }
}
