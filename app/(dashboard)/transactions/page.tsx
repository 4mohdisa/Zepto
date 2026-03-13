'use client'

import { useTransactions } from '@/hooks/use-transactions'
import { TransactionFilters } from './_components/transaction-filters'
import { BulkActionsBar } from './_components/bulk-actions-bar'
import { TransactionsTable } from './_components/transactions-table'
import { Button } from '@/components/ui/button'
import { UploadIcon } from 'lucide-react'
import { useState, useCallback } from 'react'
import { TransactionDialog } from '@/features/transactions/components/transaction-dialog'
import { UploadDialog } from '@/components/dialogs/upload-dialog'
import { ConfirmationDialog } from '@/components/dialogs/confirmation-dialog'
import { toast } from 'sonner'
import { invalidateCache } from '@/hooks/use-data-cache'
import { usePageView } from '@/hooks/use-page-view'
import { trackEvent, EVENT_TRANSACTION_DELETED } from '@/lib/analytics'
import { 
  pageContainer, 
  pageContent, 
  flexBetween, 
  primaryButton,
  primaryButtonIcon,
  secondaryButton 
} from '@/lib/styles'

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
  merchant_id: string | null
  merchants: { id: string; merchant_name: string } | null
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

  // Track page view
  usePageView('transactions')

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
      
      // Track transaction deleted
      trackEvent(EVENT_TRANSACTION_DELETED, {
        transaction_id: deletingTransaction.id,
      })
      
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
    merchant_id: editingTransaction.merchant_id || '',
    date: editingTransaction.date, // Keep as string, dialog will handle it
    description: editingTransaction.description || '',
    account_type: editingTransaction.account_type,
  } : undefined

  return (
    <div className={pageContainer}>
      <div className={pageContent}>
        {/* Header */}
        <div className={`${flexBetween} mb-4 sm:mb-6`}>
          <h1 className="text-xl sm:text-2xl font-bold">Transactions</h1>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsUploadOpen(true)}
              className={secondaryButton}
            >
              <span className="hidden sm:inline">Import</span>
              <span className="sm:hidden">Import</span>
            </Button>
            
            <Button 
              onClick={() => setIsAddTransactionOpen(true)}
              className={primaryButton}
            >
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
