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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Input
            placeholder="Filter transactions..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <div className="flex flex-col md:flex-row gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border shadow-xl">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize hover:bg-hover-surface focus:bg-hover-surface"
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
                  <Button variant="outline">
                    Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border shadow-xl">
                  <DropdownMenuItem 
                    onClick={openBulkDeleteDialog}
                    className="hover:bg-hover-surface focus:bg-hover-surface text-destructive"
                  >
                    Delete Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem 
                    onClick={openBulkCategoryDialog}
                    className="hover:bg-hover-surface focus:bg-hover-surface"
                  >
                    Change Category
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}
      
      <div className="rounded-lg border border-border overflow-hidden bg-card shadow-lg hover:shadow-xl transition-all duration-300">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border bg-surface">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-xs font-semibold text-muted-foreground py-3">
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
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                    <p className="text-muted-foreground">Loading transactions...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-border/50 hover:bg-hover-surface transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4 text-sm text-foreground">
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
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="rounded-full w-16 h-16 mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(76, 126, 243, 0.1) 0%, rgba(109, 76, 255, 0.1) 100%)' }}>
                        <CreditCard className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-muted-foreground font-medium">No transactions yet</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {(showPagination || showRowsCount) && table.getFilteredRowModel().rows.length >= 11 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          {showRowsCount && (
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
          )}
          {showPagination && (
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
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