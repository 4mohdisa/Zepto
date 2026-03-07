'use client'

import { useState, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Plus, Calendar } from 'lucide-react'
import { RecurringTransaction } from '@/types/transaction'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

interface RecurringTableProps {
  data: RecurringTransaction[]
  loading: boolean
  onEdit: (transaction: RecurringTransaction) => void
  onDelete: (id: number | string) => void
  onAdd: () => void
}

// Simple sort function
function sortByStartDate(items: RecurringTransaction[]): RecurringTransaction[] {
  return [...items].sort((a, b) => {
    const dateA = a.start_date ? new Date(a.start_date).getTime() : 0
    const dateB = b.start_date ? new Date(b.start_date).getTime() : 0
    return dateB - dateA // Descending (newest first)
  })
}

export function RecurringTable({
  data,
  loading,
  onEdit,
  onDelete,
  onAdd,
}: RecurringTableProps) {
  const sortedData = useMemo(() => sortByStartDate(data), [data])
  const [isVisible, setIsVisible] = useState(false)

  // Trigger fade-in when data is loaded
  useMemo(() => {
    if (!loading && sortedData.length > 0) {
      // Small delay to ensure DOM is ready for transition
      const timer = setTimeout(() => setIsVisible(true), 50)
      return () => clearTimeout(timer)
    } else if (loading) {
      setIsVisible(false)
    }
  }, [loading, sortedData.length])

  const handleEdit = useCallback((transaction: RecurringTransaction) => {
    onEdit(transaction)
  }, [onEdit])

  const handleDelete = useCallback((id: number | string) => {
    onDelete(id)
  }, [onDelete])

  const formatDate = (dateValue: string | Date | null | undefined): string => {
    if (!dateValue) return '—'
    try {
      return format(new Date(dateValue), 'MMM dd, yyyy')
    } catch {
      return '—'
    }
  }

  // Handle row click - open edit dialog, but not when clicking actions
  const handleRowClick = useCallback((e: React.MouseEvent, transaction: RecurringTransaction) => {
    // Don't trigger edit if clicking action button or dropdown
    const target = e.target as HTMLElement
    if (
      target.closest('button') || 
      target.closest('[data-dropdown]')
    ) {
      return
    }
    onEdit(transaction)
  }, [onEdit])

  return (
    <div className="w-full space-y-4">
      {/* Simple header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Active recurring</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage your automated payments</p>
        </div>
        
        <Button 
          onClick={onAdd} 
          size="sm"
          className="bg-[#635BFF] hover:bg-[#5851EA] text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> 
          Add recurring
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-full table-fixed">
            <TableHeader>
              <TableRow className="border-b border-gray-200 bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4">Name</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 text-right w-28">Amount</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 w-20">Type</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 w-32">Category</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 w-28">Start Date</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 w-28">End Date</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 w-14"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && sortedData.length === 0 ? (
                // Skeleton rows while loading initial data - no empty flash
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-gray-100">
                      <TableCell className="py-4 px-4"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="py-4 px-4"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell className="py-4 px-4"><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell className="py-4 px-4"><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="py-4 px-4"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="py-4 px-4"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="py-4 px-4"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : sortedData.length > 0 ? (
                sortedData.map((transaction, index) => (
                  <TableRow
                    key={transaction.id}
                    onClick={(e) => handleRowClick(e, transaction)}
                    className={cn(
                      "border-b border-gray-100 hover:bg-gray-50/80 transition-all duration-200 cursor-pointer",
                      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                    )}
                    style={{ transitionDelay: `${Math.min(index * 30, 300)}ms` }}
                  >
                    <TableCell className="py-4 px-4 text-sm font-medium text-gray-900 truncate">
                      {transaction.name}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-sm text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs font-medium rounded-md px-2 py-1",
                          transaction.type === 'Income' 
                            ? "bg-green-50 text-green-700 border-green-200" 
                            : "bg-red-50 text-red-700 border-red-200"
                        )}
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-4 text-sm text-gray-600">
                      <Badge 
                        variant="outline" 
                        className="text-xs font-medium rounded-md px-2 py-1 bg-gray-50 text-gray-700 border-gray-200"
                      >
                        {transaction.category_name || 'Uncategorized'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(transaction.start_date)}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-sm text-gray-600 whitespace-nowrap">
                      {transaction.end_date ? formatDate(transaction.end_date) : 'No end date'}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" data-dropdown>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => transaction.id && handleDelete(transaction.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                // Empty state - only when not loading and no data
                <TableRow>
                  <TableCell colSpan={7} className="h-48">
                    <div className="flex flex-col items-center justify-center h-full px-4">
                      <div className="rounded-full w-16 h-16 mb-4 flex items-center justify-center bg-gradient-to-br from-[#635BFF]/10 to-blue-500/10">
                        <Calendar className="h-8 w-8 text-[#635BFF]" />
                      </div>
                      <p className="text-gray-600 font-medium">No recurring transactions yet</p>
                      <p className="text-sm text-gray-500 mt-1">Add your first recurring transaction</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
