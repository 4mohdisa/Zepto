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
  // Use hook instead of Redux
  const { upcomingTransactions, loading } = useRecurringTransactions();

  // Display only the first 'limit' transactions
  const displayedTransactions = upcomingTransactions.slice(0, limit);

  return (
    <div className="w-full space-y-4 rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-[400px]">
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground">Loading transactions...</p>
                </div>
              </TableCell>
            </TableRow>
          ) : displayedTransactions.length > 0 ? (
            displayedTransactions.map((transaction: any, index: number) => (
              <TableRow key={index}>
                <TableCell>
                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>{transaction.name}</TableCell>
                <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                <TableCell>
                  <Badge 
                    variant={transaction.type === 'Income' ? 'outline' : 'destructive'}
                    className={transaction.type === 'Income' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                  >
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.category_name || 'Uncategorized'}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-[400px]">
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="rounded-full bg-muted/30 w-16 h-16 mb-4 flex items-center justify-center">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
