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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10 max-w-[1600px]">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#635BFF] to-blue-600">
                All Transactions
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                View and manage all your financial transactions
              </p>
            </div>
          </div>
        </div>
        
        {/* Transactions Content */}
        <div className="w-full">
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
            onDateRangeChange={setDateRange}
            onAddTransaction={openAddDialog}
          />
        </div>
      </div>

      {/* Transaction Dialog */}
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
