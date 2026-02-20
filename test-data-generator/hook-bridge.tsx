'use client';

import { useEffect } from 'react';
import { useTransactions } from '@/hooks/use-transactions';
import { useRecurringTransactions } from '@/hooks/use-recurring-transactions';

/**
 * Hook Bridge Component
 * 
 * This component exposes the transaction hooks to the browser console
 * so the test data generator can access them.
 * 
 * Add this component to your dashboard (dev only):
 * <HookBridge />
 * 
 * Then in console run:
 * populateRealisticData()  - For realistic personal data
 * generateTestData()       - For random test data
 */
export function HookBridge() {
  const { createTransaction } = useTransactions();
  const { createRecurringTransaction } = useRecurringTransactions();

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // Expose hooks to window
      (window as any).__testDataHooks = {
        createTransaction,
        createRecurringTransaction,
      };

      // Dynamically import both browser modules
      Promise.all([
        import('./browser'),
        import('./browser-realistic')
      ]).then(() => {
        console.log('🧪 Data Generators ready!');
        console.log('  populateRealisticData() - Your realistic transaction patterns');
        console.log('  generateTestData()      - Random test data');
      });
    }
  }, [createTransaction, createRecurringTransaction]);

  return null; // This component doesn't render anything
}
