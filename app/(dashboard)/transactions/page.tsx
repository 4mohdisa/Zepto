'use client'

import { useState, useCallback } from 'react'
import { DateRange } from "react-day-picker"
import { startOfMonth, endOfMonth } from "date-fns"

// Hooks
import { useTransactions } from '@/hooks/use-transactions'
import { useAuth } from '@/context/auth-context'
import { useTransactionsActions } from './_hooks'

// Components
import { TransactionDialog } from '@/components/app/transactions/transaction-dialog'
import { TransactionsContent } from './_components'

const DEFAULT_DATE_RANGE = {
  from: startOfMonth(new Date()),
  to: endOfMonth(new Date())
}

export default function TransactionsPage() {
  const { user } = useAuth()
  
  // Dialog state
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(DEFAULT_DATE_RANGE)
  
  // Fetch transactions
  const { transactions: transactionsList, loading, error, refresh } = useTransactions(dateRange)

  // Dialog handlers
  const openAddDialog = useCallback(() => setIsAddTransactionOpen(true), [])
  const closeAddDialog = useCallback(() => setIsAddTransactionOpen(false), [])

  // Action handlers
  const { handleAddSuccess, handleDelete, handleBulkDelete, handleEdit, handleBulkEdit } = useTransactionsActions({
    userId: user?.id,
    refresh,
    onOpenAddDialog: openAddDialog,
    setDateRange
  })

  // Wrap add success to also close dialog
  const onAddSuccess = useCallback(async () => {
    closeAddDialog()
    await handleAddSuccess()
  }, [closeAddDialog, handleAddSuccess])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              All Transactions
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              View and manage all your financial transactions
            </p>
          </div>
        </div>
        
        <TransactionsContent
          transactions={transactionsList}
          loading={loading}
          error={error}
          dateRange={dateRange}
          onRefresh={refresh}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onEdit={handleEdit}
          onBulkEdit={handleBulkEdit}
        />
      </div>

      {isAddTransactionOpen && (
        <TransactionDialog
          isOpen={isAddTransactionOpen}
          onClose={closeAddDialog}
          onSubmit={onAddSuccess}
          mode="create"
        />
      )}
    </div>
  )
}
