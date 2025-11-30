import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { transactionService } from '@/app/services/transaction-services'
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
}

export function useTransactionSubmit({
  userId,
  categories,
  categoriesLoading,
  categoriesError,
  mode,
  onSuccess,
  onSubmitCallback
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
        result = { success: true }
      } else if (data.recurring_frequency !== 'Never') {
        // Create both transaction and recurring transaction
        const transactionData = {
          name: data.name,
          amount: data.amount,
          type: data.type as TransactionType,
          account_type: data.account_type as AccountType,
          category_id: categoryId,
          description: data.description,
          date: data.date.toISOString(),
          created_at: now,
          updated_at: now,
          user_id: userId,
          recurring_frequency: data.recurring_frequency as FrequencyType
        }
        
        const { transaction } = await transactionService.createTransaction(transactionData)
        
        const recurringData = {
          user_id: userId,
          name: data.name,
          amount: data.amount,
          type: data.type as TransactionType,
          account_type: data.account_type as AccountType,
          category_id: categoryId,
          description: data.description,
          frequency: data.recurring_frequency as FrequencyType,
          start_date: data.date.toISOString(),
          end_date: null,
          created_at: now,
          updated_at: now
        }
        
        const recurringTransaction = await transactionService.createRecurringTransaction(recurringData)
        result = { transaction, recurringTransaction }
      } else {
        // One-time transaction
        const transactionData = {
          name: data.name,
          amount: data.amount,
          type: data.type as TransactionType,
          account_type: data.account_type as AccountType,
          category_id: categoryId,
          description: data.description,
          date: data.date.toISOString(),
          created_at: now,
          updated_at: now,
          user_id: userId,
          recurring_frequency: 'Never' as FrequencyType
        }
        
        result = await transactionService.createTransaction(transactionData)
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
