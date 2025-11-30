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
    <div className="w-full space-y-4 rounded-md border border-border overflow-x-auto bg-card shadow-lg hover:shadow-xl transition-all duration-300">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-surface">
            <TableHead className="text-xs font-semibold text-muted-foreground">Date</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Name</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Amount</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Type</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Category</TableHead>
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
              <TableRow key={index} className="border-b border-border/50 hover:bg-hover-surface transition-colors">
                <TableCell className="text-foreground">
                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="text-foreground font-medium">{transaction.name}</TableCell>
                <TableCell className="text-foreground">{formatCurrency(transaction.amount)}</TableCell>
                <TableCell>
                  <Badge 
                    variant={transaction.type === 'Income' ? 'outline' : 'destructive'}
                    className={transaction.type === 'Income' ? 'bg-success/10 text-success border-success/20 hover:bg-success/20' : ''}
                  >
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{transaction.category_name || 'Uncategorized'}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-[400px]">
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="rounded-full w-16 h-16 mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(76, 126, 243, 0.1) 0%, rgba(109, 76, 255, 0.1) 100%)' }}>
                    <CreditCard className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground font-medium">No transactions yet</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
