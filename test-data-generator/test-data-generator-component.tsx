'use client';

import { useState } from 'react';
import { useTransactions } from '@/hooks/use-transactions';
import { useRecurringTransactions } from '@/hooks/use-recurring-transactions';
import { generateIncomeTransactions, generateExpenseTransactions, generateRecurringTransactions } from './ai-data-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Simple progress bar component since @/components/ui/progress doesn't exist
import { toast } from 'sonner';
import { Loader2, Database, Sparkles, Trash2 } from 'lucide-react';

/**
 * Test Data Generator Component
 * 
 * This component generates realistic test data using AI and populates
 * your app by calling the actual transaction creation functions.
 * 
 * Add this to your dashboard or debug panel during development.
 */
export function TestDataGenerator() {
  const { createTransaction } = useTransactions();
  const { createRecurringTransaction } = useRecurringTransactions();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const generateAllData = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setProgress(0);
    setStatus('Generating income transactions...');

    try {
      // Generate income transactions
      const incomes = await generateIncomeTransactions(8);
      setProgress(10);
      setStatus('Creating income transactions...');
      
      for (let i = 0; i < incomes.length; i++) {
        await createTransaction({
          name: incomes[i].name,
          amount: incomes[i].amount,
          type: incomes[i].type,
          account_type: incomes[i].account_type,
          category_name: incomes[i].category,
          date: incomes[i].date,
          description: incomes[i].description,
        });
        setProgress(10 + Math.floor((i / incomes.length) * 20));
      }

      // Generate expense transactions
      setStatus('Generating expense transactions...');
      const expenses = await generateExpenseTransactions(25);
      setProgress(35);
      setStatus('Creating expense transactions...');
      
      for (let i = 0; i < expenses.length; i++) {
        await createTransaction({
          name: expenses[i].name,
          amount: expenses[i].amount,
          type: expenses[i].type,
          account_type: expenses[i].account_type,
          category_name: expenses[i].category,
          date: expenses[i].date,
          description: expenses[i].description,
        });
        setProgress(35 + Math.floor((i / expenses.length) * 35));
      }

      // Generate recurring transactions
      setStatus('Generating recurring transactions...');
      const recurrings = await generateRecurringTransactions(5);
      setProgress(75);
      setStatus('Creating recurring transactions...');
      
      for (let i = 0; i < recurrings.length; i++) {
        await createRecurringTransaction({
          name: recurrings[i].name,
          amount: recurrings[i].amount,
          type: recurrings[i].type,
          account_type: recurrings[i].account_type,
          category_name: recurrings[i].category,
          frequency: recurrings[i].frequency,
          start_date: recurrings[i].start_date,
          end_date: recurrings[i].end_date,
          description: recurrings[i].description,
        });
        setProgress(75 + Math.floor((i / recurrings.length) * 25));
      }

      setProgress(100);
      setStatus('Complete!');
      toast.success(`Generated ${incomes.length} income, ${expenses.length} expenses, and ${recurrings.length} recurring transactions`);
    } catch (error) {
      console.error('Error generating test data:', error);
      toast.error('Failed to generate test data. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateIncomeOnly = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setProgress(0);
    setStatus('Generating income transactions...');

    try {
      const incomes = await generateIncomeTransactions(5);
      
      for (let i = 0; i < incomes.length; i++) {
        await createTransaction({
          name: incomes[i].name,
          amount: incomes[i].amount,
          type: incomes[i].type,
          account_type: incomes[i].account_type,
          category_name: incomes[i].category,
          date: incomes[i].date,
          description: incomes[i].description,
        });
        setProgress(Math.floor((i / incomes.length) * 100));
      }

      toast.success(`Generated ${incomes.length} income transactions`);
    } catch (error) {
      toast.error('Failed to generate income data');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateExpensesOnly = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setProgress(0);
    setStatus('Generating expense transactions...');

    try {
      const expenses = await generateExpenseTransactions(20);
      
      for (let i = 0; i < expenses.length; i++) {
        await createTransaction({
          name: expenses[i].name,
          amount: expenses[i].amount,
          type: expenses[i].type,
          account_type: expenses[i].account_type,
          category_name: expenses[i].category,
          date: expenses[i].date,
          description: expenses[i].description,
        });
        setProgress(Math.floor((i / expenses.length) * 100));
      }

      toast.success(`Generated ${expenses.length} expense transactions`);
    } catch (error) {
      toast.error('Failed to generate expense data');
    } finally {
      setIsGenerating(false);
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <Card className="border-dashed border-2 border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Sparkles className="h-5 w-5" />
          AI Test Data Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-orange-700">
          Generate realistic test data using AI. This will create transactions by calling your actual app functions.
        </p>

        {!process.env.NEXT_PUBLIC_OPENAI_API_KEY && (
          <div className="rounded-lg bg-yellow-100 p-3 text-sm text-yellow-800">
            ⚠️ Add OPENAI_API_KEY to your .env.local file to use AI generation. 
            Otherwise, fallback data will be used.
          </div>
        )}

        {isGenerating && (
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-orange-200">
              <div 
                className="h-2 rounded-full bg-orange-600 transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-orange-600">{status}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={generateAllData}
            disabled={isGenerating}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4" />
            )}
            Generate All Data
          </Button>
          
          <Button
            variant="outline"
            onClick={generateIncomeOnly}
            disabled={isGenerating}
          >
            Income Only
          </Button>
          
          <Button
            variant="outline"
            onClick={generateExpensesOnly}
            disabled={isGenerating}
          >
            Expenses Only
          </Button>
        </div>

        <div className="text-xs text-orange-600 space-y-1">
          <p>Generates:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>5-8 Income transactions (Salary, Freelance, etc.)</li>
            <li>20-25 Expense transactions (Food, Rent, Entertainment, etc.)</li>
            <li>3-5 Recurring transactions (Rent, Subscriptions, etc.)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Export standalone function for programmatic use
export { generateIncomeTransactions, generateExpenseTransactions, generateRecurringTransactions };
