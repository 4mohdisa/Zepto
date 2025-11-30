import React from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/format';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Loader2 } from 'lucide-react';
import { useRecurringTransactions } from '@/hooks/use-recurring-transactions';

interface UpcomingTransactionsTableProps {
  limit?: number;
}

export function UpcomingTransactionsTable({ limit = 5 }: UpcomingTransactionsTableProps): React.ReactElement {
  const { upcomingTransactions, loading } = useRecurringTransactions();

  // Display only the first 'limit' transactions
  const displayedTransactions = upcomingTransactions.slice(0, limit);

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 whitespace-nowrap">Date</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 whitespace-nowrap">Name</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 whitespace-nowrap">Amount</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 whitespace-nowrap">Type</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 whitespace-nowrap">Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-[400px]">
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 text-[#635BFF] animate-spin mb-4" />
                    <p className="text-gray-600">Loading transactions...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayedTransactions.length > 0 ? (
              displayedTransactions.map((transaction: any, index: number) => (
                <TableRow key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <TableCell className="text-gray-900 py-4 px-4 whitespace-nowrap">
                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-gray-900 font-medium py-4 px-4">{transaction.name}</TableCell>
                  <TableCell className="text-gray-900 py-4 px-4 whitespace-nowrap">{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell className="py-4 px-4">
                    <Badge 
                      variant={transaction.type === 'Income' ? 'outline' : 'destructive'}
                      className={transaction.type === 'Income' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-700 border-red-200'}
                    >
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600 py-4 px-4">{transaction.category_name || 'Uncategorized'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-[400px]">
                  <div className="flex flex-col items-center justify-center h-full px-4">
                    <div className="rounded-full w-16 h-16 mb-4 flex items-center justify-center bg-gradient-to-br from-[#635BFF]/10 to-blue-500/10">
                      <CreditCard className="h-8 w-8 text-[#635BFF]" />
                    </div>
                    <p className="text-gray-600 font-medium">No upcoming transactions</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
