'use client';

import { useState, useCallback } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app/app-sidebar';
import { AppHeader } from '@/components/app/app-header';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { usePathname } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth } from 'date-fns';

// Define header action props based on page
interface HeaderActionState {
  isAddTransactionOpen?: boolean;
  isAddRecurringTransactionOpen?: boolean;
  dateRange?: DateRange | null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoading } = useRequireAuth();
  const [headerState, setHeaderState] = useState<HeaderActionState>({
    isAddTransactionOpen: false,
    isAddRecurringTransactionOpen: false,
    dateRange: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
  });

  // Handler for date range picker
  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setHeaderState(prev => ({ ...prev, dateRange: range || null }));
    // Custom event for page components to listen to
    const event = new CustomEvent('header:daterangechange', { 
      detail: { dateRange: range } 
    });
    window.dispatchEvent(event);
  }, []);

  // Handler for opening transaction dialog
  const handleAddTransaction = useCallback(() => {
    setHeaderState(prev => ({ ...prev, isAddTransactionOpen: true }));
    // Custom event for page components to listen to
    const event = new CustomEvent('header:addtransaction');
    window.dispatchEvent(event);
  }, []);

  // Handler for opening recurring transaction dialog
  const handleAddRecurringTransaction = useCallback(() => {
    setHeaderState(prev => ({ ...prev, isAddRecurringTransactionOpen: true }));
    // Custom event for page components to listen to
    const event = new CustomEvent('header:addrecurringtransaction');
    window.dispatchEvent(event);
  }, []);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  // Determine which props to pass based on current path
  const getHeaderProps = () => {
    if (pathname === '/transactions') {
      return {
        onAddTransaction: handleAddTransaction,
        onDateRangeChange: handleDateRangeChange,
        dateRange: headerState.dateRange
      };
    }
    
    if (pathname === '/recurring-transactions') {
      return {
        onAddRecurringTransaction: handleAddRecurringTransaction
      };
    }
    
    // Default - no special actions
    return {};
  };

  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader {...getHeaderProps()} />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
