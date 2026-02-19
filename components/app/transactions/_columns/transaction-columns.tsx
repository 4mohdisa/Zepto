'use client'

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { categories } from "@/data/categories"
import { Transaction } from "@/app/types/transaction"
import { formatCurrency } from "@/utils/format"

type TransactionType = 'upcoming' | 'recurring' | 'regular'

interface ColumnOptions {
  type: TransactionType
  onEdit: (transaction: Transaction) => void
  onDelete: (id: number | string) => void
}

function getCategoryName(categoryId: number): string {
  return categories.find(cat => cat.id === categoryId)?.name || 'Uncategorized'
}

function formatDate(dateValue: string | Date | null | undefined): string | null {
  if (!dateValue || dateValue === '') return null
  const date = new Date(dateValue as string)
  return format(date, 'MM/dd/yyyy')
}

// Selection column
function createSelectColumn(type: TransactionType): ColumnDef<Transaction> {
  return {
    id: "select",
    header: ({ table }) => (
      type !== 'upcoming' ? (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ) : null
    ),
    cell: ({ row }) => (
      type !== 'upcoming' ? (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ) : null
    ),
    enableSorting: false,
    enableHiding: false,
  }
}

// Name column
const nameColumn: ColumnDef<Transaction> = {
  accessorKey: "name",
  header: ({ column }) => (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      Name
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  ),
  cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
}

// Amount column
const amountColumn: ColumnDef<Transaction> = {
  accessorKey: "amount",
  header: ({ column }) => (
    <div className="text-right">
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Amount
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </div>
  ),
  cell: ({ row }) => {
    const amount = parseFloat(row.getValue("amount"))
    return <div className="text-right font-medium">{formatCurrency(amount)}</div>
  },
}

// Type column
const typeColumn: ColumnDef<Transaction> = {
  accessorKey: "type",
  header: "Type",
  cell: ({ row }) => {
    const transactionType = row.getValue("type") as string
    return (
      <Badge 
        variant="secondary" 
        className={cn(
          "text-xs font-medium rounded-md px-2 py-1",
          transactionType === 'Expense' 
            ? "bg-red-500/10 text-red-400 border-red-500/20" 
            : "bg-green-500/10 text-green-400 border-green-500/20"
        )}
      >
        {transactionType}
      </Badge>
    )
  },
}

// Category column
const categoryColumn: ColumnDef<Transaction> = {
  id: "category",
  accessorKey: "category_name",
  header: "Category",
  cell: ({ row }) => {
    // Use original data to access both category_name and category_id
    const categoryId = row.original.category_id
    const categoryName = row.original.category_name
    
    if (categoryName) {
      return (
        <Badge 
          variant="outline" 
          className="text-xs font-medium rounded-md px-2 py-1 bg-muted/20 text-muted-foreground border-muted"
        >
          {categoryName}
        </Badge>
      )
    }
    
    if (categoryId) {
      return (
        <Badge 
          variant="outline" 
          className="text-xs font-medium rounded-md px-2 py-1 bg-muted/20 text-muted-foreground border-muted"
        >
          {getCategoryName(categoryId)}
        </Badge>
      )
    }
    
    return (
      <Badge 
        variant="outline" 
        className="text-xs font-medium rounded-md px-2 py-1 bg-muted/20 text-muted-foreground border-muted"
      >
        Uncategorized
      </Badge>
    )
  },
}

// Description column
const descriptionColumn: ColumnDef<Transaction> = {
  accessorKey: "description",
  header: "Description",
  cell: ({ row }) => <div>{row.getValue("description")}</div>,
}

// Date column (dynamic based on type)
function createDateColumn(type: TransactionType): ColumnDef<Transaction> {
  const isRecurring = type === 'recurring'
  const accessorKey = isRecurring ? 'start_date' : 'date'
  const headerLabel = isRecurring ? 'Start Date' : 'Date'

  return {
    accessorKey,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {headerLabel}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const dateValue = row.getValue(accessorKey) as string | Date | null
      const formatted = formatDate(dateValue)
      return formatted ? <div>{formatted}</div> : null
    },
  }
}

// End date column (only for recurring)
const endDateColumn: ColumnDef<Transaction> = {
  accessorKey: "end_date",
  header: "End Date",
  cell: ({ row }) => {
    const dateValue = row.getValue("end_date") as string | Date | null
    const formatted = formatDate(dateValue)
    return <div>{formatted || 'No end date'}</div>
  },
}

// Actions column
function createActionsColumn({ type, onEdit, onDelete }: ColumnOptions): ColumnDef<Transaction> {
  return {
    id: "actions",
    cell: ({ row }) => {
      const transaction = row.original
      const isUpcoming = type === 'upcoming'
      const isPredicted = transaction.predicted
      const hasRecurringId = transaction.recurring_transaction_id

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                if (transaction.id !== undefined) {
                  navigator.clipboard.writeText(transaction.id.toString())
                }
              }}
            >
              Copy transaction ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
            {/* Edit action */}
            {isUpcoming && isPredicted ? (
              <DropdownMenuItem disabled className="text-muted-foreground">
                Predicted transaction (cannot be edited)
              </DropdownMenuItem>
            ) : isUpcoming && hasRecurringId ? (
              <DropdownMenuItem disabled className="text-muted-foreground">
                Upcoming transaction (cannot be edited)
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onEdit(transaction)}>
                Edit transaction
              </DropdownMenuItem>
            )}
            
            {/* Delete action */}
            {isUpcoming ? (
              <DropdownMenuItem disabled className="text-muted-foreground">
                Upcoming transactions cannot be deleted
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => {
                if (transaction.id !== undefined) {
                  onDelete(transaction.id)
                }
              }}>
                Delete transaction
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }
}

export function createTransactionColumns(options: ColumnOptions): ColumnDef<Transaction>[] {
  const { type } = options
  
  const columns: ColumnDef<Transaction>[] = [
    createSelectColumn(type),
    nameColumn,
    amountColumn,
    typeColumn,
    categoryColumn,
    descriptionColumn,
    createDateColumn(type),
  ]

  // Add end date column for recurring transactions
  if (type === 'recurring') {
    columns.push(endDateColumn)
  }

  // Add actions column
  columns.push(createActionsColumn(options))

  return columns
}
