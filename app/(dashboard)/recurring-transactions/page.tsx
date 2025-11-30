'use client'

import { useState, useCallback } from 'react'
import { DateRange } from "react-day-picker"
import { RecurringTransaction } from "@/app/types/transaction"

// Hooks
import { useRecurringTransactions } from '@/hooks/use-recurring-transactions'
import { useCache } from '@/context/cache-context'
import { useRecurringActions } from './_hooks'

// Components
import { RecurringTransactionDialog } from '@/components/app/transactions/recurring-dialog'
import { RecurringTransactionsTable, UpcomingTransactionsSection } from './_components'

export default function RecurringTransactionsPage() {
  const {
    recurringTransactions,
    loading,
    refresh,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    bulkDeleteRecurringTransactions,
    bulkUpdateRecurringTransactions
  } = useRecurringTransactions()

  const { state } = useCache()
  
  // Dialog states
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null)

  // Dialog handlers
  const openAddDialog = useCallback(() => setIsAddTransactionOpen(true), [])
  const closeAddDialog = useCallback(() => setIsAddTransactionOpen(false), [])
  const closeEditDialog = useCallback(() => {
    setIsEditDialogOpen(false)
    setEditingTransaction(null)
  }, [])

  // Action handlers
  const {
    handleAddSuccess,
    handleDelete,
    handleBulkDelete,
    handleEdit,
    handleBulkEdit
  } = useRecurringActions({
    refresh,
    deleteRecurringTransaction,
    bulkDeleteRecurringTransactions,
    updateRecurringTransaction,
    bulkUpdateRecurringTransactions,
    onOpenAddDialog: openAddDialog
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
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#635BFF] to-blue-600">
              Recurring Transactions
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your recurring transactions and view upcoming predictions
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 md:space-y-8 w-full">
          {/* Recurring Transactions Table */}
          <section className="w-full">
            <RecurringTransactionsTable
              recurringTransactions={recurringTransactions}
              loading={loading}
              dateRange={state.dateRange as DateRange | undefined}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              onEdit={handleEdit}
              onBulkEdit={handleBulkEdit}
              onAddRecurring={openAddDialog}
            />
          </section>

          {/* Upcoming Transactions */}
          <section className="w-full pb-6">
            <UpcomingTransactionsSection limit={10} />
          </section>
        </div>
      </div>

      {/* Add Dialog */}
      <RecurringTransactionDialog
        isOpen={isAddTransactionOpen}
        onClose={closeAddDialog}
        onSubmit={onAddSuccess}
        onRefresh={refresh}
        mode="create"
      />

      {/* Edit Dialog */}
      <RecurringTransactionDialog
        isOpen={isEditDialogOpen}
        onClose={closeEditDialog}
        onRefresh={refresh}
        initialData={editingTransaction as any}
        mode="edit"
      />
    </div>
  )
}