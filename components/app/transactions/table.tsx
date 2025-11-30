'use client'

import { useMemo, useCallback } from 'react'
import { flexRender } from "@tanstack/react-table"
import { ChevronDown, CreditCard, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ConfirmationDialog } from "../dialogs/confirmation-dialog"
import { TransactionDialog } from "./transaction-dialog"
import { RecurringTransactionDialog } from "./recurring-dialog"
import { BulkCategoryChangeDialog } from "./bulk-category-change"
import { Transaction } from "@/app/types/transaction"
import { useTransactionsTable } from "./hooks/use-transactions-table"
import { createTransactionColumns } from "./_columns/transaction-columns"

type TransactionType = 'upcoming' | 'recurring' | 'regular'

interface TransactionsTableProps {
  loading?: boolean
  data?: Transaction[]
  showFilters?: boolean
  showPagination?: boolean
  showRowsCount?: boolean
  itemsPerPage?: number
  sortBy?: { field: string; order: string }
  className?: string
  dateRange?: { from?: Date; to?: Date }
  type?: TransactionType
  onDelete?: (id: number) => Promise<void>
  onEdit?: (id: number, data: Partial<Transaction>) => void
  onBulkDelete?: (ids: number[]) => Promise<void>
  onBulkEdit?: (ids: number[], changes: Partial<Transaction>) => Promise<void>
  customEmptyState?: React.ReactNode
}

export function TransactionsTable({
  showFilters = true,
  showPagination = true,
  showRowsCount = true,
  itemsPerPage = 10,
  className,
  data = [],
  loading = false,
  onDelete,
  onBulkDelete,
  onEdit,
  onBulkEdit,
  type = 'upcoming',
  customEmptyState
}: TransactionsTableProps) {
  // Use custom hook for table state management
  const {
    table,
    globalFilter,
    setGlobalFilter,
    rowSelection,
    setRowSelection,
    isTransactionDialogOpen,
    isRecurringTransactionDialogOpen,
    isConfirmDialogOpen,
    isBulkDeleteDialogOpen,
    isBulkCategoryDialogOpen,
    transactionDialogData,
    transactionToDelete,
    transactionsToDelete,
    handleDeleteTransaction,
    getSelectedTransactionIds,
    openBulkDeleteDialog,
    closeTransactionDialog,
    closeRecurringDialog,
    closeConfirmDialog,
    closeBulkDeleteDialog,
    closeBulkCategoryDialog,
    openBulkCategoryDialog,
    handleTransactionSubmit,
    handleRecurringSubmit,
  } = useTransactionsTable({
    data,
    type,
    itemsPerPage,
    onDelete,
    onEdit,
  })

  // Memoized columns for column visibility dropdown
  const columns = useMemo(() => createTransactionColumns({
    type,
    onEdit: () => {},
    onDelete: () => {},
  }), [type])

  // Handle bulk category change
  const handleBulkCategoryChange = useCallback((categoryId: number) => {
    const selectedIds = getSelectedTransactionIds()
    if (selectedIds.length > 0) {
      onBulkEdit?.(selectedIds, { category_id: categoryId })
      setRowSelection({})
      closeBulkCategoryDialog()
    }
  }, [getSelectedTransactionIds, onBulkEdit, setRowSelection, closeBulkCategoryDialog])

  // Handle bulk delete confirm
  const handleBulkDeleteConfirm = useCallback(() => {
    if (transactionsToDelete.length > 0) {
      onBulkDelete?.(transactionsToDelete)
      setRowSelection({})
      closeBulkDeleteDialog()
    }
  }, [transactionsToDelete, onBulkDelete, setRowSelection, closeBulkDeleteDialog])

  // Handle single delete confirm
  const handleDeleteConfirm = useCallback(() => {
    if (typeof transactionToDelete === 'number') {
      handleDeleteTransaction()
    }
  }, [transactionToDelete, handleDeleteTransaction])

  return (
    <div className={cn("w-full space-y-4", className)}>

      {showFilters && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <Input
            placeholder="Filter transactions..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="w-full sm:max-w-sm"
          />
          <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full xs:w-auto border-gray-200 hover:bg-gray-50">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-gray-200 shadow-xl">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize hover:bg-gray-50 focus:bg-gray-50"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Only show bulk actions for regular transactions, not for upcoming transactions */}
            {type !== 'upcoming' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full xs:w-auto border-gray-200 hover:bg-gray-50">
                    Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border-gray-200 shadow-xl">
                  <DropdownMenuItem 
                    onClick={openBulkDeleteDialog}
                    className="hover:bg-gray-50 focus:bg-gray-50 text-red-600"
                  >
                    Delete Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem 
                    onClick={openBulkCategoryDialog}
                    className="hover:bg-gray-50 focus:bg-gray-50"
                  >
                    Change Category
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}
      
      {/* Table container with horizontal scroll on mobile */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-gray-200 bg-gray-50">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-xs font-semibold text-gray-600 py-3 px-4 whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-[400px]">
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 text-[#635BFF] animate-spin mb-4" />
                    <p className="text-gray-600">Loading transactions...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4 px-4 text-sm text-gray-900">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-[400px]">
                  {customEmptyState ? (
                    customEmptyState
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full px-4">
                      <div className="rounded-full w-16 h-16 mb-4 flex items-center justify-center bg-gradient-to-br from-[#635BFF]/10 to-blue-500/10">
                        <CreditCard className="h-8 w-8 text-[#635BFF]" />
                      </div>
                      <p className="text-gray-600 font-medium">No transactions yet</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {(showPagination || showRowsCount) && table.getFilteredRowModel().rows.length >= 11 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4 px-2">
          {showRowsCount && (
            <div className="text-sm text-gray-600 order-2 sm:order-1">
              <span className="font-medium">{table.getFilteredSelectedRowModel().rows.length}</span> of{" "}
              <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> row(s) selected.
            </div>
          )}
          {showPagination && (
            <div className="flex gap-2 order-1 sm:order-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="flex-1 sm:flex-none border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="flex-1 sm:flex-none border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      <TransactionDialog
        isOpen={isTransactionDialogOpen}
        onClose={closeTransactionDialog}
        onSubmit={handleTransactionSubmit}
        initialData={transactionDialogData}
        mode="edit"
      />
      
      <RecurringTransactionDialog
        isOpen={isRecurringTransactionDialogOpen}
        onClose={closeRecurringDialog}
        onSubmit={handleRecurringSubmit}
        initialData={transactionDialogData}
        mode="edit"
      />

      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={closeConfirmDialog}
        onConfirm={handleDeleteConfirm}
        title={type === 'upcoming' ? "Delete Recurring Transaction" : "Delete Transaction"}
        description={type === 'upcoming' 
          ? "Are you sure you want to delete this recurring transaction? This will remove all future occurrences. This action cannot be undone."
          : "Are you sure you want to delete this transaction? This action cannot be undone."}
      />

      <ConfirmationDialog
        isOpen={isBulkDeleteDialogOpen}
        onClose={closeBulkDeleteDialog}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Selected Transactions"
        description={`Are you sure you want to delete ${transactionsToDelete.length} selected transaction(s)? This action cannot be undone.`}
      />

      <BulkCategoryChangeDialog
        isOpen={isBulkCategoryDialogOpen}
        onClose={closeBulkCategoryDialog}
        onSave={handleBulkCategoryChange}
        selectedCount={Object.keys(rowSelection).length}
      />

    </div>
  )
}