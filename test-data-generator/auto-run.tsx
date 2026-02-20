'use client';

import { useEffect, useState, useRef } from 'react';
import { useTransactions } from '@/hooks/use-transactions';
import { useRecurringTransactions } from '@/hooks/use-recurring-transactions';
import { autoPopulateData, getErrorLogs, getSuccessLogs, clearLogs } from './auto-populate';

/**
 * AutoRunDataPopulation Component
 * 
 * This component automatically runs the data population on mount.
 * It will populate 300+ transactions and 30+ recurring transactions.
 * 
 * Usage: Add this component to your dashboard page:
 * <AutoRunDataPopulation />
 * 
 * Or import and call directly:
 * import { runAutoPopulation } from '@/test-data-generator/auto-run';
 * runAutoPopulation(createTransaction, createRecurringTransaction);
 */

export function AutoRunDataPopulation() {
  const { createTransaction } = useTransactions();
  const { createRecurringTransaction } = useRecurringTransactions();
  const [status, setStatus] = useState<'idle' | 'running' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const isMounted = useRef(false);

  useEffect(() => {
    // Mark as mounted
    isMounted.current = true;
    
    // DISABLED: Manual trigger only - uncomment to enable auto-population
    console.log('ℹ️ Auto-population is disabled. Run window.runTestDataPopulation() in console to populate data.');
    
    // Expose manual trigger
    if (typeof window !== 'undefined') {
      (window as any).runTestDataPopulation = async () => {
        if ((window as any).__dataPopulated) {
          alert('Data already populated. Refresh the page first.');
          return;
        }
        setStatus('running');
        await autoPopulateData(createTransaction, createRecurringTransaction);
        (window as any).__dataPopulated = true;
        setStatus('complete');
        alert('✅ Data population complete!');
      };
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [createTransaction, createRecurringTransaction]);

  // Don't render anything
  return null;
}

/**
 * Manual trigger function for running population programmatically
 */
export async function runAutoPopulation(
  createTransaction: (data: any) => Promise<any>,
  createRecurringTransaction: (data: any) => Promise<any>
): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).__dataPopulated) {
    console.log('ℹ️ Data already populated. Run clearLogs() and try again if needed.');
    return;
  }
  
  await autoPopulateData(createTransaction, createRecurringTransaction);
  
  if (typeof window !== 'undefined') {
    (window as any).__dataPopulated = true;
  }
}

// Export for console access
export { getErrorLogs, getSuccessLogs, clearLogs };

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).getErrorLogs = getErrorLogs;
  (window as any).getSuccessLogs = getSuccessLogs;
  (window as any).clearLogs = clearLogs;
  
  console.log('🧪 Auto-population helpers available:');
  console.log('  - getErrorLogs() - View all errors');
  console.log('  - getSuccessLogs() - View all successful creations');
  console.log('  - clearLogs() - Clear all logs');
}
