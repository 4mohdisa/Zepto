import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { UpdateTransaction } from '@/app/types/transaction'
import { DateRange } from "react-day-picker"

interface UseTransactionsActionsProps {
  userId: string | undefined
  refresh: () => void
  onOpenAddDialog: () => void
  setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>
}

export function useTransactionsActions({
  userId,
  refresh,
  onOpenAddDialog,
  setDateRange
}: UseTransactionsActionsProps) {
  // Header event listeners
  useEffect(() => {
    const handleDateRangeChange = (event: CustomEvent) => {
      const { dateRange: newRange } = event.detail
      setDateRange(prevRange => {
        if (!prevRange && !newRange) return prevRange
        if (!prevRange || !newRange) return newRange
        if (prevRange.from?.getTime() !== newRange.from?.getTime() || 
            prevRange.to?.getTime() !== newRange.to?.getTime()) {
          return newRange
        }
        return prevRange
      })
    }

    const handleAddTransaction = () => onOpenAddDialog()

    window.addEventListener('header:daterangechange', handleDateRangeChange as EventListener)
    window.addEventListener('header:addtransaction', handleAddTransaction)

    return () => {
      window.removeEventListener('header:daterangechange', handleDateRangeChange as EventListener)
      window.removeEventListener('header:addtransaction', handleAddTransaction)
    }
  }, [onOpenAddDialog, setDateRange])

  const handleAddSuccess = useCallback(async () => {
    refresh()
    toast.success('Transaction added successfully')
  }, [refresh])

  const handleDelete = useCallback(async (id: number) => {
    if (!userId) {
      toast.error('Authentication required')
      return
    }
    try {
      const supabase = createClient()
      const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId)
      if (error) throw error
      refresh()
      toast.success('Transaction deleted successfully')
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Failed to delete transaction')
    }
  }, [userId, refresh])

  const handleBulkDelete = useCallback(async (ids: number[]) => {
    if (!userId) {
      toast.error('Authentication required')
      return
    }
    try {
      const supabase = createClient()
      const { error } = await supabase.from('transactions').delete().in('id', ids).eq('user_id', userId)
      if (error) throw error
      refresh()
      toast.success('Transactions deleted successfully')
    } catch (error) {
      console.error('Error deleting transactions:', error)
      toast.error('Failed to delete transactions')
    }
  }, [userId, refresh])

  const handleEdit = useCallback(async (id: number, formData: Partial<UpdateTransaction>) => {
    if (!userId) {
      toast.error('Authentication required')
      return
    }
    try {
      const supabaseData = {
        ...(formData.name && { name: formData.name }),
        ...(formData.amount && { amount: formData.amount }),
        ...(formData.type && { type: formData.type }),
        ...(formData.account_type && { account_type: formData.account_type }),
        ...(formData.category_id && { category_id: formData.category_id }),
        ...(formData.description && { description: formData.description }),
        ...(formData.date && { date: formData.date instanceof Date ? formData.date.toISOString() : formData.date }),
      }
      const supabase = createClient()
      const { error } = await supabase.from('transactions').update(supabaseData).eq('id', id).eq('user_id', userId)
      if (error) throw error
      refresh()
      toast.success('Transaction updated successfully')
    } catch (error) {
      console.error('Error updating transaction:', error)
      toast.error('Failed to update transaction')
    }
  }, [userId, refresh])

  const handleBulkEdit = useCallback(async (ids: number[], changes: Partial<UpdateTransaction>) => {
    if (!userId) {
      toast.error('Authentication required')
      return
    }
    try {
      const supabaseData = {
        ...(changes.name && { name: changes.name }),
        ...(changes.amount && { amount: changes.amount }),
        ...(changes.type && { type: changes.type }),
        ...(changes.account_type && { account_type: changes.account_type }),
        ...(changes.category_id && { category_id: changes.category_id }),
        ...(changes.description && { description: changes.description }),
        ...(changes.date && { date: changes.date instanceof Date ? changes.date.toISOString() : changes.date }),
      }
      const supabase = createClient()
      const { error } = await supabase.from('transactions').update(supabaseData).in('id', ids).eq('user_id', userId)
      if (error) throw error
      refresh()
      toast.success('Transactions updated successfully')
    } catch (error) {
      console.error('Error updating transactions:', error)
      toast.error('Failed to update transactions')
    }
  }, [userId, refresh])

  return { handleAddSuccess, handleDelete, handleBulkDelete, handleEdit, handleBulkEdit }
}
