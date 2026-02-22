'use client';

import { useEffect } from 'react';
import { useSupabaseClient } from '@/utils/supabase/client';
import { createTransactionService } from '@/app/services/transaction-services';

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
  const supabase = useSupabaseClient();
  const transactionService = createTransactionService(supabase);

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // Expose hooks to window
      (window as any).__testDataHooks = {
        createTransaction: (data: any) => transactionService.createTransaction(data),
        createRecurringTransaction: (data: any) => transactionService.createRecurringTransaction(data),
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
  }, [transactionService]);

  return null; // This component doesn't render anything
}
