'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Table,
} from "@tanstack/react-table"
import { Transaction } from "@/app/types/transaction"
import { TransactionFormValues, RecurringTransactionFormValues } from "../../shared/transaction-schema"
import { FrequencyType } from "@/data/frequencies"
import { createTransactionColumns } from "../_columns/transaction-columns"

type TransactionType = 'upcoming' | 'recurring' | 'regular'

interface UseTransactionsTableProps {
  data: Transaction[]
  type: TransactionType
  itemsPerPage: number
  onDelete?: (id: number | string) => Promise<void>
  onEdit?: (id: number | string, data: Partial<Transaction>) => void
}

interface UseTransactionsTableReturn {
  table: Table<Transaction>
  globalFilter: string
  setGlobalFilter: (value: string) => void
  rowSelection: Record<string, boolean>
  setRowSelection: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  isTransactionDialogOpen: boolean
  isRecurringTransactionDialogOpen: boolean
  isConfirmDialogOpen: boolean
  isBulkDeleteDialogOpen: boolean
  isBulkCategoryDialogOpen: boolean
  transactionDialogData: Partial<TransactionFormValues>
  transactionToDelete: number | string | null
  transactionsToDelete: (number | string)[]
  handleDeleteTransaction: () => void
  getSelectedTransactionIds: () => number[]
  openBulkDeleteDialog: () => void
  closeTransactionDialog: () => void
  closeRecurringDialog: () => void
  closeConfirmDialog: () => void
  closeBulkDeleteDialog: () => void
  closeBulkCategoryDialog: () => void
  openBulkCategoryDialog: () => void
  handleTransactionSubmit: (formData: TransactionFormValues) => void
  handleRecurringSubmit: (formData: RecurringTransactionFormValues) => void
}

