'use client'

import { useState, useCallback } from 'react'
import { RecurringTransaction } from '@/types/transaction'

// Hooks
import { useRecurringTransactions } from '@/hooks/use-recurring-transactions'
import { invalidateCache } from '@/hooks/use-data-cache'

// Components
import { RecurringTransactionDialog } from '@/features/transactions/components/recurring-dialog'
import { RecurringTable } from './_components/recurring-table'
import { UpcomingTransactionsSection } from './_components/upcoming-transactions-section'
import { ConfirmationDialog } from '@/components/dialogs/confirmation-dialog'
import { toast } from 'sonner'

export default function RecurringTransactionsPage() {
  const {
    recurringTransactions,
    upcomingTransactions,
    loading,
    refresh,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction
  } = useRecurringTransactions()

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null)
  
  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | string | null>(null)

  // Dialog handlers
  const openAddDialog = useCallback(() => setIsAddDialogOpen(true), [])
  const closeAddDialog = useCallback(() => setIsAddDialogOpen(false), [])
  const closeEditDialog = useCallback(() => {
    setIsEditDialogOpen(false)
    setEditingTransaction(null)
  }, [])

  // Handle add success
  const handleAddSuccess = useCallback(async () => {
    invalidateCache('recurring')
    invalidateCache('dashboard')
    closeAddDialog()
    await refresh()
  }, [closeAddDialog, refresh])

  // Handle delete
  const handleDelete = useCallback((id: number | string) => {
    setDeletingId(id)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingId) return
    try {
      await deleteRecurringTransaction(deletingId)
      invalidateCache('recurring')
      invalidateCache('dashboard')
      toast.success('Recurring transaction deleted')
      setIsDeleteDialogOpen(false)
      setDeletingId(null)
    } catch (error) {
      toast.error('Failed to delete recurring transaction')
    }
  }, [deletingId, deleteRecurringTransaction])

  // Handle edit
  const handleEdit = useCallback((transaction: RecurringTransaction) => {
    setEditingTransaction(transaction)
    setIsEditDialogOpen(true)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-[1400px]">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Recurring Transactions</h1>
          <p className="text-sm text-gray-600 mt-1">Manage automated payments and subscriptions</p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 sm:space-y-8 w-full">
          {/* Recurring Transactions Table */}
          <section className="w-full">
            <RecurringTable
              data={recurringTransactions}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={openAddDialog}
            />
          </section>

          {/* Upcoming Transactions */}
          <section className="w-full">
            <UpcomingTransactionsSection 
              transactions={upcomingTransactions}
              loading={loading}
              hasActiveRecurring={recurringTransactions.length > 0}
            />
          </section>
        </div>
      </div>

      {/* Add Dialog */}
      <RecurringTransactionDialog
        isOpen={isAddDialogOpen}
        onClose={closeAddDialog}
        onSubmit={handleAddSuccess}
        mode="create"
        createRecurringTransaction={createRecurringTransaction}
        updateRecurringTransaction={updateRecurringTransaction}
      />

      {/* Edit Dialog */}
      <RecurringTransactionDialog
        isOpen={isEditDialogOpen}
        onClose={closeEditDialog}
        onSubmit={refresh}
        initialData={editingTransaction as any}
        mode="edit"
        createRecurringTransaction={createRecurringTransaction}
        updateRecurringTransaction={updateRecurringTransaction}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setDeletingId(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Recurring Transaction"
        description="Are you sure you want to delete this recurring transaction? This action cannot be undone."
      />
    </div>
  )
}
