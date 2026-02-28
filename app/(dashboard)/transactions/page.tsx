'use client'

import { useTransactions } from '@/hooks/use-transactions'
import { TransactionFilters } from './_components/transaction-filters'
import { BulkActionsBar } from './_components/bulk-actions-bar'
import { TransactionsTable } from './_components/transactions-table'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from 'lucide-react'
import { useState, useCallback } from 'react'
import { TransactionDialog } from '@/components/app/transactions/transaction-dialog'
import { UploadDialog } from '@/components/app/dialogs/upload-dialog'
import { ConfirmationDialog } from '@/components/app/dialogs/confirmation-dialog'
import { toast } from 'sonner'
import { invalidateCache } from '@/hooks/use-data-cache'

// Transaction type matching the one from use-transactions hook
type Transaction = {
  id: number
  date: string
  name: string
  description: string | null
  amount: number
  type: 'Income' | 'Expense'
  account_type: string
  categories: { id: number; name: string } | null
  category_id: number | null
}

export default function TransactionsPage() {
  const {
    transactions,
    loading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    state,
    setDateFrom,
    setDateTo,
    setSearch,
    setCategoryId,
    setTypeOrder,
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    bulkDelete,
    bulkUpdateCategory,
    updateTransaction,
    deleteTransaction,
  } = useTransactions()

  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  
  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null)

  const handleBulkDelete = async () => {
    try {
      await bulkDelete(Array.from(selectedIds))
      toast.success(`Deleted ${selectedIds.size} transactions`)
    } catch (err) {
      toast.error('Failed to delete transactions')
    }
  }

  const handleBulkChangeCategory = async (categoryId: string) => {
    try {
      await bulkUpdateCategory(Array.from(selectedIds), categoryId)
      toast.success(`Updated category for ${selectedIds.size} transactions`)
    } catch (err) {
      toast.error('Failed to update transactions')
    }
  }

  const allSelected = selectedIds.size > 0 && selectedIds.size === transactions.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < transactions.length

  // Handle edit action
  const handleEdit = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsEditDialogOpen(true)
  }, [])

  // Handle delete action
  const handleDelete = useCallback((transaction: Transaction) => {
    setDeletingTransaction(transaction)
    setIsDeleteDialogOpen(true)
  }, [])

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingTransaction) return
    
    try {
      await deleteTransaction(deletingTransaction.id)
      invalidateCache('transactions')
      invalidateCache('dashboard')
      toast.success('Transaction deleted successfully')
      setIsDeleteDialogOpen(false)
      setDeletingTransaction(null)
    } catch (err) {
      toast.error('Failed to delete transaction')
    }
  }, [deletingTransaction, deleteTransaction])

  // Prepare initial data for edit dialog
  const editDialogInitialData = editingTransaction ? {
    id: editingTransaction.id,
    name: editingTransaction.name,
    amount: editingTransaction.amount,
    type: editingTransaction.type,
    category_id: editingTransaction.category_id?.toString() || '',
    date: editingTransaction.date, // Keep as string, dialog will handle it
    description: editingTransaction.description || '',
    account_type: editingTransaction.account_type,
  } : undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Transactions</h1>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsUploadOpen(true)}
              size="sm"
              className="text-xs sm:text-sm"
            >
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Import</span>
              <span className="sm:hidden">Import</span>
            </Button>
            
            <Button 
              onClick={() => setIsAddTransactionOpen(true)}
              size="sm"
              className="text-xs sm:text-sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-red-600 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
              Retry
            </Button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4">
          <TransactionFilters
            dateFrom={state.dateFrom}
            dateTo={state.dateTo}
            search={state.search}
            categoryId={state.categoryId}
            typeOrder={state.typeOrder}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onSearchChange={setSearch}
            onCategoryIdChange={setCategoryId}
            onTypeOrderChange={setTypeOrder}
          />
        </div>

        {/* Bulk Actions */}
        <div className="mb-4">
          <BulkActionsBar
            selectedCount={selectedIds.size}
            onClearSelection={clearSelection}
            onDelete={handleBulkDelete}
            onChangeCategory={handleBulkChangeCategory}
          />
        </div>

        {/* Table - handles its own loading skeleton */}
        <TransactionsTable
          transactions={transactions}
          loading={loading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onSelectAll={selectAll}
          allSelected={allSelected}
          someSelected={someSelected}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Dialogs */}
      <TransactionDialog
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        mode="create"
        onSuccess={() => {
          invalidateCache('transactions')
          invalidateCache('dashboard')
          refetch()
        }}
      />

      <TransactionDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setEditingTransaction(null)
        }}
        mode="edit"
        initialData={editDialogInitialData}
        onSuccess={() => {
          invalidateCache('transactions')
          invalidateCache('dashboard')
          refetch()
          toast.success('Transaction updated')
        }}
      />

      <UploadDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onSuccess={() => {
          invalidateCache('transactions')
          invalidateCache('dashboard')
          refetch()
        }}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setDeletingTransaction(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        description={deletingTransaction 
          ? `Are you sure you want to delete "${deletingTransaction.name}"? This action cannot be undone.`
          : 'Are you sure you want to delete this transaction?'
        }
      />
    </div>
  )
}