export function useTransactionsTable({
  data,
  type,
  itemsPerPage,
  onDelete,
  onEdit,
}: UseTransactionsTableProps): UseTransactionsTableReturn {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [globalFilter, setGlobalFilter] = useState("")

  // Dialog state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [transactionDialogData, setTransactionDialogData] = useState<Partial<TransactionFormValues>>({})
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<number | string | null>(null)
  const [isBulkCategoryDialogOpen, setIsBulkCategoryDialogOpen] = useState(false)
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  const [isRecurringTransactionDialogOpen, setIsRecurringTransactionDialogOpen] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [transactionsToDelete, setTransactionsToDelete] = useState<number[]>([])

  // Handle edit transaction
  const handleEditTransaction = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction)
    
    if (type === 'recurring') {
      const recurringFormData = {
        name: transaction.name,
        amount: transaction.amount,
        type: transaction.type as TransactionFormValues['type'],
        account_type: transaction.account_type as TransactionFormValues['account_type'],
        category_id: transaction.category_id ? String(transaction.category_id) : '',
        description: transaction.description || '',
        start_date: transaction.start_date 
          ? (transaction.start_date instanceof Date ? transaction.start_date : new Date(transaction.start_date as string))
          : new Date(),
        end_date: transaction.end_date 
          ? (transaction.end_date instanceof Date ? transaction.end_date : new Date(transaction.end_date as string))
          : undefined,
        frequency: (transaction.recurring_frequency as FrequencyType) || 'Monthly',
      }
      setTransactionDialogData(recurringFormData)
      setIsRecurringTransactionDialogOpen(true)
    } else {
      const formData: Partial<TransactionFormValues> = {
        name: transaction.name,
        amount: transaction.amount,
        date: new Date(transaction.date), // transaction.date is always a string from DB
        type: transaction.type as TransactionFormValues['type'],
        account_type: transaction.account_type as TransactionFormValues['account_type'],
        category_id: transaction.category_id ? String(transaction.category_id) : '',
        description: transaction.description || '',
        recurring_frequency: (transaction.recurring_frequency as TransactionFormValues['recurring_frequency']) || 'Never',
      }
      setTransactionDialogData(formData)
      setIsTransactionDialogOpen(true)
    }
  }, [type])

  // Handle delete transaction
  const handleDeleteTransaction = useCallback(() => {
    if (transactionToDelete !== null) {
      onDelete?.(transactionToDelete)
      setIsConfirmDialogOpen(false)
      setTransactionToDelete(null)
    }
  }, [transactionToDelete, onDelete])

  // Dialog controls
  const openDeleteDialog = useCallback((id: number | string) => {
    setTransactionToDelete(id)
    setIsConfirmDialogOpen(true)
  }, [])

  const closeTransactionDialog = useCallback(() => {
    setIsTransactionDialogOpen(false)
    setEditingTransaction(null)
    setTransactionDialogData({})
  }, [])

  const closeRecurringDialog = useCallback(() => {
    setIsRecurringTransactionDialogOpen(false)
    setEditingTransaction(null)
    setTransactionDialogData({})
  }, [])

  const closeConfirmDialog = useCallback(() => {
    setIsConfirmDialogOpen(false)
    setTransactionToDelete(null)
  }, [])

  const closeBulkDeleteDialog = useCallback(() => {
    setIsBulkDeleteDialogOpen(false)
    setTransactionsToDelete([])
  }, [])

  const closeBulkCategoryDialog = useCallback(() => {
    setIsBulkCategoryDialogOpen(false)
  }, [])

  const openBulkCategoryDialog = useCallback(() => {
    setIsBulkCategoryDialogOpen(true)
  }, [])

  // Handle transaction submit
  const handleTransactionSubmit = useCallback((formData: TransactionFormValues) => {
    if (editingTransaction?.id !== undefined) {
      const transactionData: Partial<Transaction> = {
        ...formData,
        date: formData.date instanceof Date ? formData.date.toISOString() : formData.date,
        category_id: formData.category_id ? Number(formData.category_id) : undefined
      }
      onEdit?.(editingTransaction.id, transactionData)
      closeTransactionDialog()
    }
  }, [editingTransaction, onEdit, closeTransactionDialog])

  // Handle recurring submit
  const handleRecurringSubmit = useCallback((formData: RecurringTransactionFormValues) => {
    if (editingTransaction?.id !== undefined) {
      const transactionData: Partial<Transaction> = {
        ...formData,
        start_date: formData.start_date instanceof Date ? formData.start_date.toISOString() : formData.start_date,
        end_date: formData.end_date instanceof Date ? formData.end_date.toISOString() : formData.end_date,
        recurring_frequency: formData.frequency,
        category_id: formData.category_id ? Number(formData.category_id) : undefined
      }
      onEdit?.(editingTransaction.id, transactionData)
      closeRecurringDialog()
    }
  }, [editingTransaction, onEdit, closeRecurringDialog])

  // Memoized columns
  const columns = useMemo(() => createTransactionColumns({
    type,
    onEdit: handleEditTransaction,
    onDelete: openDeleteDialog,
  }), [type, handleEditTransaction, openDeleteDialog])

  // Table instance
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row, _id, filterValue) => {
      const safeValue = (value: unknown) => 
        typeof value === 'number' ? value.toString() : (value as string ?? '')
      return ['name', 'amount', 'description'].some(key => 
        safeValue(row.getValue(key))
          .toLowerCase()
          .includes((filterValue as string).toLowerCase())
      )
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: { pageSize: itemsPerPage },
    },
  })

  // Get selected transaction IDs - defined after table is created
  const getSelectedTransactionIds = useCallback((): number[] => {
    const selectedRowIndices = Object.keys(rowSelection)
    if (selectedRowIndices.length === 0) return []
    
    return selectedRowIndices
      .map(index => {
        const row = table.getRowModel().rows[Number(index)]
        return row?.original?.id
      })
      .filter((id): id is number => id !== undefined)
  }, [rowSelection, table])

  // Open bulk delete dialog
  const openBulkDeleteDialog = useCallback(() => {
    const selectedIds = getSelectedTransactionIds()
    if (selectedIds.length > 0) {
      setTransactionsToDelete(selectedIds)
      setIsBulkDeleteDialogOpen(true)
    }
  }, [getSelectedTransactionIds])

  return {
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
  }
}
