'use client';

import { useState } from 'react';
import { useTransactions } from '@/hooks/use-transactions';
import { useRecurringTransactions } from '@/hooks/use-recurring-transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Database, CheckCircle } from 'lucide-react';
import { generateRealisticData } from './realistic-data-populator';
import { toast } from 'sonner';

/**
 * Realistic Data Population Button
 * 
 * A visible button on the dashboard to populate realistic transaction data
 * based on the user's actual spending patterns.
 */
export function RealisticDataButton() {
  const { createTransaction } = useTransactions();
  const { createRecurringTransaction } = useRecurringTransactions();
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handlePopulate = async () => {
    if (isLoading || isComplete) return;
    
    setIsLoading(true);
    toast.info('Generating realistic transaction data... This may take a minute.');
    
    try {
      const result = await generateRealisticData(createTransaction, createRecurringTransaction);
      
      setIsComplete(true);
      toast.success(`Created ${result.income + result.expenses > 0 ? 'transactions' : 'data'} successfully!`);
      
      setTimeout(() => {
        alert(
          `✅ Realistic Data Population Complete!\n\n` +
          `💰 Total Income: $${result.income.toFixed(2)}\n` +
          `💸 Total Expenses: $${result.expenses.toFixed(2)}\n\n` +
          `Includes:\n` +
          `• Weekly payrun (~$1,700-$1,950)\n` +
          `• Previous salary ($850 until Feb 17)\n` +
          `• Side income & transfers\n` +
          `• 8 subscriptions (recurring)\n` +
          `• Weekly savings transfer (recurring)\n` +
          `• Shisha, lunch, OTR, coffee\n` +
          `• Savings, donations, parking\n` +
          `• Shopping & electronics\n\n` +
          `🔄 Refresh the page to see all transactions!`
        );
      }, 500);
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to populate data. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-blue-800">
          🏦 Populate Realistic Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-blue-600 mb-3">
          Generate realistic transaction data matching your actual spending patterns. 
          Includes income, subscriptions, lifestyle expenses, and more.
        </p>
        
        <Button
          onClick={handlePopulate}
          disabled={isLoading || isComplete}
          size="sm"
          className={`w-full ${
            isComplete 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Populating...
            </>
          ) : isComplete ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete! Refresh Page
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Populate My Data
            </>
          )}
        </Button>
        
        {isComplete && (
          <p className="text-xs text-green-600 mt-2 text-center">
            ✅ Data populated! Refresh to see transactions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
