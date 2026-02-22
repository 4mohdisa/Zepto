'use client'

import { useTransactions } from '@/hooks/use-transactions'
import { TransactionFilters } from './_components/transaction-filters'
import { BulkActionsBar } from './_components/bulk-actions-bar'
import { TransactionsTable } from './_components/transactions-table'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from 'lucide-react'
import { useState } from 'react'
import { TransactionDialog } from '@/components/app/transactions/transaction-dialog'
import { UploadDialog } from '@/components/app/dialogs/upload-dialog'
import { toast } from 'sonner'

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
  } = useTransactions()

  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Transactions</h1>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsUploadOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            
            <Button onClick={() => setIsAddTransactionOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
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

        {/* Loading state for initial load */}
        {loading && transactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading transactions...</p>
          </div>
        )}

        {/* Table */}
        {!loading && (
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
          />
        )}
      </div>

      {/* Dialogs */}
      <TransactionDialog
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        mode="create"
      />

      <UploadDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onSuccess={refetch}
      />
    </div>
  )
}
