"use client"

import React, { useState, useCallback, useEffect, Suspense } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, Menu } from 'lucide-react'
import { TransactionsTable } from "@/components/app/tables/transactions-table"
import { DateRangePickerWithRange } from '@/components/app/date-range-picker'
import { Skeleton } from "@/components/ui/skeleton"
import { DateRange } from "react-day-picker"
import { startOfMonth, endOfMonth } from "date-fns"
// Import the TransactionDialog directly since dynamic import is causing type issues
import { TransactionDialog } from '@/components/app/transaction-dialogs/transactions/transaction-dialog'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { ErrorDisplay } from '@/components/ui/error-display'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTransactions } from '@/hooks/use-transactions'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { UpdateTransaction } from '@/app/types/transaction'

export default function TransactionsPage() {
  const { user } = useAuth()
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const { transactions: transactionsList, loading, error, refresh } = useTransactions(dateRange)

  // Remove this useEffect as it causes infinite loops
  // The useTransactions hook already handles fetching when dateRange changes

  // Listen for header events
  // Create stable event handler references with useCallback
  const handleHeaderDateRangeChange = useCallback((event: CustomEvent) => {
    const { dateRange: newRange } = event.detail;
    // Prevent unnecessary re-renders by checking if the range actually changed
    setDateRange(prevRange => {
      // Only update if actually different to prevent infinite loops
      if (!prevRange && !newRange) return prevRange;
      if (!prevRange || !newRange) return newRange;
      if (prevRange.from?.getTime() !== newRange.from?.getTime() || 
          prevRange.to?.getTime() !== newRange.to?.getTime()) {
        return newRange;
      }
      return prevRange;
    });
  }, []);

  const handleHeaderAddTransaction = useCallback(() => {
    setIsAddTransactionOpen(true);
  }, []);

  useEffect(() => {
    // Add event listeners
    window.addEventListener('header:daterangechange', handleHeaderDateRangeChange as EventListener);
    window.addEventListener('header:addtransaction', handleHeaderAddTransaction);

    // Clean up event listeners
    return () => {
      window.removeEventListener('header:daterangechange', handleHeaderDateRangeChange as EventListener);
      window.removeEventListener('header:addtransaction', handleHeaderAddTransaction);
    };
    // Include stable function references in deps array
  }, [handleHeaderDateRangeChange, handleHeaderAddTransaction]);

  const handleAddTransaction = useCallback(() => {
    setIsAddTransactionOpen(true)
  }, [])

  // Add safe update pattern to prevent infinite loops
  const handleDateRangeChange = useCallback((newDateRange: DateRange | undefined) => {
    if (!newDateRange) return;
    
    setDateRange(prevRange => {
      // Only update if actually different to prevent loops
      if (!prevRange) return newDateRange;
      
      if (prevRange.from?.getTime() !== newDateRange.from?.getTime() || 
          prevRange.to?.getTime() !== newDateRange.to?.getTime()) {
        return {
          from: newDateRange.from,
          to: newDateRange.to || newDateRange.from
        };
      }
      return prevRange;
    });
  }, [])

  const handleAddSuccess = useCallback(async () => {
    // Transaction is created through the dialog and will be fetched automatically
    setIsAddTransactionOpen(false)
    // Refresh the transactions list after adding a new transaction
    refresh()
    toast.success('Transaction added successfully')
  }, [refresh])

  const handleDeleteTransaction = useCallback(async (id: number) => {
    if (!user?.id) {
      toast.error('Authentication required')
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      
      // Refresh the transactions list after deletion
      refresh()
      toast.success('Transaction deleted successfully')
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Failed to delete transaction')
    }
  }, [user, refresh])

  const handleBulkDelete = useCallback(async (ids: number[]) => {
    if (!user?.id) {
      toast.error('Authentication required')
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id)

      if (error) throw error
      
      // Refresh the transactions list after bulk deletion
      refresh()
      toast.success('Transactions deleted successfully')
    } catch (error) {
      console.error('Error deleting transactions:', error)
      toast.error('Failed to delete transactions')
    }
  }, [user, refresh])

  const handleEditTransaction = useCallback(async (id: number, formData: Partial<UpdateTransaction>) => {
    if (!user?.id) {
      toast.error('Authentication required')
      return
    }

    try {
      const supabaseData: Record<string, any> = {}
      
      // Process all fields in the form data
      Object.keys(formData).forEach(key => {
        if (key === 'date') {
          if (formData.date) {
            // Convert Date objects to ISO string format for Supabase
            supabaseData.date = formData.date instanceof Date 
              ? formData.date.toISOString() 
              : formData.date
          }
        } else {
          // Copy all other fields as-is
          supabaseData[key] = formData[key as keyof typeof formData]
        }
      })

      const supabase = createClient()
      const { error } = await supabase
        .from('transactions')
        .update(supabaseData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      
      // Refresh transactions list after successful update
      refresh()
      toast.success('Transaction updated successfully')
    } catch (error) {
      console.error('Error updating transaction:', error)
      toast.error('Failed to update transaction')
    }
  }, [user, refresh])

  const handleBulkEdit = useCallback(async (ids: number[], changes: Partial<UpdateTransaction>) => {
    if (!user?.id) {
      toast.error('Authentication required')
      return
    }

    try {
      const supabaseData: Record<string, any> = {}
      
      Object.keys(changes).forEach(key => {
        if (key === 'date') {
          if (changes.date) {
            supabaseData.date = changes.date instanceof Date 
              ? changes.date.toISOString() 
              : changes.date
          }
        } else {
          supabaseData[key] = changes[key as keyof typeof changes]
        }
      })

      const supabase = createClient()
      const { error } = await supabase
        .from('transactions')
        .update(supabaseData)
        .in('id', ids)
        .eq('user_id', user.id)

      if (error) throw error
      
      // Refresh the transactions list after bulk edit
      refresh()
      toast.success('Transactions updated successfully')
    } catch (error) {
      console.error('Error updating transactions:', error)
      toast.error('Failed to update transactions')
    }
  }, [user, refresh])

  return (
    <div className="h-full flex flex-col">
      <div className="container h-full flex flex-col mx-auto px-4 py-8">
        {error ? (
          <div className="flex-1 flex items-center justify-center">
            <ErrorDisplay 
              title="Failed to load transactions" 
              description="We couldn't load your transactions. Please try refreshing the page." 
              onRefresh={() => refresh()}
              mode="inline"
            />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <TransactionsTable
              showFilters={true}
              showPagination={true}
              showRowsCount={true}
              itemsPerPage={10}
              sortBy={{
                field: "date",
                order: "desc"
              }}
              className="h-full"
              dateRange={dateRange}
              data={transactionsList}
              loading={loading}
              onDelete={handleDeleteTransaction}
              onBulkDelete={handleBulkDelete}
              onEdit={handleEditTransaction}
              onBulkEdit={handleBulkEdit}
            />
          </div>
        )}
      </div>

      {isAddTransactionOpen && (
        <TransactionDialog
          isOpen={isAddTransactionOpen}
          onClose={() => setIsAddTransactionOpen(false)}
          onSubmit={handleAddSuccess}
          mode="create"
        />
      )}
    </div>
  )
}
