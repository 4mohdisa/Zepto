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
      <div className="container mx-auto px-4 py-8 space-y-8">
        <RecurringTransactionsTable
          recurringTransactions={recurringTransactions}
          loading={loading}
          dateRange={state.dateRange as DateRange | undefined}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onEdit={handleEdit}
          onBulkEdit={handleBulkEdit}
        />

        <UpcomingTransactionsSection limit={10} />
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