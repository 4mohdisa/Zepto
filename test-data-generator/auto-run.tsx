'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV === 'production') {
      console.log('🚫 Auto-population disabled in production');
      return;
    }

    // Check if already run in this session
    if (typeof window !== 'undefined' && (window as any).__dataPopulated) {
      console.log('ℹ️ Data already populated in this session');
      return;
    }

    const runPopulation = async () => {
      setStatus('running');
      console.log('🚀 Starting automatic data population...');
      
      try {
        await autoPopulateData(createTransaction, createRecurringTransaction);
        
        // Mark as populated
        if (typeof window !== 'undefined') {
          (window as any).__dataPopulated = true;
        }
        
        setStatus('complete');
        setProgress(100);
        
        // Show completion alert
        setTimeout(() => {
          alert('✅ Data population complete! Refresh the page to see all transactions.');
        }, 1000);
        
      } catch (error) {
        console.error('❌ Auto-population failed:', error);
        setStatus('error');
      }
    };

    // Run immediately
    runPopulation();
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
