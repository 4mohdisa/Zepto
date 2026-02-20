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

// Show last 8 months to include populated historical data
const DEFAULT_DATE_RANGE = {
  from: new Date(2025, 6, 1), // July 2025
  to: endOfMonth(new Date())   // Current month end
}

export default function TransactionsPage() {
  const { user } = useAuth()
  
  // Dialog state
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(DEFAULT_DATE_RANGE)
  
  // Fetch transactions
  const {
    transactions: transactionsList,
    loading,
    error,
    refresh,
    createTransaction,
    updateTransaction
  } = useTransactions(dateRange)

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
      <div className="container mx-auto px-6 py-8 max-w-[1400px]">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-600 mt-1">View and manage all your transactions</p>
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
          createTransaction={createTransaction}
          updateTransaction={updateTransaction}
        />
      )}
    </div>
  )
}
