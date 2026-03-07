'use client'

import { format } from 'date-fns'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/format'
import { Badge } from '@/components/ui/badge'
import { CreditCard } from 'lucide-react'
import { Transaction } from '@/types/transaction'
import { cn } from '@/lib/utils'

interface UpcomingTransactionsSectionProps {
  transactions: Transaction[]
  loading: boolean
  hasActiveRecurring: boolean
}

export function UpcomingTransactionsSection({ 
  transactions, 
  loading,
  hasActiveRecurring
}: UpcomingTransactionsSectionProps) {
  return (
    <div className="w-full space-y-4">
      {/* Simple header */}
      <div>
        <h2 className="text-base font-semibold text-gray-900">Upcoming transactions</h2>
        <p className="text-xs text-gray-500 mt-0.5">Predicted next occurrence for each recurring item</p>
      </div>
      
      <div className="w-full rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-b border-gray-200 bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 whitespace-nowrap">Date</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 whitespace-nowrap">Name</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 whitespace-nowrap text-right">Amount</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 whitespace-nowrap">Type</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 whitespace-nowrap">Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && transactions.length === 0 ? (
                // Skeleton rows while loading
                <>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-gray-100">
                      <TableCell className="py-4 px-4"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="py-4 px-4"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="py-4 px-4"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell className="py-4 px-4"><Skeleton className="h-5 w-14" /></TableCell>
                      <TableCell className="py-4 px-4"><Skeleton className="h-5 w-20" /></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow 
                    key={transaction.id} 
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="text-gray-900 py-4 px-4 whitespace-nowrap">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-gray-900 font-medium py-4 px-4">
                      {transaction.name}
                    </TableCell>
                    <TableCell className="text-gray-900 py-4 px-4 whitespace-nowrap text-right">
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
                    <TableCell className="text-gray-600 py-4 px-4">
                      <Badge 
                        variant="outline" 
                        className="text-xs font-medium rounded-md px-2 py-1 bg-gray-50 text-gray-700 border-gray-200"
                      >
                        {transaction.category_name || 'Uncategorized'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : hasActiveRecurring ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32">
                    <div className="flex flex-col items-center justify-center h-full px-4">
                      <p className="text-gray-500">No upcoming transactions in the current period</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-48">
                    <div className="flex flex-col items-center justify-center h-full px-4">
                      <div className="rounded-full w-16 h-16 mb-4 flex items-center justify-center bg-gradient-to-br from-[#635BFF]/10 to-blue-500/10">
                        <CreditCard className="h-8 w-8 text-[#635BFF]" />
                      </div>
                      <p className="text-gray-600 font-medium">No upcoming transactions</p>
                      <p className="text-sm text-gray-500 mt-1">Add a recurring transaction to see predictions</p>
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
